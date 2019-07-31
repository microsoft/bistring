# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from __future__ import annotations

__all__ = ['Alignment']

import bisect
from typing import Any, Callable, Iterable, Iterator, List, Optional, Sequence, Tuple, TypeVar, Union, cast, overload

from ._typing import AnyBounds, Bounds, Index, Range


T = TypeVar('T')
U = TypeVar('U')
Real = Union[int, float]
CostFn = Callable[[Optional[T], Optional[U]], Real]


class Alignment:
    r"""
    An alignment between two related sequences.

    Consider this alignments between two strings:

    .. code-block:: text

        |it's| |aligned!|
        |    \ \        |
        |it is| |aligned|

    An alignment stores all the indices that are known to correspond between the original and modified sequences.  For
    the above example, it would be

        >>> a = Alignment([
        ...     (0, 0),
        ...     (4, 5),
        ...     (5, 6),
        ...     (13, 13),
        ... ])

    Alignments can be used to answer questions like, "what's the smallest range of the original sequence that is
    guaranteed to contain this part of the modified sequence?"  For example, the range ``(0, 5)`` ("it is") is known to
    match the range ``(0, 4)`` ("it's") of the original sequence:

        >>> a.original_bounds(0, 5)
        (0, 4)

    Results may be imprecise if the alignment is too course to match the exact inputs:

        >>> a.original_bounds(0, 2)
        (0, 4)

    A more granular alignment like this:

    .. code-block:: text

        |i|t|'s| |a|l|i|g|n|e|d|!|
        | | |  \ \ \ \ \ \ \ \ \ /
        |i|t| is| |a|l|i|g|n|e|d|

    .. doctest::

        >>> a = Alignment([
        ...     (0, 0), (1, 1), (2, 2), (4, 5), (5, 6), (6, 7), (7, 8),
        ...     (8, 9), (9, 10), (10, 11), (11, 12), (12, 13), (13, 13),
        ... ])

    Can be more precise:

        >>> a.original_bounds(0, 2)
        (0, 2)
    """

    __slots__ = ('_original', '_modified')

    _original: List[int]
    _modified: List[int]

    def __init__(self, values: Iterable[Bounds]):
        """
        :param values:
            The sequence of aligned indices.  Each element should be a tuple ``(x, y)``, where `x` is the original
            sequence position and `y` is the modified sequence position.
        """

        self._original = []
        self._modified = []
        for i, j in values:
            if self._original:
                if i < self._original[-1]:
                    raise ValueError('Original sequence position moved backwards')
                elif j < self._modified[-1]:
                    raise ValueError('Modified sequence position moved backwards')
                elif i == self._original[-1] and j == self._modified[-1]:
                    continue

            self._original.append(i)
            self._modified.append(j)

        if not self._original:
            raise ValueError('No sequence positions to align')

    @classmethod
    def _create(cls, original: List[int], modified: List[int]) -> Alignment:
        result: Alignment = super().__new__(cls)
        result._original = original
        result._modified = modified
        return result

    def __str__(self) -> str:
        i, j = self._original[0], self._original[-1]
        k, l = self._modified[0], self._modified[-1]
        if self._original == list(range(i, j + 1)) and self._modified == list(range(k, l + 1)):
            return f'[{i}:{j}⇋{k}:{l}]'
        else:
            return '[' + ', '.join(f'{i}⇋{j}' for i, j in self) + ']'

    def __repr__(self) -> str:
        i, j = self._original[0], self._original[-1]
        if self._original == list(range(i, j + 1)) and self._modified == list(range(i, j + 1)):
            if i == 0:
                return f'Alignment.identity({j})'
            else:
                return f'Alignment.identity({i}, {j})'
        else:
            return 'Alignment([' + ', '.join(map(repr, self)) + '])'

    def __eq__(self, other: Any) -> bool:
        if isinstance(other, Alignment):
            return (self._original, self._modified) == (other._original, other._modified)
        else:
            return NotImplemented

    @classmethod
    def _parse_bounds(cls, args: Tuple[AnyBounds, ...]) -> Bounds:
        l = len(args)
        if l == 0:
            raise TypeError('Not enough arguments')
        elif l == 1:
            arg = args[0]
            if isinstance(arg, range):
                return arg.start, arg.stop
            elif isinstance(arg, slice):
                if arg.start is None or arg.stop is None:
                    raise ValueError('slice with unspecified bounds')
                return arg.start, arg.stop
            elif isinstance(arg, tuple):
                return arg
            else:
                return 0, arg
        elif l == 2:
            return cast(Bounds, args)
        else:
            raise TypeError('Too many arguments')

    @classmethod
    def _parse_optional_bounds(cls, args: Tuple[AnyBounds, ...]) -> Union[Bounds, Tuple[None, None]]:
        if len(args) == 0:
            return None, None
        else:
            return cls._parse_bounds(args)

    @overload
    @classmethod
    def identity(cls, __length: int) -> Alignment: ...

    @overload
    @classmethod
    def identity(cls, __start: int, __stop: int) -> Alignment: ...

    @overload
    @classmethod
    def identity(cls, __bounds: Range) -> Alignment: ...

    @classmethod
    def identity(cls, *args: Union[int, range, slice, Bounds]) -> Alignment:
        """
        Create an identity alignment, which maps all intervals to themselves.  You can pass the size of the sequence:

            >>> Alignment.identity(5)
            Alignment.identity(5)

        or the start and end positions:

            >>> Alignment.identity(1, 5)
            Alignment.identity(1, 5)

        or a range-like object (:class:`range`, :class:`slice`, or ``Tuple[int, int]``):

            >>> Alignment.identity(range(1, 5))
            Alignment.identity(1, 5)
        """

        start, stop = cls._parse_bounds(args)
        values = list(range(start, stop + 1))
        return cls._create(values, values)

    @classmethod
    def _infer_costs(cls, original: Sequence[T], modified: Sequence[U], cost_fn: CostFn[T, U]) -> List[Real]:
        """
        The Needleman–Wunsch or Wagner–Fischer algorithm.  Here we use it in a way that only computes the final row of
        costs, without finding the alignment itself.  Hirschberg's algorithm uses it as a subroutine to find the optimal
        alignment in less than O(N*M) space.

        https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm
        https://en.wikipedia.org/wiki/Wagner%E2%80%93Fischer_algorithm
        """

        row: List[Real] = [0]
        for i, m in enumerate(modified):
            cost = row[i] + cost_fn(None, m)
            row.append(cost)

        prev: List[Real] = [0] * len(row)

        for o in original:
            prev, row = row, prev
            row[0] = prev[0] + cost_fn(o, None)

            for i, m in enumerate(modified):
                sub_cost = prev[i] + cost_fn(o, m)
                del_cost = prev[i + 1] + cost_fn(o, None)
                ins_cost = row[i] + cost_fn(None, m)
                row[i + 1] = min(sub_cost, del_cost, ins_cost)

        return row

    @classmethod
    def _infer_matrix(cls, original: Sequence[T], modified: Sequence[U], cost_fn: CostFn[T, U]) -> List[Bounds]:
        """
        The Needleman–Wunsch or Wagner–Fischer algorithm, using the entire matrix to compute the optimal alignment.
        """

        row: List[Tuple[Real, int, int]] = [(0, -1, -1)]
        for j, m in enumerate(modified):
            cost = row[j][0] + cost_fn(None, m)
            row.append((cost, 0, j))

        matrix = [row]

        for i, o in enumerate(original):
            prev = matrix[i]
            cost = prev[0][0] + cost_fn(o, None)
            row = [(cost, i, 0)]

            for j, m in enumerate(modified):
                cost = prev[j][0] + cost_fn(o, m)
                x, y = i, j

                del_cost = prev[j + 1][0] + cost_fn(o, None)
                if del_cost < cost:
                    cost = del_cost
                    x, y = i, j + 1

                ins_cost = row[j][0] + cost_fn(None, m)
                if ins_cost < cost:
                    cost = ins_cost
                    x, y = i + 1, j

                row.append((cost, x, y))

            matrix.append(row)

        result = []
        i = len(matrix) - 1
        j = len(matrix[i]) - 1
        while i >= 0:
            result.append((i, j))
            _, i, j = matrix[i][j]

        result.reverse()
        return result

    @classmethod
    def _infer_recursive(cls, original: Sequence[T], modified: Sequence[U], cost_fn: CostFn[T, U]) -> List[Bounds]:
        """
        Hirschberg's algorithm for computing optimal alignments in linear space.

        https://en.wikipedia.org/wiki/Hirschberg's_algorithm
        """

        if len(original) <= 1 or len(modified) <= 1:
            return cls._infer_matrix(original, modified, cost_fn)

        omid = len(original) // 2
        oleft = original[:omid]
        oright = original[omid:]

        lcosts = cls._infer_costs(oleft, modified, cost_fn)
        rcosts = cls._infer_costs(oright[::-1], modified[::-1], cost_fn)[::-1]

        mmid = min(range(len(lcosts)), key=lambda i: lcosts[i] + rcosts[i])
        mleft = modified[:mmid]
        mright = modified[mmid:]

        left = cls._infer_recursive(oleft, mleft, cost_fn)
        right = cls._infer_recursive(oright, mright, cost_fn)
        for (o, m) in right:
            left.append((o + omid, m + mmid))
        return left

    @classmethod
    def infer(cls, original: Sequence[T], modified: Sequence[U], cost_fn: Optional[CostFn[T, U]] = None) -> Alignment:
        """
        Infer the alignment between two sequences with the lowest edit distance.

            >>> Alignment.infer('color', 'color')
            Alignment.identity(5)
            >>> a = Alignment.infer('color', 'colour')
            >>> # 'ou' -> 'o'
            >>> a.original_bounds(3, 5)
            (3, 4)

        Warning: this operation has time complexity ``O(N*M)``, where `N` and `M` are the lengths of the original and
        modified sequences, and so should only be used for relatively short sequences.

        :param original:
            The original sequence.
        :param modified:
            The modified sequence.
        :param cost_fn:
            A function returning the cost of performing an edit.  ``cost_fn(a, b)`` returns the cost of replacing `a`
            with `b`.  ``cost_fn(a, None)`` returns the cost of deleting `a`, and ``cost_fn(None, b)`` returns the cost
            of inserting `b`.  By default, all operations have cost 1 except replacing identical elements, which has
            cost 0.
        :returns:
            The inferred alignment.
        """

        if cost_fn is None:
            real_cost_fn: CostFn[T, U] = lambda a, b: int(a != b)
        else:
            real_cost_fn = cost_fn

        if len(original) < len(modified):
            swapped_cost_fn = lambda a, b: real_cost_fn(b, a)
            result = cls._infer_recursive(modified, original, swapped_cost_fn)
            return Alignment(result).inverse()
        else:
            result = cls._infer_recursive(original, modified, real_cost_fn)
            return Alignment(result)

    def __iter__(self) -> Iterator[Tuple[int, int]]:
        return zip(self._original, self._modified)

    def __len__(self) -> int:
        return len(self._original)

    @overload
    def __getitem__(self, index: int) -> Bounds: ...

    @overload
    def __getitem__(self, index: slice) -> Alignment: ...

    def __getitem__(self, index: Index) -> Union[Bounds, Alignment]:
        """
        Indexing an alignment returns the nth pair of aligned positions:

            >>> a = Alignment.identity(5)
            >>> a[3]
            (3, 3)

        Slicing an alignment returns a new alignment with a subrange of its values:

            >>> a[1:5]
            Alignment.identity(1, 4)
        """

        if isinstance(index, slice):
            start, stop, stride = index.indices(len(self))
            if stride != 1:
                raise ValueError('Non-unit strides not supported')
            return self._create(self._original[index], self._modified[index])
        else:
            return (self._original[index], self._modified[index])

    def shift(self, delta_o: int, delta_m: int) -> Alignment:
        """
        Shift this alignment.

        :param delta_o:
            The distance to shift the original sequence.
        :param delta_m:
            The distance to shift the modified sequence.
        :returns:
            An alignment with all the positions shifted by the given amounts.
        """

        return self._create(
            [o + delta_o for o in self._original],
            [m + delta_m for m in self._modified],
        )

    def _search(self, source: List[int], start: int, stop: int) -> Bounds:
        first = bisect.bisect_right(source, start)
        if first == 0:
            raise IndexError('range start too small')
        first -= 1

        last = bisect.bisect_left(source, stop, first)
        if last == len(source):
            raise IndexError('range end too big')

        return first, last

    def _bounds(self, source: List[int], target: List[int], args: Tuple[AnyBounds, ...]) -> Bounds:
        start, stop = self._parse_optional_bounds(args)
        if start is None or stop is None:
            i, j = 0, -1
        else:
            i, j = self._search(source, start, stop)
        return (target[i], target[j])

    def original_bounds(self, *args: AnyBounds) -> Bounds:
        """
        Maps a subrange of the modified sequence to the original sequence.  Can be called with either two arguments:

            >>> a = Alignment.identity(5).shift(1, 0)
            >>> a.original_bounds(1, 3)
            (2, 4)

        or with a range-like object:

            >>> a.original_bounds(range(1, 3))
            (2, 4)

        With no arguments, returns the bounds of the entire original sequence:

            >>> a.original_bounds()
            (1, 6)

        :returns:
            The corresponding bounds in the original sequence.
        """

        return self._bounds(self._modified, self._original, args)

    def original_range(self, *args: AnyBounds) -> range:
        """
        Like :meth:`original_bounds`, but returns a :class:`range`.
        """
        return range(*self.original_bounds(*args))

    def original_slice(self, *args: AnyBounds) -> slice:
        """
        Like :meth:`original_bounds`, but returns a :class:`slice`.
        """
        return slice(*self.original_bounds(*args))

    def modified_bounds(self, *args: AnyBounds) -> Bounds:
        """
        Maps a subrange of the original sequence to the modified sequence.  Can be called with either two arguments:

            >>> a = Alignment.identity(5).shift(1, 0)
            >>> a.modified_bounds(2, 4)
            (1, 3)

        or with a range-like object:

            >>> a.modified_bounds(range(2, 4))
            (1, 3)

        With no arguments, returns the bounds of the entire modified sequence:

            >>> a.modified_bounds()
            (0, 5)

        :returns:
            The corresponding bounds in the modified sequence.
        """

        return self._bounds(self._original, self._modified, args)

    def modified_range(self, *args: AnyBounds) -> range:
        """
        Like :meth:`modified_bounds`, but returns a :class:`range`.
        """
        return range(*self.modified_bounds(*args))

    def modified_slice(self, *args: AnyBounds) -> slice:
        """
        Like :meth:`modified_bounds`, but returns a :class:`range`.
        """
        return slice(*self.modified_bounds(*args))

    def slice_by_original(self, *args: AnyBounds) -> Alignment:
        """
        Slice this alignment by a span of the original sequence.

            >>> a = Alignment.identity(5).shift(1, 0)
            >>> a.slice_by_original(2, 4)
            Alignment([(2, 1), (3, 2), (4, 3)])

        :returns:
            The slice of this alignment that corresponds with the given span of the original sequence.
        """

        start, stop = self._parse_bounds(args)
        first, last = self._search(self._original, start, stop)
        original = self._original[first:last+1]
        original = [min(max(i, start), stop) for i in original]
        modified = self._modified[first:last+1]
        return self._create(original, modified)

    def slice_by_modified(self, *args: AnyBounds) -> Alignment:
        """
        Slice this alignment by a span of the modified sequence.

            >>> a = Alignment.identity(5).shift(1, 0)
            >>> a.slice_by_modified(1, 3)
            Alignment([(2, 1), (3, 2), (4, 3)])

        :returns:
            The slice of this alignment that corresponds with the given span of the modified sequence.
        """

        start, stop = self._parse_bounds(args)
        first, last = self._search(self._modified, start, stop)
        original = self._original[first:last+1]
        modified = self._modified[first:last+1]
        modified = [min(max(i, start), stop) for i in modified]
        return self._create(original, modified)

    def __add__(self, other: Any) -> Alignment:
        """
        Concatenate two alignments.
        """

        if not isinstance(other, Alignment):
            return NotImplemented

        o_orig = other._original
        o_mod = other._modified

        if o_orig[0] < self._original[-1]:
            raise ValueError('Original sequence position moved backwards')
        elif o_mod[0] < self._modified[-1]:
            raise ValueError('Modified sequence position moved backwards')
        elif o_orig[0] == self._original[-1] and o_mod[0] == self._modified[-1]:
            o_orig = o_orig[1:]
            o_mod = o_mod[1:]

        return self._create(self._original + o_orig, self._modified + o_mod)

    def compose(self, other: Alignment) -> Alignment:
        """
        :returns:
            A new alignment equivalent to applying this one first, then the `other`.
        """

        if self.modified_bounds() != other.original_bounds():
            raise ValueError('Incompatible alignments')

        original = []
        modified = []
        i, i_max = 0, len(self)
        j, j_max = 0, len(other)

        while i < i_max:
            # Map self._original[i] to its lower bound in other
            while self._modified[i] > other._original[j]:
                j += 1
            while self._modified[i] < other._original[j] and self._modified[i + 1] <= other._original[j]:
                i += 1
            original.append(self._original[i])
            modified.append(other._modified[j])

            # Map self._original[i] to its upper bound in other (if it's different)
            while i + 1 < i_max and self._original[i] == self._original[i + 1]:
                i += 1

            needs_upper = False
            while j + 1 < j_max and self._modified[i] >= other._original[j + 1]:
                needs_upper = True
                j += 1
            if needs_upper:
                original.append(self._original[i])
                modified.append(other._modified[j])

            i += 1

        return self._create(original, modified)

    def inverse(self) -> Alignment:
        """
        :returns:
            The inverse of this alignment, from the modified to the original sequence.
        """
        return self._create(self._modified, self._original)

# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from __future__ import annotations

__all__ = ['Alignment', 'AlignmentBuilder']

from dataclasses import dataclass
import bisect
from typing import Any, Callable, Iterable, Iterator, List, Optional, Sequence, Tuple, TypeVar, Union, cast, overload

from ._typing import AnyBounds, BiIndex, Bounds, Index, Range


T = TypeVar('T')
U = TypeVar('U')
Real = Union[int, float]
CostFn = Callable[[Optional[T], Optional[U]], Real]


@dataclass
class ArithmeticProgression:
    """
    An arithmetic progression ``a[0] = start, a[1] = a[0] + stride, ...``.

    Similar to the :class:`range` type, but allows a stride of zero.
    """

    __slots__ = ('first', 'last', 'stride', 'length')

    first: int
    """
    The initial value of the sequence.
    """

    last: int
    """
    The final value of the sequence.
    """

    stride: int
    """
    The difference between successive sequence elements.
    """

    length: int
    """
    The length of the sequence.
    """

    def __init__(self, first: int, stride: int, length: int):
        # Canonicalize equivalent ranges
        if length <= 1:
            if length == 0:
                start = 0
            stride = 0

        self.first = first
        self.last = first + (length - 1) * stride
        self.stride = stride
        self.length = length

    def __str__(self) -> str:
        if self.length <= 3:
            return str(list(self))
        elif self.stride == 0:
            return f'[{self.first}] * {self.length}'
        else:
            return f'[{self[0]}, {self[1]}, ..., {self[-1]}]'

    def __repr__(self) -> str:
        return f'ArithmeticProgression({self.first}, {self.stride}, {self.length})'

    def __iter__(self) -> Iterator[int]:
        n = self.first
        for _ in range(self.length):
            yield n
            n += self.stride

    def __len__(self) -> int:
        return self.length

    @overload
    def __getitem__(self, index: int) -> int: ...

    @overload
    def __getitem__(self, index: slice) -> ArithmeticProgression: ...

    def __getitem__(self, index: Index) -> Union[int, ArithmeticProgression]:
        if isinstance(index, slice):
            start, stop, stride = index.indices(self.length)
            first = self.first + start * self.stride
            length = (stop - start + stride - 1) // stride
            return ArithmeticProgression(first, stride * self.stride, length)
        else:
            i = index
            if i < 0:
                i += self.length
            if i < 0 or i >= self.length:
                raise IndexError(f'Index {index} out of range of length-{self.length} arithmetic progression')
            return self.first + i * self.stride

    def __add__(self, other: Any) -> ArithmeticProgression:
        if not isinstance(other, int):
            return NotImplemented
        else:
            return ArithmeticProgression(self.first + other, self.stride, self.length)


class AlignmentBuilder:
    """
    A builder for :class:`Alignment`\\ s.
    """

    def __init__(self, values: Iterable[BiIndex] = ()):
        """
        :param values:
            A sequence of aligned indices to start with, possibly an :class:`Alignment`.
        """

        self._original: List[ArithmeticProgression] = []
        self._modified: List[ArithmeticProgression] = []

        self.extend(values)

    def append(self, o: int, m: int) -> None:
        """
        Add a pair of aligned indices to the alignment.

        :param o:
            The index in the original sequence.
        :param m:
            The corresponding index in the modified sequence.
        """

        if self._original:
            o_prog = self._original[-1]
            m_prog = self._modified[-1]

            o_stride = o - o_prog.last
            m_stride = m - m_prog.last

            if o_stride < 0:
                raise ValueError('Original sequence position moved backwards')
            elif m_stride < 0:
                raise ValueError('Modified sequence position moved backwards')
            elif o_stride == 0 and m_stride == 0:
                return
            elif o_prog.length == 1 or (o_stride == o_prog.stride and m_stride == m_prog.stride):
                o_prog.last = o
                o_prog.stride = o_stride
                o_prog.length += 1

                m_prog.last = m
                m_prog.stride = m_stride
                m_prog.length += 1

                return

        self._original.append(ArithmeticProgression(o, 0, 1))
        self._modified.append(ArithmeticProgression(m, 0, 1))

    def _append_progression(self, o: ArithmeticProgression, m: ArithmeticProgression) -> None:
        # Defensive copy
        o = o[:]
        m = m[:]

        if self._original:
            o_prev = self._original[-1]
            m_prev = self._modified[-1]

            if o.first == o_prev.last and m.first == m_prev.last:
                o = o[1:]
                m = m[1:]
                if not o:
                    return

            o_stride = o.first - o_prev.last
            m_stride = m.first - m_prev.last
            if o_prev.length == 1 or (o_stride == o_prev.stride and m_stride == m_prev.stride):
                o_prev.stride = o_stride
                m_prev.stride = m_stride

                if o_stride == o.stride or m_stride == m.stride:
                    o_prev.last = o.last
                    o_prev.length += o.length

                    m_prev.last = m.last
                    m_prev.length += m.length

                    return
                else:
                    o_prev.last = o.first
                    o_prev.length += 1

                    m_prev.last = o.first
                    m_prev.length += 1

                    o = o[1:]
                    m = m[1:]
                    if not o:
                        return

        self._original.append(o)
        self._modified.append(m)

    def extend(self, values: Iterable[BiIndex]) -> None:
        """
        Add some values to the alignment.

        :param values:
            The values to append.
        """

        if isinstance(values, Alignment):
            for os, ms in zip(values._original, values._modified):
                self._append_progression(os, ms)
        else:
            for o, m in values:
                self.append(o, m)

    def build(self) -> Alignment:
        """
        :returns:
            The built alignment.
        """

        original = self._original[:]
        modified = self._modified[:]

        if len(original) == 0:
            raise ValueError('No sequence positions to align')

        # Clone the last element in case we modify it in the future
        original[-1] = original[-1][:]
        modified[-1] = modified[-1][:]

        return Alignment._create(original, modified)


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
        >>> print(a)
        [0⇋0, 4⇋5, 5⇋6, 13⇋13]

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
        >>> print(a)
        [0⇋0, 1⇋1, 2⇋2, 4⇋5, 5⇋6, ..., 12⇋13, 13⇋13]

    Can be more precise:

        >>> a.original_bounds(0, 2)
        (0, 2)
    """

    # For space and time efficiency, Alignments use a representation that compresses runs of indices with a common
    # difference -- i.e., arithmetic progressions.  So e.g. [(0, 0), (1, 1), (2, 2), (3, 4), (4, 6), (5, 8)] is stored
    #
    #     _original = [ArithmeticProgression(0, 1, 3), ArithmeticProgression(3, 1, 3)]
    #     _modified = [ArithmeticProgression(0, 1, 3), ArithmeticProgression(4, 2, 3)]
    #     _lengths  = [0, 3, 6]

    __slots__ = ('_original', '_modified', '_lengths')

    _original: List[ArithmeticProgression]
    """
    The indices in the original sequence.
    """

    _modified: List[ArithmeticProgression]
    """
    The indices in the modified sequence.
    """

    _lengths: List[int]
    """
    A running total of the lengths of each sub-progression, to support random access.
    """

    def __new__(cls, values: Iterable[BiIndex]) -> Alignment:
        """
        :param values:
            The sequence of aligned indices.  Each element should be a tuple ``(x, y)``, where `x` is the original
            sequence position and `y` is the modified sequence position.
        """
        return AlignmentBuilder(values).build()

    @classmethod
    def _create(cls, original: List[ArithmeticProgression], modified: List[ArithmeticProgression], lengths: Optional[List[int]] = None) -> Alignment:
        if lengths is None:
            lengths = [0]
            for ap in original:
                lengths.append(lengths[-1] + len(ap))

        result: Alignment = super().__new__(cls)
        result._original = original
        result._modified = modified
        result._lengths = lengths
        return result

    def __str__(self) -> str:
        chunks = []
        for o, m in zip(self._original, self._modified):
            chunks.append(f'{o[0]}⇋{m[0]}')
            if len(o) > 1:
                chunks.append(f'{o[1]}⇋{m[1]}')
            if len(o) > 3:
                chunks.append('...')
            if len(o) > 2:
                chunks.append(f'{o[-1]}⇋{m[-1]}')
        return '[' + ', '.join(chunks) + ']'

    def __repr__(self) -> str:
        if len(self._original) == 1 and self._original[0].stride == 1 and self._original == self._modified:
            i, j = self.original_bounds()
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

            >>> print(Alignment.identity(5))
            [0⇋0, 1⇋1, ..., 5⇋5]

        or the start and end positions:

            >>> print(Alignment.identity(1, 6))
            [1⇋1, 2⇋2, ..., 6⇋6]

        or a range-like object (:class:`range`, :class:`slice`, or ``Tuple[int, int]``):

            >>> print(Alignment.identity(range(2, 7)))
            [2⇋2, 3⇋3, ..., 7⇋7]
        """

        start, stop = cls._parse_bounds(args)
        ap = [ArithmeticProgression(start, 1, stop - start + 1)]
        return cls._create(ap, ap)

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

    def __iter__(self) -> Iterator[BiIndex]:
        for o, m in zip(self._original, self._modified):
            yield from zip(o, m)

    def __len__(self) -> int:
        return self._lengths[-1]

    def _index(self, index: int, start: int = 0) -> BiIndex:
        """
        :returns:
            ``i, j`` such that ``self._{original,modified}[i][j]`` is at the given `index`.
        """

        i = bisect.bisect_right(self._lengths, index, start + 1) - 1
        j = index - self._lengths[i]
        return i, j

    def _slice(self, i: int, j: int, k: int, l: int) -> Alignment:
        """
        :returns:
            The slice of this alignment from ``[i][j]`` to ``[k][l]``.
        """

        if i == k:
            original = [self._original[i][j:l]]
            modified = [self._modified[i][j:l]]
        else:
            original = [self._original[i][j:]]
            modified = [self._modified[i][j:]]

            original.extend(self._original[i+1:k])
            modified.extend(self._modified[i+1:k])

            if l > 0:
                original.append(self._original[k][:l])
                modified.append(self._modified[k][:l])

        return self._create(original, modified)

    @overload
    def __getitem__(self, index: int) -> BiIndex: ...

    @overload
    def __getitem__(self, index: slice) -> Alignment: ...

    def __getitem__(self, index: Index) -> Union[BiIndex, Alignment]:
        """
        Indexing an alignment returns the nth pair of aligned positions:

            >>> a = Alignment.identity(5)
            >>> a[3]
            (3, 3)

        Slicing an alignment returns a new alignment with a subrange of its values:

            >>> print(a[1:5])
            [1⇋1, 2⇋2, ..., 4⇋4]
        """

        if isinstance(index, slice):
            start, stop, stride = index.indices(len(self))
            if stride != 1:
                raise ValueError('Non-unit strides not supported')

            i, j = self._index(start)
            k, l = self._index(stop, i)
            return self._slice(i, j, k, l)
        else:
            if index < 0:
                index += len(self)
            i, j = self._index(index)
            return (self._original[i][j], self._modified[i][j])

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

        original = [o + delta_o for o in self._original]
        modified = [m + delta_m for m in self._modified]
        return self._create(original, modified, self._lengths)

    def _search(self, source: List[ArithmeticProgression], start: int, stop: int) -> Tuple[int, int, int, int]:
        """
        Find the smallest subrange of the `source` that contains the given bounds.

        :param source:
            The sequence to search (original or modified).
        :param start:
            The start of the target range.
        :param end:
            The end of the target range.
        :returns:
            The smallest range ``i, j, k, l`` such that ``source[i][j] <= start <= stop <= source[k][l]``.
        """

        # Find the last value <= start
        i = 0
        high = len(source)
        while i < high:
            mid = (i + high) // 2
            if start < source[mid].last:
                high = mid
            else:
                i = mid + 1

        if i == len(source) or source[i][0] > start:
            i -= 1
            if i < 0:
                raise IndexError('range start too small')
            j = len(source[i]) - 1
        else:
            ap = source[i]
            j = (start - ap.first) // ap.stride

        # Find the first value >= stop
        k = i
        high = len(source)
        while k < high:
            mid = (k + high) // 2
            if stop <= source[mid].last:
                high = mid
            else:
                k = mid + 1

        if k == len(source):
            raise IndexError('range end too big')
        elif k == i:
            l = j
        else:
            l = 0
        ap = source[k]
        if ap[l] < stop:
            l = (stop - ap.first + ap.stride - 1) // ap.stride

        return i, j, k, l

    def _bounds(self, source: List[ArithmeticProgression], target: List[ArithmeticProgression], args: Tuple[AnyBounds, ...]) -> Bounds:
        """
        Map the given bounds in the `source` to the `target`.
        """

        start, stop = self._parse_optional_bounds(args)
        if start is None or stop is None:
            i, j, k, l = 0, 0, -1, -1
        else:
            i, j, k, l = self._search(source, start, stop)
        return (target[i][j], target[k][l])

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
            >>> print(a.slice_by_original(2, 4))
            [2⇋1, 3⇋2, 4⇋3]

        :returns:
            The slice of this alignment that corresponds with the given span of the original sequence.
        """

        start, stop = self._parse_bounds(args)
        i, j, k, l = self._search(self._original, start, stop)
        sliced = self._slice(i, j, k, l + 1)
        return Alignment((min(max(o, start), stop), m) for o, m in sliced)

    def slice_by_modified(self, *args: AnyBounds) -> Alignment:
        """
        Slice this alignment by a span of the modified sequence.

            >>> a = Alignment.identity(5).shift(1, 0)
            >>> print(a.slice_by_modified(1, 3))
            [2⇋1, 3⇋2, 4⇋3]

        :returns:
            The slice of this alignment that corresponds with the given span of the modified sequence.
        """

        start, stop = self._parse_bounds(args)
        i, j, k, l = self._search(self._modified, start, stop)
        sliced = self._slice(i, j, k, l + 1)
        return Alignment((o, min(max(m, start), stop)) for o, m in sliced)

    def __add__(self, other: Any) -> Alignment:
        """
        Concatenate two alignments.
        """

        if not isinstance(other, Alignment):
            return NotImplemented

        builder = AlignmentBuilder(self)
        builder.extend(other)
        return builder.build()

    class _Iterator:
        """
        Helper class for the :meth:`compose` implementation.
        """

        def __init__(self, alignment: Alignment):
            self._originals = alignment._original
            self._modifieds = alignment._modified
            self._current_o = ArithmeticProgression(0, 0, 0)
            self._current_m = ArithmeticProgression(0, 0, 0)
            self._i = -1
            self._j = -1

            self.next_original = -1
            self.next_modified = -1
            self.advance()
            self.advance()

        @property
        def has_next(self) -> bool:
            return self.original >= 0

        def advance(self) -> None:
            self.original = self.next_original
            self.modified = self.next_modified

            self._j += 1
            if self._i >= len(self._originals):
                if self._j > 1:
                    raise IndexError('Ran off the end of the alignment')
            elif self._j >= self._current_o.length:
                self._i += 1
                self._j = 0

                if self._i == len(self._originals):
                    self.next_original = -1
                    self.next_modified = -1
                else:
                    self._current_o = self._originals[self._i]
                    self._current_m = self._modifieds[self._i]
                    self.next_original = self._current_o.first
                    self.next_modified = self._current_m.first
            else:
                self.next_original += self._current_o.stride
                self.next_modified += self._current_m.stride

    def compose(self, other: Alignment) -> Alignment:
        """
        :returns:
            A new alignment equivalent to applying this one first, then the `other`.
        """

        if self.modified_bounds() != other.original_bounds():
            raise ValueError('Incompatible alignments')

        builder = AlignmentBuilder()
        i = self._Iterator(self)
        j = self._Iterator(other)

        while i.has_next:
            # Map i.original to its lower bound in other
            while i.modified > j.original:
                j.advance()
            while i.modified < j.original and i.next_modified <= j.original:
                i.advance()
            builder.append(i.original, j.modified)

            # Map i.original to its upper bound in other (if it's different)
            while i.original == i.next_original:
                i.advance()

            needs_upper = False
            while j.next_original >= 0 and i.modified >= j.next_original:
                needs_upper = True
                j.advance()
            if needs_upper:
                builder.append(i.original, j.modified)

            i.advance()

        return builder.build()

    def inverse(self) -> Alignment:
        """
        :returns:
            The inverse of this alignment, from the modified to the original sequence.
        """
        return self._create(self._modified, self._original, self._lengths)

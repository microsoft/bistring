# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from __future__ import annotations

__all__ = ['Alignment']

import bisect
from typing import Iterable, List, Optional, Tuple, cast, overload

from ._typing import Bounds, Range


class Alignment:
    """
    An alignment between two related sequences.
    """

    __slots__ = ('_original', '_modified')

    _original: List[int]
    _modified: List[int]

    def __init__(self, values: Iterable[Bounds]):
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
        result = super().__new__(cls)
        result._original = original
        result._modified = modified
        return result

    def __str__(self):
        i, j = self._original[0], self._original[-1]
        k, l = self._modified[0], self._modified[-1]
        if self._original == list(range(i, j + 1)) and self._modified == list(range(k, l + 1)):
            return f'[{i}:{j}⇋{k}:{l}]'
        else:
            return '[' + ', '.join(f'{i}⇋{j}' for i, j in self) + ']'

    def __repr__(self):
        i, j = self._original[0], self._original[-1]
        if self._original == list(range(i, j + 1)) and self._modified == list(range(i, j + 1)):
            if i == 0:
                return f'Alignment.identity({j})'
            else:
                return f'Alignment.identity({i}, {j})'
        else:
            return 'Alignment([' + ', '.join(map(repr, self)) + '])'

    def __eq__(self, other):
        if isinstance(other, Alignment):
            return (self._original, self._modified) == (other._original, other._modified)
        else:
            return NotImplemented

    @classmethod
    def _parse_args(cls, args: Tuple) -> Bounds:
        l = len(args)
        if l == 0:
            return None, None
        elif l == 1:
            arg = args[0]
            if isinstance(arg, range):
                return arg.start, arg.stop
            elif isinstance(arg, slice):
                if arg.start is None or arg.stop is None:
                    raise ValueError('slice with unspecified bounds')
                return arg.start, arg.stop
            elif isinstance(arg, tuple):
                return cast(Bounds, arg)
            else:
                return 0, arg
        elif l == 2:
            return cast(Bounds, args)
        else:
            raise TypeError('Too many arguments')

    @overload
    @classmethod
    def identity(cls, length: int) -> Alignment:
        ...

    @overload
    @classmethod
    def identity(cls, start: int, stop: int) -> Alignment:
        ...

    @overload
    @classmethod
    def identity(cls, bounds: Range) -> Alignment:
        ...

    @classmethod
    def identity(cls, *args):
        start, stop = cls._parse_args(args)
        values = list(range(start, stop + 1))
        return cls._create(values, values)

    def __iter__(self):
        return zip(self._original, self._modified)

    def __len__(self):
        return len(self._original)

    def __getitem__(self, index):
        if isinstance(index, slice):
            start, stop, stride = index.indices(len(self))
            if stride != 1:
                raise ValueError('Non-unit strides not supported')
            return self._create(self._original[index], self._modified[index])
        else:
            return (self._original[index], self._modified[index])

    def shift(self, delta_o: int, delta_m: int):
        """
        Shift this alignment.

        :param delta_o: The distance to shift the original sequence.
        :param delta_m: The distance to shift the modified sequence.
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

    def _bounds(self, source: List[int], target: List[int], args: Tuple) -> Bounds:
        start, stop = self._parse_args(args)
        if start is None:
            i, j = 0, -1
        else:
            i, j = self._search(source, start, stop)
        return (target[i], target[j])

    def original_bounds(self, *args) -> Bounds:
        return self._bounds(self._modified, self._original, args)

    def original_range(self, *args) -> range:
        return range(*self.original_bounds(*args))

    def original_slice(self, *args) -> slice:
        return slice(*self.original_bounds(*args))

    def modified_bounds(self, *args) -> Bounds:
        return self._bounds(self._original, self._modified, args)

    def modified_range(self, *args) -> range:
        return range(*self.modified_bounds(*args))

    def modified_slice(self, *args) -> slice:
        return slice(*self.modified_bounds(*args))

    def slice_by_original(self, *args) -> Alignment:
        start, stop = self._parse_args(args)
        first, last = self._search(self._original, start, stop)
        original = self._original[first:last+1]
        original = [min(max(i, start), stop) for i in original]
        modified = self._modified[first:last+1]
        return self._create(original, modified)

    def slice_by_modified(self, *args) -> Alignment:
        start, stop = self._parse_args(args)
        first, last = self._search(self._modified, start, stop)
        original = self._original[first:last+1]
        modified = self._modified[first:last+1]
        modified = [min(max(i, start), stop) for i in modified]
        return self._create(original, modified)

    def __add__(self, other):
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
        Return a new alignment equivalent to applying this one first, then the
        other.
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
        The inverse of this alignment, from the modified to the original sequence.
        """
        return self._create(self._modified, self._original)

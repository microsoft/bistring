# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from __future__ import annotations

__all__ = ['bistr']

from itertools import islice
from typing import Iterable, List, Optional, Tuple, Union

from ._alignment import Alignment
from ._typing import Bounds, Regex, String


class bistr:
    """
    A bidirectionally transformed string.
    """

    __slots__ = ('original', 'modified', 'alignment')

    original: str
    modified: str
    alignment: Alignment

    def __new__(cls, original: String, modified: Optional[str] = None, alignment: Optional[Alignment] = None):
        """
        Create a new bistr.
        """

        if isinstance(original, bistr):
            if modified is not None or alignment is not None:
                raise ValueError('bistr copy constructor invoked with extra arguments')
            return original
        elif not isinstance(original, str):
            raise TypeError(f'Expected a string, found {type(original)}')

        if modified is None:
            modified = original
            if alignment is None:
                alignment = Alignment.identity(len(original))
        elif isinstance(modified, str):
            if alignment is None:
                alignment = Alignment([(0, 0), (len(original), len(modified))])
        else:
            raise TypeError(f'Expected a string, found {type(modified)}')

        if not isinstance(alignment, Alignment):
            raise TypeError(f'Expected an Alignment, found {type(alignment)}')

        if alignment.original_bounds() != (0, len(original)):
            raise ValueError('Alignment incompatible with original string')
        elif alignment.modified_bounds() != (0, len(modified)):
            raise ValueError('Alignment incompatible with modified string')

        result = super().__new__(cls)
        super().__setattr__(result, 'original', original)
        super().__setattr__(result, 'modified', modified)
        super().__setattr__(result, 'alignment', alignment)
        return result

    def __str__(self):
        if self.original == self.modified:
            return f'⮎{self.original!r}⮌'
        else:
            return f'({self.original!r} ⇋ {self.modified!r})'

    def __repr__(self):
        if self.original == self.modified and len(self.alignment) == len(self.original) + 1:
            return f'bistr({self.original!r})'
        elif len(self.alignment) == 2:
            return f'bistr({self.original!r}, {self.modified!r})'
        else:
            return f'bistr({self.original!r}, {self.modified!r}, {self.alignment!r})'

    def __len__(self):
        return len(self.modified)

    def __eq__(self, other):
        if isinstance(other, bistr):
            return (self.original, self.modified, self.alignment) == (other.original, other.modified, other.alignment)
        else:
            return NotImplemented

    def __add__(self, other):
        if isinstance(other, bistr):
            original = other.original
            modified = other.modified
            alignment = other.alignment
        elif isinstance(other, str):
            original = other
            modified = other
            alignment = Alignment.identity(len(other))
        else:
            return NotImplemented

        alignment = alignment.shift(len(self.original), len(self.modified))
        return bistr(self.original + original, self.modified + modified, self.alignment + alignment)

    def __radd__(self, other):
        if isinstance(other, str):
            length = len(other)
            return bistr(
                other + self.original,
                other + self.modified,
                Alignment.identity(length) + self.alignment.shift(length, length),
            )
        else:
            return NotImplemented

    def __getitem__(self, index):
        if isinstance(index, slice):
            start, stop, stride = index.indices(len(self))
            if stride != 1:
                raise ValueError('Non-unit strides not supported')

            modified = self.modified[start:stop]
            original = self.original[self.alignment.original_slice(start, stop)]
            alignment = self.alignment.slice_by_modified(start, stop)
            alignment = alignment.shift(-alignment[0][0], -alignment[0][1])

            return bistr(original, modified, alignment)
        else:
            return self.modified[index]

    def __setattr__(self, name, value):
        raise AttributeError('bistr is immutable')

    def __delattr__(self, name):
        raise AttributeError('bistr is immutable')

    def inverse(self) -> bistr:
        """
        The inverse of this string, swapping the original and modified strings.
        """
        return bistr(self.modified, self.original, self.alignment.inverse())

    def chunks(self) -> Iterable[bistr]:
        """
        All the chunks of associated text in this string.
        """

        i, k = 0, 0
        for j, l in self.alignment[1:]:
            yield bistr(self.original[i:j], self.modified[k:l])
            i, k = j, l

    def count(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> int:
        return self.modified.count(sub, start, end)

    def find(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> int:
        return self.modified.find(sub, start, end)

    def find_bounds(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> Bounds:
        i = self.find(sub, start, end)
        if i >= 0:
            return i, i + len(sub)
        else:
            return i, i

    def rfind(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> int:
        return self.modified.rfind(sub, start, end)

    def rfind_bounds(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> Bounds:
        i = self.rfind(sub, start, end)
        if i >= 0:
            return i, i + len(sub)
        else:
            return i, i

    def index(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> int:
        return self.modified.index(sub, start, end)

    def index_bounds(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> Bounds:
        i = self.index(sub, start, end)
        return i, i + len(sub)

    def rindex(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> int:
        return self.modified.rindex(sub, start, end)

    def rindex_bounds(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> Bounds:
        i = self.rindex(sub, start, end)
        return i, i + len(sub)

    def startswith(self, prefix: Union[str, Tuple[str, ...]], start: Optional[int] = None, end: Optional[int] = None) -> bool:
        return self.modified.startswith(prefix, start, end)

    def endswith(self, suffix: Union[str, Tuple[str, ...]], start: Optional[int] = None, end: Optional[int] = None) -> bool:
        return self.modified.endswith(suffix, start, end)

    @classmethod
    def join(cls, iterable: Iterable[String]) -> bistr:
        result = cls('')
        for element in iterable:
            result += cls(element)
        return result

    def _find_whitespace(self, start: int) -> Bounds:
        for i in range(start, len(self)):
            if self[i].isspace():
                first = i
                break
        else:
            return -1, -1

        for i in range(first + 1, len(self)):
            if not self[i].isspace():
                last = i
                break
        else:
            last = len(self)

        return first, last

    def split(self, sep: Optional[str] = None, maxsplit: int = -1) -> List[bistr]:
        result = []
        count = 0
        start = 0

        while start >= 0 and (count < maxsplit or maxsplit == -1):
            if sep is None:
                i, j = self._find_whitespace(start)
            else:
                i, j = self.find_bounds(sep, start)

            if i < 0:
                i = len(self)

            if i > start or sep is not None:
                result.append(self[start:i])
                count += 1

            start = j

        if start >= 0:
            result.append(self[start:])

        return result

    def partition(self, sep: str) -> Tuple[bistr, bistr, bistr]:
        i, j = self.find_bounds(sep)
        if i >= 0:
            return self[:i], self[i:j], self[j:]
        else:
            return self, bistr(), bistr()

    def rpartition(self, sep: str) -> Tuple[bistr, bistr, bistr]:
        i, j = self.rfind_bounds(sep)
        if i >= 0:
            return self[:i], self[i:j], self[j:]
        else:
            return self, bistr(), bistr()

    def center(self, width: int, fillchar: str = ' ') -> bistr:
        if len(self) >= width:
            return self

        pad = width - len(self)
        lpad = pad // 2
        rpad = (pad + 1) // 2
        return bistr('', fillchar * lpad) + self + bistr('', fillchar * rpad)

    def ljust(self, width: int, fillchar: str = ' ') -> bistr:
        if len(self) >= width:
            return self

        pad = width - len(self)
        return self + bistr('', fillchar * pad)

    def rjust(self, width: int, fillchar: str = ' ') -> bistr:
        if len(self) >= width:
            return self

        pad = width - len(self)
        return bistr('', fillchar * pad) + self

    def _builder(self):
        from ._builder import BistrBuilder
        return BistrBuilder(self)

    def casefold(self) -> bistr:
        from ._icu import casefold
        return casefold(self)

    def lower(self, locale: Optional[str] = None) -> bistr:
        from ._icu import lower
        return lower(self, locale)

    def upper(self, locale: Optional[str] = None) -> bistr:
        from ._icu import upper
        return upper(self, locale)

    def title(self, locale: Optional[str] = None) -> bistr:
        from ._icu import title
        return title(self, locale)

    def capitalize(self, locale: Optional[str] = None) -> bistr:
        # We have to be careful here to get context-sensitive letters like
        # word-final sigma correct

        builder = self._builder()

        title = bistr(self.modified).title()
        for chunk in islice(title.chunks(), 1):
            builder.replace(len(chunk.original), chunk.modified)

        lower = bistr(self.modified).lower()
        for chunk in islice(lower.chunks(), 1, None):
            builder.replace(len(chunk.original), chunk.modified)

        return builder.build()

    def expandtabs(self, tabsize: int = 8) -> bistr:
        builder = self._builder()

        col = 0
        while not builder.is_complete:
            c = builder.peek(1)
            if c == '\t':
                spaces = tabsize - (col % tabsize)
                builder.replace(1, ' ' * spaces)
                col += spaces
            else:
                builder.skip(1)
                if c == '\n' or c == '\r':
                    col = 0
                else:
                    col += 1

        return builder.build()

    def replace(self, old: str, new: str, count: Optional[int] = None) -> bistr:
        builder = self._builder()

        pos = 0
        n = 0
        while count is None or n < count:
            index = self.modified.find(old, pos)
            if index < 0:
                break

            builder.skip(index - pos)
            builder.replace(len(old), new)

            pos = index + len(old)
            n += 1

        builder.skip_rest()
        return builder.build()

    def sub(self, regex: Regex, repl: str) -> bistr:
        builder = self._builder()
        builder.replace_all(regex, repl)
        return builder.build()

    def _stripper(self, chars: Optional[str]):
        if chars is None:
            return lambda c: c.isspace()
        else:
            return lambda c: c in chars

    def strip(self, chars: Optional[str] = None) -> bistr:
        should_strip = self._stripper(chars)

        length = len(self)
        pre = 0
        while pre < length and should_strip(self.modified[pre]):
            pre += 1

        post = length
        while post > pre and should_strip(self.modified[post - 1]):
            post -= 1

        builder = self._builder()
        builder.discard(pre)
        builder.skip(post - pre)
        builder.discard_rest()
        return builder.build()

    def lstrip(self, chars: Optional[str] = None) -> bistr:
        should_strip = self._stripper(chars)

        length = len(self)
        pre = 0
        while pre < length and should_strip(self.modified[pre]):
            pre += 1

        builder = self._builder()
        builder.discard(pre)
        builder.skip_rest()
        return builder.build()

    def rstrip(self, chars: Optional[str] = None) -> bistr:
        should_strip = self._stripper(chars)

        length = len(self)
        post = length
        while post > 0 and should_strip(self.modified[post - 1]):
            post -= 1

        builder = self._builder()
        builder.skip(post)
        builder.discard_rest()
        return builder.build()

    def normalize(self, form: str) -> bistr:
        from ._icu import normalize
        return normalize(self, form)

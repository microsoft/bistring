# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from __future__ import annotations

__all__ = ['bistr']

from typing import Iterable, Optional, Tuple

from ._alignment import Alignment
from ._typing import Regex, String


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

        if alignment is None:
            if modified is None:
                alignment = Alignment.identity(len(original))
            else:
                alignment = Alignment([(0, 0), (len(original), len(modified))])

        if modified is None:
            modified = original

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
        if self.original == self.modified and self.alignment == Alignment.identity(len(self.original)):
            return f'bistr({self.original!r})'
        elif self.alignment == Alignment([(0, 0), (len(self.original), len(self.modified))]):
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

    def expandtabs(self, tabsize=8) -> bistr:
        return self.replace('\t', ' ' * tabsize)

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

    def normalize(self, form: str):
        from ._icu import normalize
        return normalize(self, form)

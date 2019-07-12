# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from __future__ import annotations

__all__ = ['bistr']

from itertools import islice
from typing import Iterable, List, Optional, Tuple, Union

from ._alignment import Alignment
from ._typing import Bounds, Regex, Replacement, String


class bistr:
    """
    A bidirectionally transformed string.
    """

    __slots__ = ('original', 'modified', 'alignment')

    original: str
    """
    The original string, before any modifications.
    """

    modified: str
    """
    The current value of the string, after all modifications.
    """

    alignment: Alignment
    """
    The sequence alignment between :attr:`original` and :attr:`modified`.
    """

    def __new__(cls, original: String, modified: Optional[str] = None, alignment: Optional[Alignment] = None):
        """
        A `bistr` can be constructed from only a single string, which will give it identical original and modified
        strings and an identity alignment:

            >>> s = bistr('test')
            >>> s.original
            'test'
            >>> s.modified
            'test'
            >>> s.alignment
            Alignment.identity(4)

        You can also explicitly specify both the original and modified string.  The inferred alignment will be as course
        as possible:

            >>> s = bistr('TEST', 'test')
            >>> s.original
            'TEST'
            >>> s.modified
            'test'
            >>> s.alignment
            Alignment([(0, 0), (4, 4)])

        Finally, you can specify the alignment explicitly too, if you know it:

            >>> s = bistr('TEST', 'test', Alignment.identity(4))
            >>> s[1:3]
            bistr('ES', 'es', Alignment.identity(2))
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
        """
        Indexing a `bistr` returns the nth character of the modified string:

            >>> s = bistr('TEST').lower()
            >>> s[1]
            'e'

        Slicing a `bistr` extracts a substring, complete with the matching part
        of the original string:

            >>> s = bistr('TEST').lower()
            >>> s[1:3]
            bistr('ES', 'es', Alignment.identity(2))
        """

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
        :returns: The inverse of this string, swapping the original and modified strings.

            >>> s = bistr('HELLO WORLD').lower()
            >>> s
            bistr('HELLO WORLD', 'hello world', Alignment.identity(11))
            >>> s.inverse()
            bistr('hello world', 'HELLO WORLD', Alignment.identity(11))
        """
        return bistr(self.modified, self.original, self.alignment.inverse())

    def chunks(self) -> Iterable[bistr]:
        """
        :returns: All the chunks of associated text in this string.
        """

        i, k = 0, 0
        for j, l in self.alignment[1:]:
            yield bistr(self.original[i:j], self.modified[k:l])
            i, k = j, l

    def count(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> int:
        """
        Like :meth:`str.count`, counts the occurrences of `sub` in the string.
        """
        return self.modified.count(sub, start, end)

    def find(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> int:
        """
        Like :meth:`str.find`, finds the position of `sub` in the string.
        """
        return self.modified.find(sub, start, end)

    def find_bounds(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> Bounds:
        """
        Like :meth:`find`, but returns both the start and end bounds for convenience.

        :returns: The first `i, j` within `[start, end)` such that ``self[i:j] == sub``, or ``(-1, -1)`` if not found.
        """

        i = self.find(sub, start, end)
        if i >= 0:
            return i, i + len(sub)
        else:
            return i, i

    def rfind(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> int:
        """
        Like :meth:`str.rfind`, finds the position of `sub` in the string backwards.
        """
        return self.modified.rfind(sub, start, end)

    def rfind_bounds(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> Bounds:
        """
        Like :meth:`rfind`, but returns both the start and end bounds for convenience.

        :returns: The last `i, j` within `[start, end)` such that ``self[i:j] == sub``, or ``(-1, -1)`` if not found.
        """

        i = self.rfind(sub, start, end)
        if i >= 0:
            return i, i + len(sub)
        else:
            return i, i

    def index(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> int:
        """
        Like :meth:`str.index`, finds the first position of `sub` in the string, otherwise raising a `ValueError`.
        """
        return self.modified.index(sub, start, end)

    def index_bounds(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> Bounds:
        """
        Like :meth:`index`, but returns both the start and end bounds for convenience.  If the substring is not found, a
        :class:`ValueError` is raised.

        :returns: The first `i, j` within `[start, end)` such that ``self[i:j] == sub``.
        :raises: :class:`ValueError` if the substring is not found.
        """

        i = self.index(sub, start, end)
        return i, i + len(sub)

    def rindex(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> int:
        """
        Like :meth:`str.index`, finds the last position of `sub` in the string, otherwise raising a `ValueError`.
        """
        return self.modified.rindex(sub, start, end)

    def rindex_bounds(self, sub: str, start: Optional[int] = None, end: Optional[int] = None) -> Bounds:
        """
        Like :meth:`rindex`, but returns both the start and end bounds for convenience.  If the substring is not found, a
        :class:`ValueError` is raised.

        :returns: The last `i, j` within `[start, end)` such that ``self[i:j] == sub``.
        :raises: :class:`ValueError` if the substring is not found.
        """

        i = self.rindex(sub, start, end)
        return i, i + len(sub)

    def startswith(self, prefix: Union[str, Tuple[str, ...]], start: Optional[int] = None, end: Optional[int] = None) -> bool:
        """
        Like :meth:`str.startswith`, checks if the string starts with the given `prefix`.
        """
        return self.modified.startswith(prefix, start, end)

    def endswith(self, suffix: Union[str, Tuple[str, ...]], start: Optional[int] = None, end: Optional[int] = None) -> bool:
        """
        Like :meth:`str.endswith`, checks if the string starts with the given `suffix`.
        """
        return self.modified.endswith(suffix, start, end)

    @classmethod
    def join(cls, iterable: Iterable[String]) -> bistr:
        """
        Like :meth:`str.join`, concatenates many (bi)strings together.
        """

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
        """
        Like :meth:`str.split`, splits this string on a separator.
        """

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
        """
        Like :meth:`str.partition`, splits this string into three chunks on a separator.
        """

        i, j = self.find_bounds(sep)
        if i >= 0:
            return self[:i], self[i:j], self[j:]
        else:
            return self, bistr(), bistr()

    def rpartition(self, sep: str) -> Tuple[bistr, bistr, bistr]:
        """
        Like :meth:`str.rpartition`, splits this string into three chunks on a separator, searching from the end.
        """

        i, j = self.rfind_bounds(sep)
        if i >= 0:
            return self[:i], self[i:j], self[j:]
        else:
            return self, bistr(), bistr()

    def center(self, width: int, fillchar: str = ' ') -> bistr:
        """
        Like :meth:`str.center`, pads the start and end of the string to center it.
        """

        if len(self) >= width:
            return self

        pad = width - len(self)
        lpad = pad // 2
        rpad = (pad + 1) // 2
        return bistr('', fillchar * lpad) + self + bistr('', fillchar * rpad)

    def ljust(self, width: int, fillchar: str = ' ') -> bistr:
        """
        Like :meth:`str.ljust`, pads the end of the string to a fixed width.
        """

        if len(self) >= width:
            return self

        pad = width - len(self)
        return self + bistr('', fillchar * pad)

    def rjust(self, width: int, fillchar: str = ' ') -> bistr:
        """
        Like :meth:`str.rjust`, pads the start of the string to a fixed width.
        """

        if len(self) >= width:
            return self

        pad = width - len(self)
        return bistr('', fillchar * pad) + self

    def _builder(self):
        from ._builder import BistrBuilder
        return BistrBuilder(self)

    def casefold(self) -> bistr:
        """
        Computes the case folded form of this string.  Case folding is used for case-insensitive operations, and the
        result may not be suitable for displaying to a user.  For example:

            >>> s = bistr('straße').casefold()
            >>> s.modified
            'strasse'
            >>> s[4:6]
            bistr('ß', 'ss')
        """

        from ._icu import casefold
        return casefold(self)

    def lower(self, locale: Optional[str] = None) -> bistr:
        """
        Converts this string to lowercase.  Unless you specify the `locale` parameter, the current system locale will be
        used.

        >>> bistr('HELLO WORLD').lower()
        bistr('HELLO WORLD', 'hello world', Alignment.identity(11))
        >>> bistr('I').lower('en_US')
        bistr('I', 'i')
        >>> bistr('I').lower('tr_TR')
        bistr('I', 'ı')
        """

        from ._icu import lower
        return lower(self, locale)

    def upper(self, locale: Optional[str] = None) -> bistr:
        """
        Converts this string to uppercase.  Unless you specify the `locale` parameter, the current system locale will be
        used.

        >>> bistr('hello world').upper()
        bistr('hello world', 'HELLO WORLD', Alignment.identity(11))
        >>> bistr('i').upper('en_US')
        bistr('i', 'I')
        >>> bistr('i').upper('tr_TR')
        bistr('i', 'İ')
        """

        from ._icu import upper
        return upper(self, locale)

    def title(self, locale: Optional[str] = None) -> bistr:
        """
        Converts this string to title case.  Unless you specify the `locale` parameter, the current system locale will
        be used.

        >>> bistr('hello world').title()
        bistr('hello world', 'Hello World', Alignment.identity(11))
        >>> bistr('istanbul').title('en_US')
        bistr('istanbul', 'Istanbul', Alignment.identity(8))
        >>> bistr('istanbul').title('tr_TR')
        bistr('istanbul', 'İstanbul', Alignment.identity(8))
        """

        from ._icu import title
        return title(self, locale)

    def capitalize(self, locale: Optional[str] = None) -> bistr:
        """
        Capitalize the first character of this string, and lowercase the rest.  Unless you specify the `locale`
        parameter, the current system locale will be used.

            >>> bistr('hello WORLD').capitalize()
            bistr('hello WORLD', 'Hello world', Alignment.identity(11))
            >>> bistr('ἴΣ').capitalize('el_GR')
            bistr('ἴΣ', 'Ἴς', Alignment.identity(2))
        """

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
        """
        Like :meth:`str.expandtabs`, replaces tab (``\\t``) characters with spaces to align on multiples of `tabsize`.
        """

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
        """
        Like :meth:`str.replace`, replaces occurrences of `old` with `new`.
        """

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

    def sub(self, regex: Regex, repl: Replacement) -> bistr:
        """
        Like :meth:`re.sub`, replaces all matches of `regex` with the replacement `repl`.

        :param regex:
            The regex to match.  Can be a string pattern or a compiled regex.
        :param repl:
            The replacement to use.  Can be a string, which is interpreted as in :meth:`re.Match.expand`, or a
            `callable`, which will receive each match and return the replacement string.
        """

        builder = self._builder()
        builder.replace_all(regex, repl)
        return builder.build()

    def _stripper(self, chars: Optional[str]):
        if chars is None:
            return lambda c: c.isspace()
        else:
            return lambda c: c in chars

    def strip(self, chars: Optional[str] = None) -> bistr:
        """
        Like :meth:`str.strip`, removes leading and trailing characters (whitespace by default).
        """

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
        """
        Like :meth:`str.lstrip`, removes leading characters (whitespace by default).
        """

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
        """
        Like :meth:`str.rstrip`, removes trailing characters (whitespace by default).
        """

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
        """
        Like :meth:`unicodedata.normalize`, applies a Unicode `normalization form <https://unicode.org/reports/tr15/#Norm_Forms>`_.
        The choices for `form` are:

        - ``'NFC'``: Canonical Composition
        - ``'NFKC'``: Compatibility Composition
        - ``'NFD'``: Canonical Decomposition
        - ``'NFKD'``: Compatibilty Decomposition
        """

        from ._icu import normalize
        return normalize(self, form)

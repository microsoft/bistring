# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

__all__ = ['BistrBuilder']

from typing import Iterable, List, Match, Optional, Pattern, Tuple

from ._alignment import Alignment
from ._bistr import bistr
from ._regex import compile_regex, expand_template
from ._typing import Bounds, Regex, Replacement, String


class BistrBuilder:
    """
    Bidirectionally transformed string builer.
    """

    _original: bistr
    _modified: List[str]
    _alignment: List[Bounds]
    _opos: int
    _mpos: int

    def __init__(self, original: String):
        self._original = bistr(original)
        self._modified = []
        self._alignment = [(0, 0)]
        self._opos = 0
        self._mpos = 0

    @property
    def original(self) -> str:
        """
        The original string being modified.
        """
        return self._original.original

    @property
    def current(self) -> str:
        """
        The current string before modifications.
        """
        return self._original.modified

    @property
    def modified(self) -> str:
        """
        The modified string as built so far.
        """
        return ''.join(self._modified)

    @property
    def alignment(self) -> Alignment:
        """
        The alignment built so far from self.current to self.modified.
        """
        return Alignment(self._alignment)

    @property
    def position(self) -> int:
        """
        The position of the builder in self.current.
        """
        return self._opos

    @property
    def remaining(self) -> int:
        """
        The number of characters of the current string left to process.
        """
        return len(self.current) - self._opos

    @property
    def is_complete(self) -> bool:
        """
        Whether we've completely processed the string.
        """
        return self.remaining == 0

    def peek(self, n: int):
        """
        Peek at the next n characters of the original string.
        """
        return self.current[self._opos:self._opos+n]

    def _advance(self, ocount, mcount):
        self._opos += ocount
        self._mpos += mcount
        if ocount > 0 or mcount > 0:
            self._alignment.append((self._opos, self._mpos))

    def skip(self, n: int):
        """
        Skip the next n characters, copying them unchanged.
        """
        if n > 0:
            self._modified.append(self.peek(n))
            for i in range(n):
                self._advance(1, 1)

    def skip_rest(self):
        """
        Skip the rest of the string, copying it unchanged.
        """
        self.skip(self.remaining)

    def insert(self, string: str):
        """
        Insert a substring into the string.
        """
        self.replace(0, string)

    def discard(self, n: int):
        """
        Discard a portion of the original string.
        """
        self.replace(n, '')

    def discard_rest(self):
        """
        Discard the rest of the original string.
        """
        self.discard(self.remaining)

    def replace(self, n: int, repl: str):
        """
        Replace the next n characters with a new string.
        """
        if len(repl) > 0:
            self._modified.append(repl)
        self._advance(n, len(repl))

    def append(self, bs: bistr):
        """
        Append a bistr.  The original value of the bistr must match the current
        string being processed.
        """
        if bs.original != self.peek(len(bs.original)):
            raise ValueError("bistr doesn't match the current string")
        for x, y in zip(bs.alignment, bs.alignment[1:]):
            self._advance(y[0] - x[0], y[1] - x[1])

    def _match(self, regex: Regex) -> Optional[Match[str]]:
        pattern = compile_regex(regex)
        return pattern.match(self.current, pos=self._opos)

    def _search(self, regex: Regex) -> Optional[Match[str]]:
        pattern = compile_regex(regex)
        return pattern.search(self.current, pos=self._opos)

    def _finditer(self, regex: Regex) -> Iterable[Match[str]]:
        pattern = compile_regex(regex)
        return pattern.finditer(self.current, pos=self._opos)

    def skip_match(self, regex: Regex) -> bool:
        """
        Skip a substring matching a regex, copying it unchanged.
        """
        match = self._match(regex)
        if match:
            self.skip(match.end() - match.start())
            return True
        else:
            return False

    def discard_match(self, regex: Regex) -> bool:
        """
        Discard a substring that matches a regex.
        """
        match = self._match(regex)
        if match:
            self.discard(match.end() - match.start())
            return True
        else:
            return False

    def replace_match(self, regex: Regex, repl: Replacement) -> bool:
        """
        Replace a substring that matches a regex.
        """
        match = self._match(regex)
        if match:
            self.replace(match.end() - match.start(), expand_template(match, repl))
            return True
        else:
            return False

    def replace_next(self, regex: Regex, repl: Replacement) -> bool:
        """
        Replace the next occurence of a regex.
        """
        match = self._search(regex)
        if match:
            self.skip(match.start() - self._opos)
            self.replace(match.end() - match.start(), expand_template(match, repl))
            return True
        else:
            return False

    def replace_all(self, regex: Regex, repl: Replacement):
        """
        Replace all occurences of a regex.
        """
        for match in self._finditer(regex):
            self.skip(match.start() - self._opos)
            self.replace(match.end() - match.start(), expand_template(match, repl))
        self.skip_rest()

    def build(self):
        """
        Build the bistr.
        """
        alignment = self._original.alignment.compose(self.alignment)
        return bistr(self.original, self.modified, alignment)

    def rewind(self):
        """
        Reset this builder to apply another transformation.
        """
        self._original = self.build()
        self._modified = []
        self._alignment = [(0, 0)]
        self._opos = 0
        self._mpos = 0

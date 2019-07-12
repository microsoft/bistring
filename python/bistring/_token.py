# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from __future__ import annotations

__all__ = [
    'Token',
    'Tokenization',
    'Tokenizer',
    'RegexTokenizer',
    'SplittingTokenizer',
    'CharacterTokenizer',
    'WordTokenizer',
    'SentenceTokenizer',
]

from abc import ABC, abstractmethod
from dataclasses import dataclass
import icu
import threading
from typing import Callable, Iterable, Sequence

from ._alignment import Alignment
from ._bistr import bistr
from ._regex import compile_regex
from ._typing import Bounds, Regex, String


@dataclass(frozen=True)
class Token:
    """
    A token extracted from a string.
    """

    text: bistr
    """
    The actual text of the token.
    """

    start: int
    """
    The start position of the token.
    """

    end: int
    """
    The end position of the token.
    """

    @property
    def original(self) -> str:
        """
        The original value of this token.
        """
        return self.text.original

    @property
    def modified(self) -> str:
        """
        The modified value of this token.
        """
        return self.text.modified

    @classmethod
    def slice(cls, text: bistr, start: int, end: int) -> Token:
        """
        Create a Token from a slice of a bistr.
        """
        return cls(text[start:end], start, end)

    def __str__(self):
        return f'[{self.start}:{self.end}]={self.text}'

    def __repr__(self):
        return f'Token({self.text!r}, start={self.start}, end={self.end})'


@dataclass(frozen=True)
class Tokenization:
    """
    A string and its tokenization.
    """

    text: bistr
    """
    The text that was tokenized.
    """

    alignment: Alignment
    """
    The alignment from text indices to token indices.
    """

    _tokens: Sequence[Token]

    def __init__(self, text: bistr, tokens: Iterable[Token]):
        """
        Create a Tokenization.
        """
        tokens = tuple(tokens)

        alignment = []
        for i, token in enumerate(tokens):
            alignment.append((token.start, i))
            alignment.append((token.end, i + 1))

        super().__setattr__('text', text)
        super().__setattr__('_tokens', tokens)
        super().__setattr__('alignment', Alignment(alignment))

    def __iter__(self):
        return iter(self._tokens)

    def __len__(self):
        return len(self._tokens)

    def __getitem__(self, index):
        if isinstance(index, slice):
            start, stop, stride = index.indices(len(self))
            if stride != 1:
                raise ValueError('Non-unit strides not supported')

            text = self.substring(start, stop)
            tokens = self._tokens[index]
            if tokens:
                delta = tokens[0].start
                tokens = [Token(t.text, t.start - delta, t.end - delta) for t in tokens]
            return Tokenization(text, tokens)
        else:
            return self._tokens[index]

    def __str__(self):
        tokens = ', '.join(map(str, self))
        return f'Tokenization({self.text}, [{tokens}])'

    def __repr__(self):
        return f'Tokenization({self.text!r}, {self._tokens!r})'

    def substring(self, *args) -> Bounds:
        """
        Map a span of tokens to the corresponding substring.
        """
        return self.text[self.alignment.original_slice(*args)]

    def text_bounds(self, *args) -> Bounds:
        """
        Map a span of tokens to the bounds of the corresponding text.
        """
        return self.alignment.original_bounds(*args)

    def original_bounds(self, *args) -> Bounds:
        """
        Map a span of tokens to the bounds of the corresponding original text.
        """
        return self.text.alignment.original_bounds(self.text_bounds(*args))

    def bounds_for_text(self, *args) -> Bounds:
        """
        Map a span of text to the bounds of the corresponding span of tokens.
        """
        return self.alignment.modified_bounds(*args)

    def bounds_for_original(self, *args) -> Bounds:
        """
        Map a span of original text to the bounds of the corresponding span of
        tokens.
        """
        text_bounds = self.text.alignment.modified_bounds(*args)
        return self.alignment.modified_bounds(text_bounds)

    def slice_by_text(self, *args) -> Tokenization:
        """
        Map a span of text to the corresponding span of tokens.
        """
        i, j = self.bounds_for_text(*args)
        return self[i:j]

    def slice_by_original(self, *args) -> Tokenization:
        """
        Map a span of the original text to the corresponding span of tokens.
        """
        i, j = self.bounds_for_original(*args)
        return self[i:j]

    def snap_text_bounds(self, *args) -> Bounds:
        """
        Expand a span of text to align it with token boundaries.
        """
        return self.text_bounds(self.bounds_for_text(*args))

    def snap_original_bounds(self, *args) -> Bounds:
        """
        Expand a span of original text to align it with token boundaries.
        """
        return self.original_bounds(self.bounds_for_original(*args))


class Tokenizer(ABC):
    """
    Abstract base class for tokenizers.
    """

    @abstractmethod
    def tokenize(self, text: String) -> Tokenization:
        """
        Tokenize some text.

        :param text: The text to tokenize, as either an `str` or
                     :class:`~bistring.bistr`.  A plain `str` should be
                     converted to a `bistr` before processing.

        :returns: A :class:`~bistring.Tokenization` holding the text and its
                  tokens.
        """

        pass


class RegexTokenizer(Tokenizer):
    """
    Breaks text into tokens based on a regex.
    """

    def __init__(self, regex: Regex):
        self._pattern = compile_regex(regex)

    def tokenize(self, text: String) -> Tokenization:
        text = bistr(text)
        tokens = []
        for match in self._pattern.finditer(text.modified):
            tokens.append(Token.slice(text, match.start(), match.end()))
        return Tokenization(text, tokens)


class SplittingTokenizer(Tokenizer):
    """
    Splits text into tokens based on a regex.
    """

    def __init__(self, regex: Regex):
        self._pattern = compile_regex(regex)

    def tokenize(self, text: String) -> Tokenization:
        text = bistr(text)
        tokens = []

        last = 0
        for match in self._pattern.finditer(text.modified):
            start = match.start()
            if start > last:
                tokens.append(Token.slice(text, last, start))
            last = match.end()

        end = len(text.modified)
        if end > last:
            tokens.append(Token.slice(text, last, end))

        return Tokenization(text, tokens)


class _IcuTokenizer(Tokenizer):
    """
    Base class for ICU BreakIterator-based tokenizers.
    """

    def __init__(self, locale: str, constructor: Callable):
        # BreakIterator is not a thread-safe API, so store a cache of
        # thread-local iterators
        self._locale = icu.Locale(locale)
        self._constructor = constructor
        self._local = threading.local()

        # Eagerly construct one on this thread as an optimization, and to check
        # for errors
        self._break_iterator()

    def _break_iterator(self) -> icu.BreakIterator:
        if not hasattr(self._local, 'bi'):
            self._local.bi = self._constructor(self._locale)
        return self._local.bi

    def tokenize(self, text: String) -> Tokenization:
        text = bistr(text)
        tokens = []

        bi = self._break_iterator()

        utext = icu.UnicodeString(text.modified)
        bi.setText(utext)

        ui = bi.first()
        uj = bi.nextBoundary()
        i = 0
        while uj != icu.BreakIterator.DONE:
            j = i + utext.countChar32(ui, uj - ui)
            if self._check_token(bi.getRuleStatus()):
                tokens.append(Token.slice(text, i, j))
            ui = uj
            uj = bi.nextBoundary()
            i = j

        return Tokenization(text, tokens)

    def _check_token(self, tag: int) -> bool:
        return True


class CharacterTokenizer(_IcuTokenizer):
    """
    Splits text into user-perceived characters/grapheme clusters.
    """

    def __init__(self, locale: str):
        super().__init__(locale, icu.BreakIterator.createCharacterInstance)


class WordTokenizer(_IcuTokenizer):
    """
    Splits text into words based on Unicode rules.
    """

    def __init__(self, locale: str):
        super().__init__(locale, icu.BreakIterator.createWordInstance)

    def _check_token(self, tag: int) -> bool:
        return tag >= 100 # UBRK_WORD_NONE_LIMIT


class SentenceTokenizer(_IcuTokenizer):
    """
    Splits text into sentences based on Unicode rules.
    """

    def __init__(self, locale: str):
        super().__init__(locale, icu.BreakIterator.createSentenceInstance)

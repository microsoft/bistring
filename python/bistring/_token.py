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
from typing import Callable, Iterable, Iterator, Optional, Sequence, Union, overload

from ._alignment import Alignment
from ._bistr import bistr, String
from ._regex import compile_regex
from ._typing import AnyBounds, Bounds, Index, Regex


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

    def __init__(self, text: String, start: int, end: int):
        """
        :param text:
            The text of this token.
        :param start:
            The starting index of this token.
        :param end:
            The ending index of this token.
        """

        super().__setattr__('text', bistr(text))
        super().__setattr__('start', start)
        super().__setattr__('end', end)

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
    def slice(cls, text: String, start: int, end: int) -> Token:
        """
        Create a Token from a slice of a bistr.

        :param text:
            The (bi)string to slice.
        :param start:
            The starting index of the token.
        :param end:
            The ending index of the token.
        """
        return cls(text[start:end], start, end)

    def __str__(self) -> str:
        return f'[{self.start}:{self.end}]={self.text}'

    def __repr__(self) -> str:
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

    def __init__(self, text: String, tokens: Iterable[Token]):
        """
        :param text:
            The text from which the tokens have been extracted.
        :param tokens:
            The tokens extracted from the text.
        """
        text = bistr(text)
        tokens = tuple(tokens)

        alignment = [(0, 0)]
        for i, token in enumerate(tokens):
            alignment.append((token.start, i))
            alignment.append((token.end, i + 1))
        alignment.append((len(text), len(tokens)))

        super().__setattr__('text', text)
        super().__setattr__('_tokens', tokens)
        super().__setattr__('alignment', Alignment(alignment))

    @classmethod
    def infer(cls, text: String, tokens: Iterable[str]) -> Tokenization:
        r"""
        Infer a `Tokenization` from a sequence of tokens.

            >>> tokens = Tokenization.infer('hello, world!', ['hello', 'world'])
            >>> tokens[0]
            Token(bistr('hello'), start=0, end=5)
            >>> tokens[1]
            Token(bistr('world'), start=7, end=12)

        Due to the possibility of ambiguity, it is much better to use a :class:`Tokenizer` or some other method of
        producing :class:`Token`\ s with their positions explicitly set.

        :returns:
            The inferred tokenization, with token positions found by simple forward search.
        :raises:
            :class:`ValueError` if the tokens can't be found in the source string.
        """

        text = bistr(text)

        result = []
        start = 0
        for token in tokens:
            start, end = text.index_bounds(token, start)
            result.append(Token.slice(text, start, end))
            start = end

        return cls(text, result)

    def __iter__(self) -> Iterator[Token]:
        return iter(self._tokens)

    def __len__(self) -> int:
        return len(self._tokens)

    @overload
    def __getitem__(self, index: int) -> Token: ...

    @overload
    def __getitem__(self, index: slice) -> Tokenization: ...

    def __getitem__(self, index: Index) -> Union[Token, Tokenization]:
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

    def __str__(self) -> str:
        tokens = ', '.join(map(str, self))
        return f'Tokenization({self.text}, [{tokens}])'

    def __repr__(self) -> str:
        return f'Tokenization({self.text!r}, {self._tokens!r})'

    def substring(self, *args: AnyBounds) -> bistr:
        """
        Map a span of tokens to the corresponding substring.
        """
        return self.text[self.alignment.original_slice(*args)]

    def text_bounds(self, *args: AnyBounds) -> Bounds:
        """
        Map a span of tokens to the bounds of the corresponding text.
        """
        return self.alignment.original_bounds(*args)

    def original_bounds(self, *args: AnyBounds) -> Bounds:
        """
        Map a span of tokens to the bounds of the corresponding original text.
        """
        return self.text.alignment.original_bounds(self.text_bounds(*args))

    def bounds_for_text(self, *args: AnyBounds) -> Bounds:
        """
        Map a span of text to the bounds of the corresponding span of tokens.
        """
        return self.alignment.modified_bounds(*args)

    def bounds_for_original(self, *args: AnyBounds) -> Bounds:
        """
        Map a span of original text to the bounds of the corresponding span of
        tokens.
        """
        text_bounds = self.text.alignment.modified_bounds(*args)
        return self.alignment.modified_bounds(text_bounds)

    def slice_by_text(self, *args: AnyBounds) -> Tokenization:
        """
        Map a span of text to the corresponding span of tokens.
        """
        i, j = self.bounds_for_text(*args)
        return self[i:j]

    def slice_by_original(self, *args: AnyBounds) -> Tokenization:
        """
        Map a span of the original text to the corresponding span of tokens.
        """
        i, j = self.bounds_for_original(*args)
        return self[i:j]

    def snap_text_bounds(self, *args: AnyBounds) -> Bounds:
        """
        Expand a span of text to align it with token boundaries.
        """
        return self.text_bounds(self.bounds_for_text(*args))

    def snap_original_bounds(self, *args: AnyBounds) -> Bounds:
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
    r"""
    Breaks text into tokens based on a regex.

        >>> tokenizer = RegexTokenizer(r'\w+')
        >>> tokens = tokenizer.tokenize('the quick brown fox jumps over the lazy dog')
        >>> tokens[0]
        Token(bistr('the'), start=0, end=3)
        >>> tokens[1]
        Token(bistr('quick'), start=4, end=9)
    """

    def __init__(self, regex: Regex):
        """
        :param regex:
            A (possibly compiled) regular expression that matches tokens to extract.
        """

        self._pattern = compile_regex(regex)

    def tokenize(self, text: String) -> Tokenization:
        text = bistr(text)
        tokens = []
        for match in self._pattern.finditer(text.modified):
            tokens.append(Token.slice(text, match.start(), match.end()))
        return Tokenization(text, tokens)


class SplittingTokenizer(Tokenizer):
    r"""
    Splits text into tokens based on a regex.

        >>> tokenizer = SplittingTokenizer(r'\s+')
        >>> tokens = tokenizer.tokenize('the quick brown fox jumps over the lazy dog')
        >>> tokens[0]
        Token(bistr('the'), start=0, end=3)
        >>> tokens[1]
        Token(bistr('quick'), start=4, end=9)
    """

    def __init__(self, regex: Regex):
        """
        :param regex:
            A (possibly compiled) regular expression that matches the regions between tokens.
        """

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

    def __init__(self, locale: str, constructor: Callable[[icu.Locale], icu.BreakIterator]):
        # BreakIterator is not a thread-safe API, so store a cache of
        # thread-local iterators
        self._locale = icu.Locale(locale)
        self._constructor = constructor
        self._local = threading.local()

        # Eagerly construct one on this thread as an optimization, and to check
        # for errors
        self._break_iterator()

    def _break_iterator(self) -> icu.BreakIterator:
        bi: Optional[icu.BreakIterator] = getattr(self._local, 'bi', None)
        if bi is None:
            bi = self._constructor(self._locale)
            self._local.bi = bi
        return bi

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

        >>> tokenizer = CharacterTokenizer('th_TH')
        >>> tokens = tokenizer.tokenize('กำนัล')
        >>> tokens[0]
        Token(bistr('กำ'), start=0, end=2)
        >>> tokens[1]
        Token(bistr('นั'), start=2, end=4)
        >>> tokens[2]
        Token(bistr('ล'), start=4, end=5)
    """

    def __init__(self, locale: str):
        """
        :param locale:
            The name of the locale to use for computing user-perceived character boundaries.
        """
        super().__init__(locale, icu.BreakIterator.createCharacterInstance)


class WordTokenizer(_IcuTokenizer):
    """
    Splits text into words based on Unicode rules.

        >>> tokenizer = WordTokenizer('en_US')
        >>> tokens = tokenizer.tokenize('the quick brown fox jumps over the lazy dog')
        >>> tokens[0]
        Token(bistr('the'), start=0, end=3)
        >>> tokens[1]
        Token(bistr('quick'), start=4, end=9)
    """

    def __init__(self, locale: str):
        """
        :param locale:
            The name of the locale to use for computing word boundaries.
        """
        super().__init__(locale, icu.BreakIterator.createWordInstance)

    def _check_token(self, tag: int) -> bool:
        return tag >= 100 # UBRK_WORD_NONE_LIMIT


class SentenceTokenizer(_IcuTokenizer):
    """
    Splits text into sentences based on Unicode rules.

        >>> tokenizer = SentenceTokenizer('en_US')
        >>> tokens = tokenizer.tokenize(
        ...     'Word, sentence, etc. boundaries are hard. Luckily, Unicode can help.'
        ... )
        >>> tokens[0]
        Token(bistr('Word, sentence, etc. boundaries are hard. '), start=0, end=42)
        >>> tokens[1]
        Token(bistr('Luckily, Unicode can help.'), start=42, end=68)
    """

    def __init__(self, locale: str):
        """
        :param locale:
            The name of the locale to use for computing sentence boundaries.
        """
        super().__init__(locale, icu.BreakIterator.createSentenceInstance)

# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from bistring import bistr, Token, Tokenization, Tokenizer


def test_tokenization():
    text = bistr('The quick, brown fox jumps over the lazy dog')
    text = text.replace(',', '')

    tokens = Tokenization(text, [
        Token.slice(text, 0, 3),
        Token.slice(text, 4, 9),
        Token.slice(text, 10, 15),
        Token.slice(text, 16, 19),
        Token.slice(text, 20, 25),
        Token.slice(text, 26, 30),
        Token.slice(text, 31, 34),
        Token.slice(text, 35, 39),
        Token.slice(text, 40, 43),
    ])

    tokens = tokens[1:-1]
    assert tokens.text.original == 'quick, brown fox jumps over the lazy'
    assert tokens.text.modified == 'quick brown fox jumps over the lazy'
    assert tokens.text_bounds(1, 3) == (6, 15)
    assert tokens.original_bounds(1, 3) == (7, 16)
    assert tokens.bounds_for_text(8, 14) == (1, 3)
    assert tokens.bounds_for_original(9, 15) == (1, 3)
    assert tokens.slice_by_text(8, 14).text == bistr('brown fox')
    assert tokens.slice_by_original(9, 15).text == bistr('brown fox')
    assert tokens.snap_text_bounds(8, 14) == (6, 15)
    assert tokens.snap_original_bounds(9, 15) == (7, 16)


def test_regex_tokenizer():
    from bistring import RegexTokenizer

    text = bistr(' 𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 𝖉𝖔𝖌 ')
    text = text.normalize('NFKD')
    text = text.casefold()

    tokenizer = RegexTokenizer(r'\w+')
    assert isinstance(tokenizer, Tokenizer)

    tokens = tokenizer.tokenize(text)
    assert tokens.text == text
    assert len(tokens) == 9
    assert tokens.text_bounds(0, 2) == (1, 10)
    assert tokens[0:2].text == text[1:10]
    assert len(tokens.slice_by_text(5, 10)) == 1
    assert len(tokens.slice_by_text(5, 11)) == 1
    assert len(tokens.slice_by_text(3, 13)) == 3


def test_splitting_tokenizer():
    from bistring import SplittingTokenizer

    text = bistr(' 𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 𝖉𝖔𝖌 ')
    text = text.normalize('NFKD')
    text = text.casefold()

    tokenizer = SplittingTokenizer(r'\s+')
    assert isinstance(tokenizer, Tokenizer)

    tokens = tokenizer.tokenize(text)
    assert tokens.text == text
    assert len(tokens) == 9
    assert tokens.text_bounds(0, 2) == (1, 11)
    assert tokens[0:2].text == text[1:11]
    assert len(tokens.slice_by_text(5, 10)) == 1
    assert len(tokens.slice_by_text(5, 11)) == 1
    assert len(tokens.slice_by_text(3, 13)) == 3


def test_character_tokenizer():
    from bistring import CharacterTokenizer

    text = bistr(' 𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 𝖉𝖔𝖌 ')

    tokenizer = CharacterTokenizer('en_US')
    assert isinstance(tokenizer, Tokenizer)

    tokens = tokenizer.tokenize(text)
    assert tokens.text == text
    assert all(token.text == text[i:i+1] for i, token in enumerate(tokens))


def test_word_tokenizer():
    from bistring import WordTokenizer

    text = bistr(' 𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 𝖉𝖔𝖌 ')

    tokenizer = WordTokenizer('en_US')
    assert isinstance(tokenizer, Tokenizer)

    tokens = tokenizer.tokenize(text)
    assert tokens.text == text
    assert len(tokens) == 9
    assert tokens.text_bounds(0, 2) == (1, 10)
    assert tokens[0:2].text == text[1:10]
    assert len(tokens.slice_by_text(5, 10)) == 1
    assert len(tokens.slice_by_text(5, 11)) == 1
    assert len(tokens.slice_by_text(3, 13)) == 3


def test_sentence_tokenizer():
    from bistring import SentenceTokenizer

    text = bistr('The following sentence is true.  The preceeding sentence, surprisingly, is false.')

    tokenizer = SentenceTokenizer('en_US')
    assert isinstance(tokenizer, Tokenizer)

    tokens = tokenizer.tokenize(text)
    assert tokens.text == text
    assert len(tokens) == 2
    assert tokens[0].text == text[:33]
    assert tokens[1].text == text[33:]

# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from bistring import bistr


def test_regex_tokenizer():
    from bistring import RegexTokenizer

    text = bistr(" 𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 𝖉𝖔𝖌 ")
    text = text.normalize("NFKD")
    text = text.casefold()

    tokenizer = RegexTokenizer(r"\w+")

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

    text = bistr(" 𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 𝖉𝖔𝖌 ")
    text = text.normalize("NFKD")
    text = text.casefold()

    tokenizer = SplittingTokenizer(r"\s+")

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

    text = bistr(" 𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 𝖉𝖔𝖌 ")

    tokenizer = CharacterTokenizer("en_US")

    tokens = tokenizer.tokenize(text)
    assert tokens.text == text
    assert all(token.text == text[i:i+1] for i, token in enumerate(tokens))


def test_word_tokenizer():
    from bistring import WordTokenizer

    text = bistr(" 𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 𝖉𝖔𝖌 ")

    tokenizer = WordTokenizer("en_US")

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

    text = bistr("The following sentence is true.  The preceeding sentence, surprisingly, is false.")

    tokenizer = SentenceTokenizer("en_US")

    tokens = tokenizer.tokenize(text)
    assert tokens.text == text
    assert len(tokens) == 2
    assert tokens[0].text == text[:33]
    assert tokens[1].text == text[33:]

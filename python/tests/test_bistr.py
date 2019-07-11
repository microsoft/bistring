# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

import unicodedata

from bistring import Alignment, bistr


def test_concat():
    bs = bistr('  ', '')
    bs += 'Hello'
    bs += bistr('  ', ' ')
    bs += 'world!'
    bs += bistr('  ', '')

    assert bs.original == '  Hello  world!  '
    assert bs.modified == 'Hello world!'

    bs = bs[4:7]
    assert bs.original == 'o  w'
    assert bs.modified == 'o w'

    bs = bs[1:2]
    assert bs.original == '  '
    assert bs.modified == ' '


def test_strip():
    bs = bistr('  Hello  world!  ')
    assert bs.original == '  Hello  world!  '
    assert bs.modified == '  Hello  world!  '

    bs = bs.strip()
    assert bs.original == '  Hello  world!  '
    assert bs.modified == 'Hello  world!'

    bs = bistr('    ').strip()
    assert bs.modified == ''
    assert bs.original == '    '


def test_casefold():
    # 'Híﬃ'
    # í has a combining acute accent, ﬃ is a ligature
    bs = bistr('Hi\u0301\uFB03').casefold()
    assert bs.original == 'Hi\u0301\uFB03'
    assert bs.modified == 'hi\u0301ffi'
    assert bs.modified == bs.original.casefold()

    assert bs[:3].original == 'Hi\u0301'
    assert bs[:3].modified == 'hi\u0301'

    assert bs[4:5].original == '\uFB03'
    assert bs[4:5].modified == 'f'


def test_lower():
    bs = bistr('DİYARBAKIR').lower('en_US')
    assert bs.original == 'DİYARBAKIR'
    assert bs.modified == 'di̇yarbakir'

    bs = bistr('DİYARBAKIR').lower('tr_TR')
    assert bs.original == 'DİYARBAKIR'
    assert bs.modified == 'diyarbakır'


def test_upper():
    bs = bistr('straße').upper('de_DE')
    assert bs.original == 'straße'
    assert bs.modified == 'STRASSE'
    assert bs[4:6].original == 'ß'
    assert bs[4:6].modified == 'SS'

    bs = bistr('Diyarbakır').upper('tr_TR')
    assert bs.original == 'Diyarbakır'
    assert bs.modified == 'DİYARBAKIR'

def test_title():
    bs = bistr('istanbul').title('en_US')
    assert bs.original == 'istanbul'
    assert bs.modified == 'Istanbul'

    bs = bistr('istanbul').title('tr_TR')
    assert bs.original == 'istanbul'
    assert bs.modified == 'İstanbul'


def test_normalize():
    # é is composed but ö has a combining diaeresis
    bs = bistr('H\u00E9llo\u0308')

    bs = bs.normalize('NFC')
    assert bs.original == 'H\u00E9llo\u0308'
    assert bs.modified == 'H\u00E9ll\u00F6'
    assert bs.modified == unicodedata.normalize('NFC', bs.original)
    assert bs[4:5].original == 'o\u0308'
    assert bs[4:5].modified == '\u00F6'

    bs = bs.normalize('NFD')
    assert bs.original == 'H\u00E9llo\u0308'
    assert bs.modified == 'He\u0301llo\u0308'
    assert bs.modified == unicodedata.normalize('NFD', bs.original)
    assert bs[1:3].original == '\u00E9'
    assert bs[1:3].modified == 'e\u0301'


def test_readme():
    bs = bistr('𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 🦊 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 🐶')
    bs = bs.normalize('NFKD')
    bs = bs.casefold()
    bs = bs.replace('🦊', 'fox')
    bs = bs.replace('🐶', 'dog')
    bs = bs.sub(r'[^\w\s]+', '')
    bs = bs[:19]
    assert bs.modified == 'the quick brown fox'
    assert bs.original == '𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 🦊'


def test_equality():
    bs1 = bistr('  Hello world  ').strip().casefold()
    bs2 = bistr('  Hello world  ', 'hello world', Alignment([
        (0, 0),
        (2, 0),
        (3, 1),
        (4, 2),
        (5, 3),
        (6, 4),
        (7, 5),
        (8, 6),
        (9, 7),
        (10, 8),
        (11, 9),
        (12, 10),
        (13, 11),
        (15, 11),
    ]))
    assert bs1 == bs2


def test_alternative_regex():
    import regex

    bs = bistr('The quick, brown 🦊 jumps over the lazy 🐶')
    bs = bs.sub(regex.compile(r'\pS'), lambda m: unicodedata.name(m.group()))
    assert bs[17:25] == bistr('🦊', 'FOX FACE')
    assert bs[46:] == bistr('🐶', 'DOG FACE')

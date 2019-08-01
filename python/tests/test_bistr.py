# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from bistring import Alignment, bistr
import pytest
import unicodedata


def test_new():
    pytest.raises(TypeError, bistr, 42)
    pytest.raises(TypeError, bistr, 'fourty-two', 42)
    pytest.raises(TypeError, bistr, 'fourty-two', '42', 42)

    pytest.raises(ValueError, bistr, 'fourty-two', '42', Alignment([
        (0, 0),
        (9, 2),
    ]))
    pytest.raises(ValueError, bistr, 'fourty-two', '42', Alignment([
        (0, 0),
        (10, 1),
    ]))

    bistr('42')
    bistr('fourty-two', '42')
    bistr('fourty-two', '42', Alignment([
        (0, 0),
        (6, 1),
        (7, 1),
        (10, 2),
    ]))


def test_infer():
    bs = bistr.infer('test', 'test')
    assert bs == bistr('test', 'test', Alignment.identity(4))

    bs = bistr.infer('color', 'colour')
    assert bs[3:5].original == 'o'

    assert bs.inverse() == bistr.infer('colour', 'color')

    bs = bistr.infer("--Hello, world!--", "hello world")
    assert bs[:5] == bistr("Hello", "hello", Alignment.identity(5))
    assert bs[6:] == bistr("world")

    bs = bistr.infer(
        '🅃🄷🄴 🅀🅄🄸🄲🄺, 🄱🅁🄾🅆🄽 🦊 🄹🅄🄼🄿🅂 🄾🅅🄴🅁 🅃🄷🄴 🄻🄰🅉🅈 🐶',
        'the quick brown fox jumps over the lazy dog',
    )
    assert bs[0:3] == bistr('🅃🄷🄴', 'the', Alignment.identity(3))
    assert bs[4:9] == bistr('🅀🅄🄸🄲🄺', 'quick', Alignment.identity(5))
    assert bs[10:15] == bistr('🄱🅁🄾🅆🄽', 'brown', Alignment.identity(5))
    assert bs[16:19].original == '🦊'
    assert bs[16:19].modified == 'fox'
    assert bs[20:25] == bistr('🄹🅄🄼🄿🅂', 'jumps', Alignment.identity(5))
    assert bs[40:43].original == '🐶'
    assert bs[40:43].modified == 'dog'

    bs = bistr.infer(
        'Ṫḧë qüïċḳ, ḅṛöẅṅ 🦊 jüṁṗṡ öṿëṛ ẗḧë ḷäżÿ 🐶',
        'the quick brown fox jumps over the lazy dog',
    )
    assert bs[0:3] == bistr('Ṫḧë', 'the', Alignment.identity(3))
    assert bs[4:9] == bistr('qüïċḳ', 'quick', Alignment.identity(5))
    assert bs[10:15] == bistr('ḅṛöẅṅ', 'brown', Alignment.identity(5))
    assert bs[16:19].original == '🦊'
    assert bs[16:19].modified == 'fox'
    assert bs[20:25] == bistr('jüṁṗṡ', 'jumps', Alignment.identity(5))
    assert bs[40:43].original == '🐶'
    assert bs[40:43].modified == 'dog'

    bs = bistr.infer('Z̴̡̪̫̖̥̔̿̃̈̏̎͠͝á̸̪̠̖̻̬̖̪̞͙͇̮̠͎̆͋́̐͌̒͆̓l̶͉̭̳̤̬̮̩͎̟̯̜͇̥̠̘͑͐̌͂̄́̀̂̌̈͛̊̄̚͜ģ̸̬̼̞̙͇͕͎̌̾̒̐̿̎̆̿̌̃̏̌́̾̈͘͜o̶̢̭͕͔̩͐ ̴̡̡̜̥̗͔̘̦͉̣̲͚͙̐̈́t̵͈̰̉̀͒̎̈̿̔̄̽͑͝͠ẹ̵̫̲̫̄͜͜x̵͕̳͈̝̤̭̼̼̻͓̿̌̽̂̆̀̀̍̒͐́̈̀̚͝t̸̡̨̥̺̣̟͎̝̬̘̪͔͆́̄̅̚', 'Zalgo text')
    for i, c in enumerate(bs):
        assert bs[i:i+1].original.startswith(c)


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


def test_find_index():
    bs = bistr('dysfunction')

    assert bs.find('dis') == -1
    assert bs.find('fun') == 3
    assert bs.find('n') == 5
    assert bs.find('n', 6) == 10

    assert bs.find_bounds('dis') == (-1, -1)
    assert bs.find_bounds('fun') == (3, 6)
    assert bs.find_bounds('n') == (5, 6)
    assert bs.find_bounds('n', 6) == (10, 11)

    pytest.raises(ValueError, bs.index, 'dis')
    pytest.raises(ValueError, bs.index_bounds, 'dis')

    assert bs.index('fun') == 3
    assert bs.index_bounds('fun') == (3, 6)
    assert bs.index_bounds('n') == (5, 6)
    assert bs.index_bounds('n', 6) == (10, 11)


def test_rfind_rindex():
    bs = bistr('dysfunction')

    assert bs.rfind('dis') == -1
    assert bs.rfind('fun') == 3
    assert bs.rfind('n') == 10
    assert bs.rfind('n', None, 9) == 5

    assert bs.rfind_bounds('dis') == (-1, -1)
    assert bs.rfind_bounds('fun') == (3, 6)
    assert bs.rfind_bounds('n') == (10, 11)
    assert bs.rfind_bounds('n', None, 9) == (5, 6)

    pytest.raises(ValueError, bs.index, 'dis')
    pytest.raises(ValueError, bs.index_bounds, 'dis')

    assert bs.rindex('fun') == 3
    assert bs.rindex_bounds('fun') == (3, 6)
    assert bs.rindex_bounds('n') == (10, 11)
    assert bs.rindex_bounds('n', None, 9) == (5, 6)


def test_starts_ends_with():
    bs = bistr('Beginning, middle, ending')

    assert bs.startswith('Begin')
    assert bs.endswith('ing')

    assert not bs.startswith('ending')
    assert not bs.endswith('Beginning')

    assert bs.startswith(('Begin', 'End'))
    assert bs.endswith(('beginning', 'ending'))


def test_justify():
    bs = bistr('Hello world!')

    assert bs.center(5) == bs
    assert bs.center(20) == bistr('', '    ') + bs + bistr('', '    ')
    assert bs.center(21) == bistr('', '    ') + bs + bistr('', '     ')

    assert bs.ljust(5) == bs
    assert bs.ljust(16) == bs + bistr('', '    ')

    assert bs.rjust(5) == bs
    assert bs.rjust(16) == bistr('', '    ') + bs


def test_split():
    bs = bistr('1,2,3')
    assert bs.split(',') == [bistr('1'), bistr('2'), bistr('3')]
    assert bs.split(',', 1) == [bistr('1'), bistr('2,3')]

    assert bistr('1,2,,3,').split(',') == [bistr('1'), bistr('2'), bistr(''), bistr('3'), bistr('')]

    assert bistr('').split(',') == [bistr('')]

    assert bistr('1<>2<>3').split('<>') == [bistr('1'), bistr('2'), bistr('3')]

    bs = bistr('   1   2   3   ')
    assert bs.split() == [bistr('1'), bistr('2'), bistr('3')]
    assert bs.split(maxsplit=-1) == [bistr('1'), bistr('2'), bistr('3')]
    assert bs.split(maxsplit=2) == [bistr('1'), bistr('2'), bistr('3   ')]
    assert bs.split(maxsplit=1) == [bistr('1'), bistr('2   3   ')]

    assert bistr('').split() == []


def test_partition():
    bs = bistr('left::middle::right')

    left, sep, right = bs.partition('::')
    assert left == bistr('left')
    assert sep == bistr('::')
    assert right == bistr('middle::right')

    left, sep, right = bs.partition(':::')
    assert left == bs
    assert sep == bistr('')
    assert right == bistr('')

    left, sep, right = bs.rpartition('::')
    assert left == bistr('left::middle')
    assert sep == bistr('::')
    assert right == bistr('right')

    left, sep, right = bs.rpartition(':::')
    assert left == bistr('')
    assert sep == bistr('')
    assert right == bs


def test_expandtabs():
    bs = bistr(' \tHello\t\tworld!\n\tGoodbye \tworld!')
    bs = bs.expandtabs()

    assert bs.modified == bs.original.expandtabs()
    assert bs[0:1] == bistr(' ')
    assert bs[1:8] == bistr('\t', '       ')
    assert bs[8:13] == bistr('Hello')
    assert bs[13:16] == bistr('\t', '   ')
    assert bs[16:24] == bistr('\t', '        ')
    assert bs[24:30] == bistr('world!')
    assert bs[30:31] == bistr('\n')


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


def test_capitalize():
    bs = bistr('hello WORLD').capitalize('en_US')
    assert bs.original == 'hello WORLD'
    assert bs.modified == 'Hello world'
    assert bs.alignment == Alignment.identity(11)

    bs = bistr('τελικός').capitalize('el_GR')
    assert bs.original == 'τελικός'
    assert bs.modified == 'Τελικός'
    assert bs.alignment == Alignment.identity(7)

    bs = bistr('ἴΣ').capitalize('el_GR')
    assert bs.original == 'ἴΣ'
    assert bs.modified == 'Ἴς'
    assert bs.alignment == Alignment.identity(2)


def test_swapcase():
    bs = bistr('hello WORLD').swapcase('en_US')
    assert bs.original == 'hello WORLD'
    assert bs.modified == 'HELLO world'
    assert bs.alignment == Alignment.identity(11)

    # Ligatures/digraphs in title case don't have a swapped form
    bs = bistr('ǈepòta').swapcase('hr_HR')
    assert bs.original == 'ǈepòta'
    assert bs.modified == 'ǈEPÒTA'
    assert bs.alignment == Alignment.identity(6)

    bs = bistr('ǈepòta').normalize('NFKC').swapcase('hr_HR')
    assert bs.original == 'ǈepòta'
    assert bs.modified == 'lJEPÒTA'
    assert bs[0:2] == bistr('ǈ', 'lJ')


def test_normalize():
    # "Héllö" -- é is composed but ö has a combining diaeresis
    bs = bistr('H\u00E9llo\u0308').normalize('NFC')
    assert bs.original == 'H\u00E9llo\u0308'
    assert bs.modified == 'H\u00E9ll\u00F6'
    assert bs.modified == unicodedata.normalize('NFC', bs.original)
    assert bs[1:2] == bistr('\u00E9')
    assert bs[4:5] == bistr('o\u0308', '\u00F6')

    bs = bistr('H\u00E9llo\u0308').normalize('NFD')
    assert bs.original == 'H\u00E9llo\u0308'
    assert bs.modified == 'He\u0301llo\u0308'
    assert bs.modified == unicodedata.normalize('NFD', bs.original)
    assert bs[1:3] == bistr('\u00E9', 'e\u0301')
    assert bs[5:7] == bistr('o\u0308')


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

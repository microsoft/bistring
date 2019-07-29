# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from bistring import bistr, Alignment, BistrBuilder


def test_chunk_words():
    builder = BistrBuilder('  the quick  brown fox ')
    builder.discard(2)
    builder.replace(3, 'the')
    builder.skip(1)
    builder.replace(5, 'quick')
    builder.replace(2, ' ')
    builder.replace(5, 'brown')
    builder.skip(1)
    builder.replace(3, 'fox')
    builder.discard(1)
    bs = builder.build()

    assert bs.original == '  the quick  brown fox '
    assert bs.modified == 'the quick brown fox'

    assert bs[0:1].original == 'the'
    assert bs[1:2].original == 'the'
    assert bs[2:3].original == 'the'

    assert bs[0:3].original == 'the'
    assert bs[1:3].original == 'the'

    assert bs[0:4].original == 'the '
    assert bs[1:4].original == 'the '

    assert bs[3:4].original == ' '
    assert bs[9:10].original == '  '

    assert bs[4:15].original == 'quick  brown'
    assert bs[5:14].original == 'quick  brown'

    assert bs[0:0].original == ''
    assert bs[10:10].original == ''


def test_chunk_chars():
    builder = BistrBuilder('  the quick  brown fox ')
    builder.discard_match(r'\s+')
    while not builder.is_complete:
        builder.skip_match(r'\S+')
        builder.replace_match(r'\s+(?=\S)', ' ')
        builder.discard_match(r'\s+$')

    bs = builder.build()

    assert bs.original == '  the quick  brown fox '
    assert bs.modified == 'the quick brown fox'

    assert bs[0:1].original == 't'
    assert bs[1:2].original == 'h'
    assert bs[2:3].original == 'e'

    assert bs[0:3].original == 'the'
    assert bs[1:3].original == 'he'

    assert bs[0:4].original == 'the '
    assert bs[1:4].original == 'he '

    assert bs[3:4].original == ' '
    assert bs[9:10].original == '  '

    assert bs[4:15].original == 'quick  brown'
    assert bs[5:14].original == 'uick  brow'

    assert bs[0:0].original == ''
    assert bs[10:10].original == ''


def test_empty_string():
    builder = BistrBuilder('')
    bs = builder.build()
    assert bs.original == ''
    assert bs.modified == ''
    assert bs[0:0].original == ''


def test_iterative():
    builder = BistrBuilder("I wish I wouldn't've spent one thousand dollars.")
    builder.skip_match(r'[^.]*')
    builder.discard_rest()
    builder.rewind()
    builder.skip_match(r'I wish I ');
    builder.replace_match(r"wouldn't've", 'would not have');
    builder.skip_match(r' spent ');
    builder.replace_match(r'one thousand dollars', '$1,000');

    bs = builder.build()
    assert bs.original == "I wish I wouldn't've spent one thousand dollars."
    assert bs.modified == 'I wish I would not have spent $1,000'


def test_replace_matches():
    builder = BistrBuilder('the cheese that the mouse that the cat that the dog chased played with ate')
    builder.replace_next(r'that', 'which')
    builder.replace_all(r'that', 'whom')

    bs = builder.build()
    assert bs.original == 'the cheese that the mouse that the cat that the dog chased played with ate'
    assert bs.modified == 'the cheese which the mouse whom the cat whom the dog chased played with ate'


def test_replace_backreference():
    builder = BistrBuilder("it doesn't work and stuff doesn't get replaced")
    builder.replace_all(r"\bdoesn't (\S+)", r'\1s')

    bs = builder.build()
    assert bs.original == "it doesn't work and stuff doesn't get replaced"
    assert bs.modified == 'it works and stuff gets replaced'


def test_append():
    builder = BistrBuilder('hello WORLD')
    builder.append(bistr(builder.peek(5)).upper('en_US'))
    builder.skip(1)
    builder.append(bistr(builder.peek(5)).lower('en_US'))

    bs = builder.build()
    assert bs[1:4] == bistr('ell', 'ELL', Alignment.identity(3))
    assert bs[7:10] == bistr('ORL', 'orl', Alignment.identity(3))

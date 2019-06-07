# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from bistring import Alignment
import pytest


def test_empty():
    pytest.raises(ValueError, Alignment, [])

    alignment = Alignment.identity(0)
    assert list(alignment) == [(0, 0)]

    assert alignment.original_bounds() == (0, 0)
    assert alignment.modified_bounds() == (0, 0)

    assert alignment.original_bounds(0, 0) == (0, 0)
    assert alignment.modified_bounds(0, 0) == (0, 0)


def test_identity():
    alignment = Alignment.identity(1, 16)

    assert alignment == Alignment((i, i) for i in range(1, 17))
    assert list(alignment) == [(i, i) for i in range(1, 17)]

    assert alignment.original_bounds() == (1, 16)
    assert alignment.modified_bounds() == (1, 16)

    assert alignment.original_bounds(4, 7) == (4, 7)
    assert alignment.modified_bounds(4, 7) == (4, 7)


def test_aligning():
    alignment = Alignment([(0, 0), (1, 2), (2, 4), (3, 6)])

    assert alignment.original_bounds() == (0, 3)
    assert alignment.modified_bounds() == (0, 6)

    assert alignment.original_bounds(0, 0) == (0, 0)
    assert alignment.original_bounds(0, 1) == (0, 1)
    assert alignment.original_bounds(0, 2) == (0, 1)
    assert alignment.original_bounds(0, 3) == (0, 2)
    assert alignment.original_bounds(1, 1) == (0, 1)
    assert alignment.original_bounds(1, 3) == (0, 2)
    assert alignment.original_bounds(1, 4) == (0, 2)
    assert alignment.original_bounds(2, 2) == (1, 1)
    assert alignment.original_bounds(2, 4) == (1, 2)
    assert alignment.original_bounds(2, 5) == (1, 3)
    assert alignment.original_bounds(3, 3) == (1, 2)

    assert alignment.modified_bounds(0, 0) == (0, 0)
    assert alignment.modified_bounds(0, 1) == (0, 2)
    assert alignment.modified_bounds(0, 2) == (0, 4)
    assert alignment.modified_bounds(0, 3) == (0, 6)
    assert alignment.modified_bounds(1, 1) == (2, 2)
    assert alignment.modified_bounds(2, 2) == (4, 4)


def test_canonicalization():
    assert Alignment([(0, 0), (1, 2), (1, 2), (2, 4)]) == Alignment([(0, 0), (1, 2), (2, 4)])

    assert Alignment([(0, 0), (1, 2)]) + Alignment([(1, 2), (2, 4)]) == Alignment([(0, 0), (1, 2), (2, 4)])


def _test_composition(first, second):
    composed = first.compose(second)
    original_range = composed.original_range()
    modified_range = composed.modified_range()

    assert original_range == first.original_range()
    assert modified_range == second.modified_range()

    for i in original_range:
        for j in original_range[i:]:
            assert composed.modified_bounds(i, j) == second.modified_bounds(first.modified_bounds(i, j))

    for i in modified_range:
        for j in modified_range[i:]:
            assert composed.original_bounds(i, j) == first.original_bounds(second.original_bounds(i, j))


def test_compose():
    first = Alignment((i, 2 * i) for i in range(4))
    second = Alignment((i, 2 * i) for i in range(7))
    _test_composition(first, second)


def _test_identity_composition(alignment):
    _test_composition(alignment, Alignment.identity(alignment.modified_range()))
    _test_composition(Alignment.identity(alignment.original_range()), alignment)


def test_compose_identity():
    alignment = Alignment([
        (0, 2),
        (2, 2),
        (4, 4),
        (6, 6),
        (8, 6),
    ])

    # Modified sequence is smaller
    _test_identity_composition(alignment)

    # Original sequence is smaller
    _test_identity_composition(alignment.inverse())

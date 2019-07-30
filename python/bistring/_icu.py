# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

import icu
from typing import Callable, Optional

from ._bistr import bistr
from ._builder import BistrBuilder


def _edit(bs: bistr, op: Callable, locale: Optional[str] = None) -> bistr:
    builder = BistrBuilder(bs)
    edits = icu.Edits()
    ucur = icu.UnicodeString(builder.current)

    if locale is None:
        umod = icu.UnicodeString(op(ucur, edits))
    else:
        umod = icu.UnicodeString(op(icu.Locale(locale), ucur, edits))

    for is_change, old_len, new_len, old_i, new_i, _ in edits.getFineIterator():
        old_len = ucur.countChar32(old_i, old_len)
        if is_change:
            repl = str(umod[new_i:new_i+new_len])
            builder.replace(old_len, repl)
        else:
            builder.skip(old_len)

    return builder.build()


def casefold(bs: bistr) -> bistr:
    return _edit(bs, icu.CaseMap.fold)


def lower(bs: bistr, locale: Optional[str]) -> bistr:
    return _edit(bs, icu.CaseMap.toLower, locale)


def upper(bs: bistr, locale: Optional[str]) -> bistr:
    return _edit(bs, icu.CaseMap.toUpper, locale)


def title(bs: bistr, locale: Optional[str]) -> bistr:
    return _edit(bs, icu.CaseMap.toTitle, locale)


def _utf16_len(cp: int) -> int:
    if cp >= 0x10000:
        return 2
    else:
        return 1


def _normalize(bs: bistr, normalizer: icu.Normalizer2) -> bistr:
    builder = BistrBuilder(bs)
    us = icu.UnicodeString(bs.modified)
    i16, i32 = 0, 0
    len16 = len(us)

    while i16 < len16:
        j16 = i16 + _utf16_len(ord(bs[i32]))
        j32 = i32 + 1
        while j16 < len16 and not normalizer.hasBoundaryBefore(bs[j32]):
            j16 += _utf16_len(ord(bs[j32]))
            j32 += 1

        chunk = normalizer.normalize(us[i16:j16])
        builder.replace(j32 - i32, chunk)
        i32, i16 = j32, j16

    return builder.build()


_NORMALIZERS = {
    'NFC': icu.Normalizer2.getNFCInstance,
    'NFKC': icu.Normalizer2.getNFKCInstance,
    'NFD': icu.Normalizer2.getNFDInstance,
    'NFKD': icu.Normalizer2.getNFKDInstance,
}

def normalize(bs: bistr, form: str) -> bistr:
    factory = _NORMALIZERS.get(form)
    if factory:
        return _normalize(bs, factory())
    else:
        raise ValueError('invalid normalization form')

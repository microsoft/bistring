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


def _normalize(bs: bistr, normalizer: icu.Normalizer2) -> bistr:
    builder = BistrBuilder(bs)
    us = icu.UnicodeString(bs.modified)
    offset = 0
    while not builder.is_complete:
        i = normalizer.spanQuickCheckYes(us)
        builder.skip(us.countChar32(0, i))
        if builder.is_complete:
            break
        us = us[i:]

        i = 0
        while i < len(us):
            if us.charAt(i) & 0xFC00 == 0xD800:
                i += 1
            i += 1
            if normalizer.hasBoundaryBefore(chr(us.char32At(i))):
                break

        chunk = us[:i]
        normalized = str(normalizer.normalize(chunk))
        builder.replace(chunk.countChar32(), normalized)
        us = us[i:]

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

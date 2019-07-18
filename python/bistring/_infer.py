# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional
import unicodedata

from ._alignment import Alignment
from ._bistr import bistr


@dataclass(frozen=True)
class AugmentedChar:
    """
    A single character (code point) augmented with extra information.
    """

    folded: str
    """
    The case-folded form of the char.
    """

    normalized: str
    """
    The Unicode compatibility normalized form of the char.
    """

    original: str
    """
    The original form of the char.
    """

    top_category: str
    """
    The top-level Unicode category of the char (L, P, Z, etc.).
    """

    category: str
    """
    The specific Unicode category of the char (Lu, Po, Zs, etc.).
    """

    @classmethod
    def cost_fn(cls, a: Optional[AugmentedChar], b: Optional[AugmentedChar]) -> int:
        """
        The cost function between augmented chars.  Each attribute contributes one "point" towards their distance.
        """

        if a is None or b is None:
            if a:
                top_category = a.top_category
            elif b:
                top_category = b.top_category
            else:
                assert False, 'Unreachable'

            if top_category == 'M':
                # Less penalty for combining marks
                return 1
            else:
                # cost(insert) + cost(delete) (3 + 3) should be more than cost(substitute) (5)
                return 3

        result = 0
        result += int(a.folded != b.folded)
        result += int(a.normalized != b.normalized)
        result += int(a.original != b.original)
        result += int(a.top_category != b.top_category)
        result += int(a.category != b.category)
        return result


@dataclass(frozen=True)
class AugmentedString:
    """
    A string augmented with extra information about each character.
    """

    original: str
    """
    The original string.
    """

    chars: List[AugmentedChar]
    """
    The augmented characters of the string.
    """

    alignment: Alignment
    """
    The alignment between the original string and the augmented chars.
    """

    @classmethod
    def augment(cls, original: str) -> AugmentedString:
        normalized = bistr(original).normalize('NFKD')
        folded = bistr(normalized.modified).casefold()

        chars = []
        for i, fold_c in enumerate(folded):
            norm_slice = folded.alignment.original_slice(i, i + 1)
            norm_c = folded.original[norm_slice]

            orig_slice = normalized.alignment.original_slice(norm_slice)
            orig_c = normalized.original[orig_slice]

            cat = unicodedata.category(fold_c)
            top_cat = cat[0]

            chars.append(AugmentedChar(fold_c, norm_c, orig_c, top_cat, cat))

        alignment = normalized.alignment.compose(folded.alignment)
        return cls(original, chars, alignment)


def heuristic_infer(original: str, modified: str) -> bistr:
    """
    Infer the alignment between two strings with a "smart" heuristic.

    We use Unicode normalization and case folding to minimize differences that are due to case, accents, ligatures, etc.
    """

    aug_orig = AugmentedString.augment(original)
    aug_mod = AugmentedString.augment(modified)

    alignment = Alignment.infer(aug_orig.chars, aug_mod.chars, AugmentedChar.cost_fn)
    alignment = aug_orig.alignment.compose(alignment)
    alignment = alignment.compose(aug_mod.alignment.inverse())

    return bistr(original, modified, alignment)

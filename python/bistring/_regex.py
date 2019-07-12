# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

import re
from typing import Match, Pattern

from ._typing import Regex, Replacement


def compile_regex(regex: Regex) -> Pattern[str]:
    if isinstance(regex, str):
        return re.compile(regex)
    else:
        return regex


def expand_template(match: Match[str], repl: Replacement) -> str:
    if callable(repl):
        return repl(match)
    else:
        return match.expand(repl)

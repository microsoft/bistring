/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 */

import BiString, { AnyString } from "./bistring";

export type Replacer = (match: string, ...args: any[]) => string | BiString;
export type MatchReplacer = (match: RegExpMatchArray) => string | BiString;

/**
 * A replacement function that behaves the same as a fixed string supplied to :js:meth:`String.prototype.replace`.
 */
function expandReplacement(replacement: string, match: RegExpMatchArray): string {
    const index = match.index!;
    const input = match.input!;

    let result = "";
    for (let i = 0; i < replacement.length; ++i) {
        const c = replacement[i];
        if (c === "$" && i + 1 < replacement.length) {
            let n = replacement[++i];
            switch (n) {
                case "$":
                    result += "$";
                    continue;
                case "&":
                    result += match[0];
                    continue;
                case "`":
                    result += input.slice(0, index);
                    continue;
                case "'":
                    result += input.slice(index + match[0].length);
                    continue;
            }

            if ("0123456789".includes(n)) {
                const n2 = replacement[i + 1];
                if ("0123456789".includes(n2)) {
                    n += n2;
                    ++i;
                }
                const index = parseInt(n, 10);
                if (index >= 1 && index < match.length) {
                    result += match[index];
                    continue;
                }
            }

            result += c + n;
        } else {
            result += c;
        }
    }

    return result;
}

/**
 * Unify the second argument to :js:meth:`String.prototype.replace` into a replacement function with a nicer signature.
 */
export function normalizeReplacer(replacement: string | Replacer): MatchReplacer {
    if (typeof(replacement) === "string") {
        return match => expandReplacement(replacement, match);
    } else {
        const replacer: (...args: any[]) => AnyString = replacement;
        return match => replacer(...match, match.index, match.input);
    }
}

/**
 * Check if a regexp is stateful (can start from arbitrary offsets).
 */
export function isStatefulRegExp(regexp: RegExp) {
    return regexp.global || regexp.sticky;
}

/**
 * Make a defensive copy of a regular expression.
 */
export function cloneRegExp(regexp: RegExp, addFlags: string = "", removeFlags: string = "") {
    let flags = "";
    for (const flag of regexp.flags) {
        if (!removeFlags.includes(flag)) {
            flags += flag;
        }
    }
    for (const flag of addFlags) {
        if (!flags.includes(flag)) {
            flags += flag;
        }
    }

    return new RegExp(regexp.source, flags);
}

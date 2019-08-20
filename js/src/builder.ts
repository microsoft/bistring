/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 */

import Alignment, { BiIndex } from "./alignment";
import BiString, { AnyString } from "./bistring";
import { Replacer, normalizeReplacer, cloneRegExp, isStatefulRegExp } from "./regex";

/**
 * Bidirectionally transformed string builder.
 *
 *
 * A `BistrBuilder` builds a transformed version of a source string iteratively.  Each builder has an immutable
 * original string, a current string, and the in-progress modified string, with alignments between each.  For example:
 *
 * .. code-block:: text
 *
 *     original: |The| |quick,| |brown| |🦊| |jumps| |over| |the| |lazy| |🐶|
 *               |   | |      | |     | |  \ \     \ \    \ \   \ \    \ \   \
 *     current:  |The| |quick,| |brown| |fox| |jumps| |over| |the| |lazy| |dog|
 *               |   | |      / /     /
 *     modified: |the| |quick| |brown| ...
 *
 * The modified string is built in pieces by calling :js:meth:`replace` to change `n` characters of the current string
 * into new ones in the modified string.  Convenience methods like :js:meth:`skip`, :js:meth:`insert`, and
 * :js:meth:`discard` are implemented on top of this basic primitive.
 */
export default class BiStringBuilder {
    private _original: BiString;
    private _modified: string[];
    private _alignment: BiIndex[];
    private _oPos: number;
    private _mPos: number;

    /**
     * Construct a BiStringBuilder.
     *
     * @param original
     *         Either an original string or a BiString to start from.
     */
    constructor(original: AnyString) {
        this._original = BiString.from(original);
        this._modified = [];
        this._alignment = [[0, 0]];
        this._oPos = 0;
        this._mPos = 0;
    }

    /**
     * The original string being modified.
     */
    get original(): string {
        return this._original.original;
    }

    /**
     * The current string before modifications.
     */
    get current(): string {
        return this._original.modified;
    }

    /**
     * The modified string as built so far.
     */
    get modified(): string {
        return this._modified.join("");
    }

    /**
     * The alignment as built so far from `this.current` to `this.modified`.
     */
    get alignment(): Alignment {
        return new Alignment(this._alignment);
    }

    /**
     * The position of the builder in `this.current`.
     */
    get position(): number {
        return this._oPos;
    }

    /**
     * The number of characters of the current string left to process.
     */
    get remaining(): number {
        return this.current.length - this.position;
    }

    /**
     * Whether we've completely processed the string.  In other words, whether the modified string aligns with the end
     * of the current string.
     */
    get isComplete(): boolean {
        return this.remaining === 0;
    }

    /**
     * Peek at the next few characters.
     *
     * @param n
     *         The number of characters to peek at.
     */
    peek(n: number): string {
        return this.current.slice(this._oPos, this._oPos + n);
    }

    private _advance(oCount: number, mCount: number) {
        this._oPos += oCount;
        this._mPos += mCount;
        if (oCount > 0 || mCount > 0) {
            this._alignment.push([this._oPos, this._mPos]);
        }
    }

    /**
     * Skip the next `n` characters, copying them unchanged.
     */
    skip(n: number) {
        if (n > 0) {
            this._modified.push(this.peek(n));
            for (let i = 0; i < n; ++i) {
                this._advance(1, 1);
            }
        }
    }

    /**
     * Skip the rest of the string, copying it unchanged.
     */
    skipRest() {
        this.skip(this.remaining);
    }

    /**
     * Insert a substring into the string.
     */
    insert(str: string) {
        this.replace(0, str);
    }

    /**
     * Discard a portion of the original string.
     */
    discard(n: number) {
        this.replace(n, "");
    }

    /**
     * Discard the rest of the original string.
     */
    discardRest() {
        this.discard(this.remaining);
    }

    /**
     * Replace the next `n` characters with a new string.
     */
    replace(n: number, str: AnyString) {
        if (typeof(str) === "string") {
            if (str.length > 0) {
                this._modified.push(str);
            }
            this._advance(n, str.length);
        } else {
            if (str.original !== this.peek(n)) {
                throw new Error("BiString doesn't match the current string");
            }

            this._modified.push(str.modified);

            const alignment = str.alignment.values;
            for (let i = 1; i < alignment.length; ++i) {
                const [o0, m0] = alignment[i - 1];
                const [o1, m1] = alignment[i];
                this._advance(o1 - o0, m1 - m0);
            }
        }
    }

    /**
     * Append a BiString.  The original value of the BiString must match the current string being processed.
     */
    append(bs: BiString) {
        this.replace(bs.original.length, bs);
    }

    private _match(pattern: RegExp): RegExpExecArray | null {
        if (!isStatefulRegExp(pattern)) {
            pattern = cloneRegExp(pattern, "g");
        }
        pattern.lastIndex = this.position;
        return pattern.exec(this.current);
    }

    private * _matchAll(pattern: RegExp): IterableIterator<RegExpExecArray> {
        if (pattern.global) {
            pattern.lastIndex = this.position;
            let match;
            while ((match = pattern.exec(this.current))) {
                yield match;
            }
        } else {
            if (!pattern.sticky) {
                pattern = cloneRegExp(pattern, "g");
            }
            pattern.lastIndex = this.position;
            let match;
            if ((match = pattern.exec(this.current))) {
                yield match;
            }
        }
    }

    /**
     * Skip a substring matching a regex, copying it unchanged.
     *
     * @param pattern
     *         The pattern to match.  Must have either the sticky flag, forcing it to match at the current position, or
     *         the global flag, finding the next match.
     * @returns
     *         Whether a match was found.
     */
    skipMatch(pattern: RegExp): boolean {
        if (this._match(pattern)) {
            this.skip(pattern.lastIndex - this.position);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Discard a substring that matches a regex.
     *
     * @param pattern
     *         The pattern to match.  Must have either the sticky flag, forcing it to match at the current position, or
     *         the global flag, finding the next match.
     * @returns
     *         Whether a match was found.
     */
    discardMatch(pattern: RegExp): boolean {
        const match = this._match(pattern);
        if (match) {
            this.skip(match.index - this.position);
            this.discard(match[0].length);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Replace a substring that matches a regex.
     *
     * @param pattern
     *         The pattern to match.  Must have either the sticky flag, forcing it to match at the current position, or
     *         the global flag, finding the next match.
     * @param replacement
     *         The replacement string or function, as in :js:meth:`String.prototype.replace`.
     * @returns
     *         Whether a match was found.
     */
    replaceMatch(pattern: RegExp, replacement: string | Replacer): boolean {
        const replacer = normalizeReplacer(replacement);
        const match = this._match(pattern);
        if (match) {
            this.skip(match.index - this.position);
            this.replace(match[0].length, replacer(match));
            return true;
        } else {
            return false;
        }
    }

    /**
     * Replace all occurences of a regex, like :js:meth:`String.prototype.replace`.
     *
     * @param pattern
     *         The pattern to match.  The global flag (/g) must be set to get multiple matches.
     * @param replacement
     *         The replacement string or function, as in :js:meth:`String.prototype.replace`.
     */
    replaceAll(pattern: RegExp, replacement: string | Replacer) {
        const replacer = normalizeReplacer(replacement);

        for (const match of this._matchAll(pattern)) {
            this.skip(match.index - this.position);
            this.replace(match[0].length, replacer(match));
        }

        this.skipRest();
    }

    /**
     * Build the :js:class:`BiString`.
     */
    build(): BiString {
        if (!this.isComplete) {
            throw new Error(`The string is not completely built yet (${this.remaining} characters remaining)`);
        }

        const alignment = this._original.alignment.compose(this.alignment);
        return new BiString(this.original, this.modified, alignment);
    }

    /**
     * Reset this builder to apply another transformation.
     */
    rewind() {
        this._original = this.build();
        this._modified = [];
        this._alignment = [[0, 0]];
        this._oPos = 0;
        this._mPos = 0;
    }
}

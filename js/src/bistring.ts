/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 */

import Alignment, { Bounds } from "./alignment";
import BiStringBuilder from "./builder";
import heuristicInfer from "./infer";
import { Replacer, normalizeReplacer, cloneRegExp } from "./regex";
import * as unicode from "./unicode";

export type AnyString = string | BiString;

/**
 * A bidirectionally transformed string.
 */
export default class BiString implements Iterable<String> {
    /** The original string, before any modifications. */
    readonly original: string;
    /** The current value of the string, after all modifications. */
    readonly modified: string;
    /** The sequence alignment between `original` and `modified`. */
    readonly alignment: Alignment;
    /** The length of the modified string. */
    readonly length: number;
    /** Indexes the code units of the modified string. */
    readonly [i: number]: string;

    /**
     * A BiString can be constructed from only a single string, which will give it identical original and modified
     * strings and an identity alignment:
     *
     * .. code-block:: ts
     *
     *     new BiString("test");
     *
     * You can also explicitly specify both the original and modified strings.  The inferred alignment will be as course
     * as possible:
     *
     * .. code-block:: ts
     *
     *     new BiString("TEST", "test");
     *
     * Finally, you can specify the alignment explicitly, if you know it:
     *
     * .. code-block:: ts
     *
     *     new BiString("TEST", "test", Alignment.identity(4));
     *
     * @param original
     *         The original string, before any modifications.
     * @param modified
     *         The modified string, after any modifications.
     * @param alignment
     *         The alignment between the original and modified strings.
     */
    constructor(original: string, modified?: string, alignment?: Alignment) {
        if (typeof(original) !== "string") {
            throw new TypeError("original was not a string");
        }
        this.original = original;

        if (modified === undefined) {
            modified = original;
            if (alignment === undefined) {
                alignment = Alignment.identity(original.length);
            }
        } else if (typeof(modified) === "string") {
            if (alignment === undefined) {
                alignment = new Alignment([[0, 0], [original.length, modified.length]]);
            }
        } else {
            throw new TypeError("modified was not a string");
        }
        this.modified = modified;

        if (!(alignment instanceof Alignment)) {
            throw new TypeError("alignment was not an Alignment");
        }

        const [ostart, oend] = alignment.originalBounds();
        if (ostart !== 0 || oend !== original.length) {
            throw new RangeError("Alignment incompatible with original string");
        }

        const [mstart, mend] = alignment.modifiedBounds();
        if (mstart !== 0 || mend !== modified.length) {
            throw new RangeError("Alignment incompatible with modified string");
        }

        this.alignment = alignment;

        this.length = this.modified.length;

        for (let i = 0; i < this.length; ++i) {
            // @ts-ignore: https://github.com/microsoft/TypeScript/issues/6781
            this[i] = this.modified[i];
        }

        Object.freeze(this);
    }

    /**
     * Create a `BiString` from a string-like object.
     *
     * @param str
     *         Either a `string` or a `BiString`.
     * @returns
     *         The input coerced to a `BiString`.
     */
    static from(str: AnyString): BiString {
        if (str instanceof BiString) {
            return str;
        } else {
            return new BiString(str);
        }
    }

    /**
     * Create a `BiString`, automatically inferring an alignment between the `original` and `modified` strings.
     *
     * @param original
     *         The original string.
     * @param modified
     *         The modified string.
     */
    static infer(original: string, modified: string): BiString {
        return heuristicInfer(original, modified);
    }

    /**
     * Iterates over the code points in the modified string.
     */
    [Symbol.iterator](): IterableIterator<string> {
        return this.modified[Symbol.iterator]();
    }

    /**
     * Like :js:meth:`String.prototype.charAt`, returns a code unit as a string from the modified string.
     */
    charAt(pos: number): string {
        return this.modified.charAt(pos);
    }

    /**
     * Like :js:meth:`String.prototype.charCodeAt`, returns a code unit as a number from the modified string.
     */
    charCodeAt(pos: number): number {
        return this.modified.charCodeAt(pos);
    }

    /**
     * Like :js:meth:`String.prototype.codePointAt`, returns a code point from the modified string.
     */
    codePointAt(pos: number): number | undefined {
        return this.modified.codePointAt(pos);
    }

    /**
     * Extract a substring of this BiString, with similar semantics to :js:meth:`String.prototype.substring`.
     */
    substring(start: number, end?: number): BiString {
        if (end === undefined) {
            end = this.length;
        }
        if (start > end) {
            [start, end] = [end, start];
        }
        start = Math.max(0, Math.min(start, this.length));
        end = Math.max(0, Math.min(end, this.length));
        return this.slice(start, end);
    }

    /**
     * Extract a slice of this BiString, with similar semantics to :js:meth:`String.prototype.slice`.
     */
    slice(start: number, end?: number): BiString {
        if (end === undefined) {
            end = this.length;
        }
        if (start < 0) {
            start += this.length;
        }
        if (end < 0) {
            end += this.length;
        }
        if (end < start) {
            end = start;
        }
        start = Math.max(0, Math.min(start, this.length));
        end = Math.max(0, Math.min(end, this.length));

        const alignment = this.alignment.sliceByModified(start, end);
        const modified = this.modified.slice(...alignment.modifiedBounds());
        const original = this.original.slice(...alignment.originalBounds());
        const [o0, m0] = alignment.values[0];
        return new BiString(original, modified, alignment.shift(-o0, -m0));
    }

    /**
     * Concatenate this string together with one or more others.  The additional strings can be either BiStrings or
     * normal strings.
     */
    concat(...others: AnyString[]): BiString {
        let original = this.original;
        let modified = this.modified;
        let alignment = this.alignment;

        for (const other of others) {
            const biother = BiString.from(other);
            alignment = alignment.concat(biother.alignment.shift(original.length, modified.length));
            original += biother.original;
            modified += biother.modified;
        }

        return new BiString(original, modified, alignment);
    }

    /**
     * @returns
     *         The inverse of this string, swapping the original and modified strings.
     */
    inverse(): BiString {
        return new BiString(this.modified, this.original, this.alignment.inverse());
    }

    /**
     * @returns
     *         Whether this BiString is equal to another.
     */
    equals(other: BiString): boolean {
        return this.original === other.original
            && this.modified === other.modified
            && this.alignment.equals(other.alignment);
    }

    /**
     * Like :js:meth:`String.prototype.indexOf`, finds the first occurrence of a substring.
     */
    indexOf(searchValue: string, fromIndex?: number): number {
        return this.modified.indexOf(searchValue, fromIndex);
    }

    /**
     * Like :js:meth:`String.prototype.lastIndexOf`, finds the last occurrence of a substring.
     */
    lastIndexOf(searchValue: string, fromIndex?: number): number {
        return this.modified.lastIndexOf(searchValue, fromIndex);
    }

    /**
     * Like :js:meth:`indexOf`, but returns both the start and end positions for convenience.
     */
    boundsOf(searchValue: string, fromIndex?: number): Bounds {
        let start = this.indexOf(searchValue, fromIndex);
        if (start === -1) {
            return [-1, -1];
        } else {
            return [start, start + searchValue.length];
        }
    }

    /**
     * Like :js:meth:`lastIndexOf`, but returns both the start and end positions for convenience.
     */
    lastBoundsOf(searchValue: string, fromIndex?: number): Bounds {
        let start = this.lastIndexOf(searchValue, fromIndex);
        if (start === -1) {
            return [-1, -1];
        } else {
            return [start, start + searchValue.length];
        }
    }

    /**
     * Like :js:meth:`String.prototype.search`, finds the position of the first match of a regular expression.
     */
    search(regexp: RegExp): number {
        return this.modified.search(regexp);
    }

    /**
     * Like :js:meth:`search`, but returns both the start and end positions for convenience.
     */
    searchBounds(regexp: RegExp): Bounds {
        const match = regexp.exec(this.modified);
        if (match === null) {
            return [-1, -1];
        } else {
            return [match.index, match.index + match[0].length];
        }
    }

    /**
     * Like :js:meth:`String.prototype.match`, returns the result of a regular expression match.
     */
    match(regexp: RegExp): RegExpMatchArray | null {
        return this.modified.match(regexp);
    }

    /**
     * Like :js:meth:`String.prototype.matchAll`, returns an iterator over all regular expression matches.
     */
    matchAll(regexp: RegExp): IterableIterator<RegExpMatchArray> {
        return this.modified.matchAll(regexp);
    }

    private _replaceString(pattern: string, replacement: string | Replacer): BiString {
        const replacer = normalizeReplacer(replacement);
        const builder = new BiStringBuilder(this);

        while (!builder.isComplete) {
            const next = this.indexOf(pattern, builder.position);
            if (next < 0) {
                break;
            }
            builder.skip(next - builder.position);

            const match = [this.modified.slice(next, next + pattern.length)] as RegExpMatchArray;
            match.index = next;
            match.input = this.modified;
            builder.replace(pattern.length, replacer(match));
        }

        builder.skipRest();
        return builder.build();
    }

    private _replaceRegExp(pattern: RegExp, replacement: string | Replacer): BiString {
        const builder = new BiStringBuilder(this);
        builder.replaceAll(pattern, replacement);
        return builder.build();
    }

    /**
     * Like :js:meth:`String.prototype.replace`, returns a new string with regex or fixed-string matches replaced.
     */
    replace(pattern: string | RegExp, replacement: string | Replacer): BiString {
        if (typeof(pattern) === "string") {
            return this._replaceString(pattern, replacement);
        } else {
            return this._replaceRegExp(pattern, replacement);
        }
    }

    /**
     * Like :js:meth:`String.prototype.trim`, returns a new string with leading and trailing whitespace removed.
     */
    trim(): BiString {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    }

    /**
     * Like :js:meth:`String.prototype.trim`, returns a new string with leading whitespace removed.
     */
    trimStart(): BiString {
        return this.replace(/^[\s\uFEFF\xA0]+/, "");
    }

    /**
     * Like :js:meth:`String.prototype.trim`, returns a new string with trailing whitespace removed.
     */
    trimEnd(): BiString {
        return this.replace(/[\s\uFEFF\xA0]+$/, "");
    }

    /**
     * Like :js:meth:`String.prototype.padStart`, pads a string at the beginning to a target length.
     */
    padStart(targetLength: number, padString: string = " "): BiString {
        const padLength = targetLength - this.length;
        if (padLength <= 0) {
            return this;
        }
        if (padString.length < padLength) {
            padString += padString.repeat(targetLength / padString.length);
        }
        padString = padString.slice(0, padLength);
        return new BiString("", padString).concat(this);
    }

    /**
     * Like :js:meth:`String.prototype.padEnd`, pads a string at the end to a target length.
     */
    padEnd(targetLength: number, padString: string = " "): BiString {
        const padLength = targetLength - this.length;
        if (padLength <= 0) {
            return this;
        }
        if (padString.length < padLength) {
            padString += padString.repeat(targetLength / padString.length);
        }
        padString = padString.slice(0, padLength);
        return this.concat(new BiString("", padString));
    }

    /**
     * Like :js:meth:`String.prototype.startsWith`, returns whether this string starts with the given prefix.
     */
    startsWith(searchString: string, position?: number): boolean {
        return this.modified.startsWith(searchString, position);
    }

    /**
     * Like :js:meth:`String.prototype.endsWith`, returns whether this string ends with the given prefix.
     */
    endsWith(searchString: string, position?: number): boolean {
        return this.modified.endsWith(searchString, position);
    }

    private _splitString(pattern: string, limit?: number): BiString[] {
        if (limit === undefined) {
            limit = Infinity;
        }

        const result = [];

        for (let i = 0, j, k; i >= 0 && result.length < limit; i = k) {
            if (pattern.length === 0) {
                if (i + 1 < this.length) {
                    j = k = i + 1;
                } else {
                    j = k = -1;
                }
            } else {
                [j, k] = this.boundsOf(pattern, i);
            }

            if (j >= 0) {
                result.push(this.slice(i, j));
            } else {
                result.push(this.slice(i));
            }
        }

        return result;
    }

    private _splitRegExp(pattern: RegExp, limit?: number): BiString[] {
        pattern = cloneRegExp(pattern, "g", "y");
        if (limit === undefined) {
            limit = Infinity;
        }

        const result = [];

        let last = 0;
        for (const match of this.matchAll(pattern)) {
            if (result.length >= limit) {
                break;
            }

            const start = match.index!;
            const end = start + match[0].length;

            result.push(this.slice(last, start));

            // String.prototype.split() will include any captured substrings in the result.  But we can't support that
            // easily, since JS regexes give us no information about the position of matched capture groups
            if (match.length > 1) {
                throw new Error("split() with capture groups is not supported");
            }

            last = end;
        }

        if (result.length < limit) {
            result.push(this.slice(last));
        }

        return result;
    }

    /**
     * Like :js:meth:`String.prototype.split`, splits this string into chunks using a separator.
     */
    split(separator?: string | RegExp, limit?: number): BiString[] {
        if (separator === undefined) {
            return [this];
        } else if (typeof(separator) === "string") {
            return this._splitString(separator, limit);
        } else {
            return this._splitRegExp(separator, limit);
        }
    }

    /**
     * Like :js:meth:`Array.prototype.join`, joins a sequence together with this `BiString` as the separator.
     */
    join(items: Iterable<AnyString>): BiString {
        let [first, ...rest] = items;
        if (first === undefined) {
            return new BiString("");
        }

        first = BiString.from(first);
        rest = rest.flatMap(s => [this, s]);
        return first.concat(...rest);
    }

    private static _normalFormRegex(form: string) {
        switch (form) {
            case "NFC":
                return unicode.NFC_CHUNK;
            case "NFD":
                return unicode.NFD_CHUNK;
            case "NFKC":
                return unicode.NFKC_CHUNK;
            case "NFKD":
                return unicode.NFKD_CHUNK;
            default:
                throw new RangeError(`Expected a normalization form (NFC, NFD, NFKC, NFKD); found ${form}`);
        }
    }

    /**
     * Like :js:meth:`String.prototype.normalize`, applies a Unicode normalization form.
     *
     * @param form
     *         The normalization form to apply, one of "NFC", "NFD", "NFKC", or "NFKD".
     */
    normalize(form: "NFC" | "NFD" | "NFKC" | "NFKD"): BiString {
        const regex = BiString._normalFormRegex(form);
        return this.replace(regex, m => {
            const result = m.normalize(form);
            if (result === m) {
                return new BiString(m);
            } else {
                return new BiString(m, result);
            }
        });
    }

    private _isFinalSigmaAt(index: number): boolean {
        if (this[index] !== "Σ") {
            return false;
        }

        // Emulate negative lookahead: (?!\p{Case_Ignorable}*+\p{Cased})
        for (let i = index + 1; i < this.length; ++i) {
            const cp = this.codePointAt(i)!;
            const c = String.fromCodePoint(cp);
            if (/\P{Case_Ignorable}/uy.test(c)) {
                if (/\p{Cased}/uy.test(c)) {
                    return false;
                } else {
                    break;
                }
            }
            if (cp > 0xFFFF) {
                ++i;
            }
        }

        // Emulate positive lookbehind: (?<=\p{Cased}\p{Case_Ignorable}*+)
        for (let i = index; i-- > 0;) {
            let cp = this.charCodeAt(i);
            if (i > 0 && (cp & 0xFC00) == 0xDC00 && (this.charCodeAt(i - 1) & 0xFC00) == 0xD800) {
                --i;
                cp = this.codePointAt(i)!;
            }
            const c = String.fromCodePoint(cp);
            if (/\P{Case_Ignorable}/uy.test(c)) {
                if (/\p{Cased}/uy.test(c)) {
                    return true;
                } else {
                    break;
                }
            }
        }

        return false;
    }

    /**
     * Like :js:meth:`String.prototype.toLowerCase`, converts a string to lowercase.
     */
    toLowerCase(): BiString {
        return this.replace(/\p{Changes_When_Lowercased}/gu, (m, ...args) => {
            // This is the only contextual but non-language-specific mapping in SpecialCasing.txt as of Unicode 12.1
            if (this._isFinalSigmaAt(args[args.length - 2])) {
                return "ς";
            } else {
                return m.toLowerCase();
            }
        });
    }

    /**
     * Like :js:meth:`String.prototype.toUpperCase`, converts a string to uppercase.
     */
    toUpperCase(): BiString {
        return this.replace(/\p{Changes_When_Uppercased}/gu, m => m.toUpperCase());
    }
}

/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 */

import Alignment, { BiIndex, Bounds } from "./alignment";
import BiString, { AnyString } from "./bistring";
import { cloneRegExp } from "./regex";

/**
 * A token extracted from a string.
 */
export class Token {
    /** The actual text of the token. */
    readonly text: BiString;
    /** The start position of the token. */
    readonly start: number;
    /** The end position of the token. */
    readonly end: number;

    /**
     * Create a token.
     *
     * @param text
     *         The text of this token.
     * @param start
     *         The start position of the token.
     * @param end
     *         The end position of the token.
     */
    constructor(text: AnyString, start: number, end: number) {
        this.text = BiString.from(text);
        this.start = start;
        this.end = end;
        Object.freeze(this);
    }

    /**
     * Create a token from a slice of a string.
     *
     * @param text
     *         The text to slice.
     * @param start
     *         The start index of the token.
     * @param end
     *         The end index of the token.
     */
    static slice(text: AnyString, start: number, end: number): Token {
        return new Token(BiString.from(text).slice(start, end), start, end);
    }

    /**
     * The original value of the token.
     */
    get original(): string {
        return this.text.original;
    }

    /**
     * The modified value of the token.
     */
    get modified(): string {
        return this.text.modified;
    }
}

/**
 * A string and its tokenization.
 */
export class Tokenization {
    /** The text that was tokenized. */
    readonly text: BiString;
    /** The tokens extracted from the text. */
    readonly tokens: readonly Token[];
    /** The alignment between the text and the tokens. */
    readonly alignment: Alignment;
    /** The number of tokens. */
    readonly length: number;

    /**
     * Create a `Tokenization`.
     *
     * @param text
     *         The text from which the tokens have been extracted.
     * @param tokens
     *         The tokens extracted from the text.
     */
    constructor(text: AnyString, tokens: Iterable<Token>) {
        this.text = BiString.from(text);
        this.tokens = Object.freeze(Array.from(tokens));

        const alignment: BiIndex[] = [[0, 0]];
        this.tokens.forEach((token, i) => {
            alignment.push([token.start, i]);
            alignment.push([token.end, i + 1]);
        });
        alignment.push([this.text.length, this.tokens.length]);
        this.alignment = new Alignment(alignment);

        this.length = this.tokens.length;

        Object.freeze(this);
    }

    /**
     * Infer a `Tokenization` from a sequence of tokens.
     *
     * Due to the possibility of ambiguity, it is much better to use a :js:class:`Tokenizer` or some other method of
     * producing :js:class:`Token`\ s with their positions explicitly set.
     *
     * @param text
     *         The text that was tokenized.
     * @param tokens
     *         The extracted tokens.
     * @returns
     *         The inferred tokenization, with token positions found by simple forward search.
     */
    static infer(text: AnyString, tokens: Iterable<string>) {
        text = BiString.from(text);

        const result = [];
        let start = 0, end;
        for (const token of tokens) {
            [start, end] = text.boundsOf(token, start);
            if (start < 0) {
                throw new Error(`Couldn't find the token "${token}" in the text`);
            }
            result.push(Token.slice(text, start, end));
            start = end;
        }

        return new Tokenization(text, result);
    }

    /**
     * Compute a slice of this tokenization.
     *
     * @param start
     *         The position to start from.
     * @param end
     *         The position to end at.
     * @returns
     *         The requested slice as a new `Tokenization`.
     */
    slice(start?: number, end?: number): Tokenization {
        if (start === undefined) {
            return new Tokenization(this.text, this.tokens);
        }
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

        const substring = this.substring(start, end);
        const tokens = this.tokens.slice(start, end);
        if (tokens.length > 0) {
            const delta = tokens[0].start;
            for (const i in tokens) {
                const token = tokens[i];
                tokens[i] = new Token(token.text, token.start - delta, token.end - delta);
            }
        }

        return new Tokenization(substring, tokens);
    }

    /**
     * Map a span of tokens to the corresponding substring.
     */
    substring(start: number, end: number): BiString {
        const [first, last] = this.textBounds(start, end);
        return this.text.substring(first, last);
    }

    /**
     * Map a span of tokens to the bounds of the corresponding text.
     */
    textBounds(start: number, end: number): Bounds {
        return this.alignment.originalBounds(start, end);
    }

    /**
     * Map a span of tokens to the bounds of the corresponding original text.
     */
    originalBounds(start: number, end: number): Bounds {
        return this.text.alignment.originalBounds(this.textBounds(start, end));
    }

    /**
     * Map a span of text to the bounds of the corresponding span of tokens.
     */
    boundsForText(start: number, end: number): Bounds {
        return this.alignment.modifiedBounds(start, end);
    }

    /**
     * Map a span of original text to the bounds of the corresponding span of tokens.
     */
    boundsForOriginal(start: number, end: number): Bounds {
        const textBounds = this.text.alignment.modifiedBounds(start, end);
        return this.boundsForText(...textBounds);
    }

    /**
     * Map a span of text to the corresponding span of tokens.
     */
    sliceByText(start: number, end: number): Tokenization {
        return this.slice(...this.boundsForText(start, end));
    }

    /**
     * Map a span of original text to the corresponding span of tokens.
     */
    sliceByOriginal(start: number, end: number): Tokenization {
        return this.slice(...this.boundsForOriginal(start, end));
    }

    /**
     * Expand a span of text to align it with token boundaries.
     */
    snapTextBounds(start: number, end: number): Bounds {
        return this.textBounds(...this.boundsForText(start, end));
    }

    /**
     * Expand a span of original text to align it with token boundaries.
     */
    snapOriginalBounds(start: number, end: number): Bounds {
        return this.originalBounds(...this.boundsForOriginal(start, end));
    }
}

/**
 * A tokenizer that produces :js:class:`Tokenization`\ s.
 */
export interface Tokenizer {
    /**
     * Tokenize a string.
     *
     * @param text
     *         The text to tokenize, either a string or a :js:class:`BiString`.
     * @returns
     *         A :js:class:`Tokenization` holding the text and its tokens.
     */
    tokenize(text: AnyString): Tokenization;
}

/**
 * Breaks text into tokens based on a :js:class:`RegExp`.
 */
export class RegExpTokenizer implements Tokenizer {
    private readonly _pattern: RegExp;

    /**
     * Create a `RegExpTokenizer`.
     *
     * @param pattern
     *         The regex that will match tokens.
     */
    constructor(pattern: RegExp) {
        this._pattern = cloneRegExp(pattern, "g");
    }

    tokenize(text: AnyString): Tokenization {
        text = BiString.from(text);

        const tokens = [];
        for (const match of text.matchAll(this._pattern)) {
            const start = match.index!;
            const end = start + match[0].length;
            tokens.push(Token.slice(text, start, end));
        }

        return new Tokenization(text, tokens);
    }
}

/**
 * Splits text into tokens based on a :js:class:`RegExp`.
 */
export class SplittingTokenizer implements Tokenizer {
    private readonly _pattern: RegExp;

    /**
     * Create a `SplittingTokenizer`.
     *
     * @param pattern
     *         A regex that matches the regions between tokens.
     */
    constructor(pattern: RegExp) {
        this._pattern = cloneRegExp(pattern, "g");
    }

    tokenize(text: AnyString): Tokenization {
        text = BiString.from(text);

        const tokens = [];
        let last = 0;
        for (const match of text.matchAll(this._pattern)) {
            const start = match.index!;
            if (start > last) {
                tokens.push(Token.slice(text, last, start));
            }
            last = start + match[0].length;
        }

        if (text.length > last) {
            tokens.push(Token.slice(text, last, text.length));
        }

        return new Tokenization(text, tokens);
    }
}

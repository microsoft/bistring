/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 */

import BiString, { Token, Tokenization, RegExpTokenizer, SplittingTokenizer } from "..";

test("Tokenization", () => {
    let text = new BiString("  The quick, brown fox jumps over the lazy dog  ");
    text = text.replace(",", "");

    let tokens = new Tokenization(text, [
        Token.slice(text, 2, 5),
        Token.slice(text, 6, 11),
        Token.slice(text, 12, 17),
        Token.slice(text, 18, 21),
        Token.slice(text, 22, 27),
        Token.slice(text, 28, 32),
        Token.slice(text, 33, 36),
        Token.slice(text, 37, 41),
        Token.slice(text, 42, 45),
    ]);
    expect(tokens.text.equals(text)).toBe(true);
    expect(tokens.textBounds(1, 3)).toEqual([6, 17]);
    expect(tokens.originalBounds(1, 3)).toEqual([6, 18]);
    expect(tokens.boundsForText(0, 13)).toEqual([0, 3]);
    expect(tokens.boundsForOriginal(0, 13)).toEqual([0, 2]);
    expect(tokens.sliceByText(36, 47).text.equals(new BiString("lazy dog"))).toBe(true);
    expect(tokens.sliceByOriginal(36, 48).text.equals(new BiString("the lazy dog"))).toBe(true);
    expect(tokens.snapTextBounds(1, 13)).toEqual([2, 17]);
    expect(tokens.snapOriginalBounds(36, 47)).toEqual([34, 46]);

    tokens = tokens.slice(1, -1);
    expect(tokens.text.original).toBe("quick, brown fox jumps over the lazy");
    expect(tokens.text.modified).toBe("quick brown fox jumps over the lazy");
    expect(tokens.textBounds(1, 3)).toEqual([6, 15]);
    expect(tokens.originalBounds(1, 3)).toEqual([7, 16]);
    expect(tokens.boundsForText(8, 14)).toEqual([1, 3]);
    expect(tokens.boundsForOriginal(9, 15)).toEqual([1, 3]);
    expect(tokens.sliceByText(8, 14).text.equals(new BiString("brown fox"))).toBe(true);
    expect(tokens.sliceByOriginal(9, 15).text.equals(new BiString("brown fox"))).toBe(true);
    expect(tokens.snapTextBounds(8, 14)).toEqual([6, 15]);
    expect(tokens.snapOriginalBounds(9, 15)).toEqual([7, 16]);
});

test("Tokenization.infer", () => {
    const text = "the quick, brown fox"
    const tokens = Tokenization.infer(text, ["the", "quick", "brown", "fox"]);
    expect(tokens.substring(1, 3).equals(new BiString("quick, brown")));

    expect(() => Tokenization.infer(text, ["the", "quick", "red", "fox"])).toThrow();
});

test("RegExpTokenizer", () => {
    const text = new BiString(" The quick, brown fox jumps over the lazy dog ");

    const tokenizer = new RegExpTokenizer(/\w+/g);
    const tokens = tokenizer.tokenize(text);

    expect(tokens.text).toBe(text);
    expect(tokens.length).toBe(9);
    expect(tokens.textBounds(0, 2)).toEqual([1, 10]);
    expect(tokens.slice(0, 2).text.equals(text.slice(1, 10))).toBe(true);
    expect(tokens.sliceByText(5, 10).length).toBe(1);
    expect(tokens.sliceByText(5, 11).length).toBe(1);
    expect(tokens.sliceByText(3, 13).length).toBe(3);
});

test("SplittingTokenizer", () => {
    const text = new BiString(" The quick, brown fox jumps over the lazy dog ");

    const tokenizer = new SplittingTokenizer(/\s+/g);
    const tokens = tokenizer.tokenize(text);

    expect(tokens.text).toBe(text);
    expect(tokens.length).toBe(9);
    expect(tokens.textBounds(0, 2)).toEqual([1, 11]);
    expect(tokens.slice(0, 2).text.equals(text.slice(1, 11))).toBe(true);
    expect(tokens.sliceByText(5, 10).length).toBe(1);
    expect(tokens.sliceByText(5, 11).length).toBe(1);
    expect(tokens.sliceByText(3, 13).length).toBe(3);
});

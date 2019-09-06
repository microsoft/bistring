/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 */

import BiString, { Token, Tokenization, RegExpTokenizer, SplittingTokenizer } from "..";

test("Tokenization", () => {
    let text = new BiString("  The quick, brown fox jumps over the lazy dog  ");
    text = text.replace(",", "");
    text = text.replace(/^ +| +$/g, "");

    let tokens = new Tokenization(text, [
        Token.slice(text, 0, 3),
        Token.slice(text, 4, 9),
        Token.slice(text, 10, 15),
        Token.slice(text, 16, 19),
        Token.slice(text, 20, 25),
        Token.slice(text, 26, 30),
        Token.slice(text, 31, 34),
        Token.slice(text, 35, 39),
        Token.slice(text, 40, 43),
    ]);
    expect(tokens.text.equals(text)).toBe(true);
    expect(tokens.textBounds(1, 3)).toEqual([4, 15]);
    expect(tokens.originalBounds(1, 3)).toEqual([6, 18]);
    expect(tokens.boundsForText(0, 13)).toEqual([0, 3]);
    expect(tokens.boundsForOriginal(0, 13)).toEqual([0, 2]);
    expect(tokens.sliceByText(34, 43).substring().equals(new BiString("lazy dog"))).toBe(true);
    expect(tokens.sliceByOriginal(36, 48).substring().equals(new BiString("the lazy dog"))).toBe(true);
    expect(tokens.snapTextBounds(2, 13)).toEqual([0, 15]);
    expect(tokens.snapOriginalBounds(36, 47)).toEqual([34, 46]);
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
    expect(tokens.slice(0, 2).substring().equals(text.slice(1, 10))).toBe(true);
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
    expect(tokens.slice(0, 2).substring().equals(text.slice(1, 11))).toBe(true);
    expect(tokens.sliceByText(5, 10).length).toBe(1);
    expect(tokens.sliceByText(5, 11).length).toBe(1);
    expect(tokens.sliceByText(3, 13).length).toBe(3);
});

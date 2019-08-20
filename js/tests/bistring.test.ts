/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 */

import { BiString, Alignment } from "..";

test("new BiString", () => {
    expect(() => new BiString(42 as any)).toThrow(TypeError);
    expect(() => new BiString("fourty-two", 42 as any)).toThrow(TypeError);
    expect(() => new BiString("fourty-two", "42", 42 as any)).toThrow(TypeError);

    expect(() => new BiString("fourty-two", "42", new Alignment([
        [0, 0],
        [9, 2],
    ])))
    .toThrow(RangeError);

    expect(() => new BiString("fourty-two", "42", new Alignment([
        [0, 0],
        [10, 1],
    ])))
    .toThrow(RangeError);

    new BiString("42");
    new BiString("fourty-two", "42");
    new BiString("fourty-two", "42", new Alignment([
        [0, 0],
        [6, 1],
        [7, 1],
        [10, 2],
    ]));
});

test("BiString.infer", () => {
    let bs = BiString.infer("test", "test");
    expect(bs.equals(new BiString("test"))).toBe(true);

    bs = BiString.infer("color", "colour");
    expect(bs.substring(3, 5).original).toBe("o");
    expect(bs.inverse().equals(BiString.infer("colour", "color"))).toBe(true);

    bs = BiString.infer(
        "🅃🄷🄴 🅀🅄🄸🄲🄺, 🄱🅁🄾🅆🄽 🦊 🄹🅄🄼🄿🅂 🄾🅅🄴🅁 🅃🄷🄴 🄻🄰🅉🅈 🐶",
        "the quick brown fox jumps over the lazy dog",
    );
    expect(bs.substring(0, 3).original).toBe("🅃🄷🄴");
    expect(bs.substring(0, 3).modified).toBe("the");
    expect(bs.substring(4, 9).original).toBe("🅀🅄🄸🄲🄺");
    expect(bs.substring(4, 9).modified).toBe("quick");
    expect(bs.substring(10, 15).original).toBe("🄱🅁🄾🅆🄽");
    expect(bs.substring(10, 15).modified).toBe("brown");
    expect(bs.substring(16, 19).original).toBe("🦊");
    expect(bs.substring(16, 19).modified).toBe("fox");
    expect(bs.substring(20, 25).original).toBe("🄹🅄🄼🄿🅂");
    expect(bs.substring(20, 25).modified).toBe("jumps");
    expect(bs.substring(40, 43).original).toBe("🐶");
    expect(bs.substring(40, 43).modified).toBe("dog");

    bs = BiString.infer(
        "Ṫḧë qüïċḳ, ḅṛöẅṅ 🦊 jüṁṗṡ öṿëṛ ẗḧë ḷäżÿ 🐶",
        "the quick brown fox jumps over the lazy dog",
    );
    expect(bs.substring(0, 3).equals(new BiString("Ṫḧë", "the", Alignment.identity(3)))).toBe(true);
    expect(bs.substring(4, 9).equals(new BiString("qüïċḳ", "quick", Alignment.identity(5)))).toBe(true);
    expect(bs.substring(10, 15).equals(new BiString("ḅṛöẅṅ", "brown", Alignment.identity(5)))).toBe(true);
    expect(bs.substring(16, 19).original).toBe("🦊");
    expect(bs.substring(16, 19).modified).toBe("fox");
    expect(bs.substring(20, 25).equals(new BiString("jüṁṗṡ", "jumps", Alignment.identity(5)))).toBe(true);
    expect(bs.substring(40, 43).original).toBe("🐶");
    expect(bs.substring(40, 43).modified).toBe("dog");

    bs = BiString.infer("Z̴̡̪̫̖̥̔̿̃̈̏̎͠͝á̸̪̠̖̻̬̖̪̞͙͇̮̠͎̆͋́̐͌̒͆̓l̶͉̭̳̤̬̮̩͎̟̯̜͇̥̠̘͑͐̌͂̄́̀̂̌̈͛̊̄̚͜ģ̸̬̼̞̙͇͕͎̌̾̒̐̿̎̆̿̌̃̏̌́̾̈͘͜o̶̢̭͕͔̩͐ ̴̡̡̜̥̗͔̘̦͉̣̲͚͙̐̈́t̵͈̰̉̀͒̎̈̿̔̄̽͑͝͠ẹ̵̫̲̫̄͜͜x̵͕̳͈̝̤̭̼̼̻͓̿̌̽̂̆̀̀̍̒͐́̈̀̚͝t̸̡̨̥̺̣̟͎̝̬̘̪͔͆́̄̅̚", "Zalgo text");
    for (let i = 0; i < bs.length; ++i) {
        expect(bs.substring(i, i + 1).original.startsWith(bs[i])).toBe(true);
    }

    expect(BiString.infer("", "").equals(new BiString(""))).toBe(true);
    expect(BiString.infer("a", "").equals(new BiString("a", ""))).toBe(true);
    expect(BiString.infer("", "a").equals(new BiString("", "a"))).toBe(true);
});

test("BiString.concat", () => {
    let bs = new BiString("  ", "").concat(
        "Hello",
        new BiString("  ", " "),
        "world!",
        new BiString("  ", ""),
    );

    expect(bs.original).toBe("  Hello  world!  ");
    expect(bs.modified).toBe("Hello world!");

    bs = bs.substring(4, 7);
    expect(bs.original).toBe("o  w");
    expect(bs.modified).toBe("o w");

    bs = bs.substring(1, 2);
    expect(bs.original).toBe("  ");
    expect(bs.modified).toBe(" ");
});

test("BiString.indexOf", () => {
    const bs = new BiString("dysfunction");

    expect(bs.indexOf("dis")).toBe(-1);
    expect(bs.indexOf("fun")).toBe(3);
    expect(bs.indexOf("n")).toBe(5);
    expect(bs.indexOf("n", 6)).toBe(10);
    expect(bs.indexOf("n", 11)).toBe(-1);

    expect(bs.boundsOf("dis")).toEqual([-1, -1]);
    expect(bs.boundsOf("fun")).toEqual([3, 6]);
    expect(bs.boundsOf("n")).toEqual([5, 6]);
    expect(bs.boundsOf("n", 6)).toEqual([10, 11]);
    expect(bs.boundsOf("n", 11)).toEqual([-1, -1]);
});

test("BiString.lastIndexOf", () => {
    const bs = new BiString("dysfunction");

    expect(bs.lastIndexOf("dis")).toBe(-1);
    expect(bs.lastIndexOf("fun")).toBe(3);
    expect(bs.lastIndexOf("n")).toBe(10);
    expect(bs.lastIndexOf("n", 9)).toBe(5);
    expect(bs.lastIndexOf("n", 4)).toBe(-1);

    expect(bs.lastBoundsOf("dis")).toEqual([-1, -1]);
    expect(bs.lastBoundsOf("fun")).toEqual([3, 6]);
    expect(bs.lastBoundsOf("n")).toEqual([10, 11]);
    expect(bs.lastBoundsOf("n", 9)).toEqual([5, 6]);
    expect(bs.lastBoundsOf("n", 4)).toEqual([-1, -1]);
});

test("BiString.{starts,ends}With", () => {
    const bs = new BiString("Beginning, middle, ending");

    expect(bs.startsWith("Begin")).toBe(true);
    expect(bs.endsWith("ing")).toBe(true);

    expect(bs.startsWith("ending")).toBe(false);
    expect(bs.endsWith("Beginning")).toBe(false);
});

test("BiString.pad*", () => {
    const bs = new BiString("Hello world!");

    expect(bs.padStart(5).equals(bs)).toBe(true);
    expect(bs.padEnd(5).equals(bs)).toBe(true);

    let pad = new BiString("", "    ");
    expect(bs.padStart(16).equals(pad.concat(bs))).toBe(true);
    expect(bs.padEnd(16).equals(bs.concat(pad))).toBe(true);
});

test("BiString.split", () => {
    let bs = new BiString("The quick, brown fox jumps over the lazy dog");

    expect(bs.split()).toEqual([bs]);

    expect(bs.split("").map(s => s.modified)).toEqual(bs.modified.split(""));

    expect(bs.split(" ").map(s => s.modified)).toEqual(bs.modified.split(" "));
    expect(bs.split(/ /).map(s => s.modified)).toEqual(bs.modified.split(/ /));

    expect(bs.split(/ /y).map(s => s.modified)).toEqual(bs.modified.split(/ /y));

    expect(bs.split("", 0).map(s => s.modified)).toEqual(bs.modified.split("", 0));
    expect(bs.split(" ", 0).map(s => s.modified)).toEqual(bs.modified.split(" ", 0));
    expect(bs.split(/ /, 0).map(s => s.modified)).toEqual(bs.modified.split(/ /, 0));

    expect(bs.split("", 3).map(s => s.modified)).toEqual(bs.modified.split("", 3));
    expect(bs.split(" ", 3).map(s => s.modified)).toEqual(bs.modified.split(" ", 3));
    expect(bs.split(/ /, 3).map(s => s.modified)).toEqual(bs.modified.split(/ /, 3));

    expect(bs.split("", 20).map(s => s.modified)).toEqual(bs.modified.split("", 20));
    expect(bs.split(" ", 20).map(s => s.modified)).toEqual(bs.modified.split(" ", 20));
    expect(bs.split(/ /, 20).map(s => s.modified)).toEqual(bs.modified.split(/ /, 20));

    bs = new BiString(" The quick, brown fox");
    expect(bs.split(" ").map(s => s.modified)).toEqual(bs.modified.split(" "));
    expect(bs.split(/ /).map(s => s.modified)).toEqual(bs.modified.split(/ /));

    bs = new BiString("The quick, brown fox ");
    expect(bs.split(" ").map(s => s.modified)).toEqual(bs.modified.split(" "));
    expect(bs.split(/ /).map(s => s.modified)).toEqual(bs.modified.split(/ /));

    bs = new BiString(" The quick, brown fox ");
    expect(bs.split(" ").map(s => s.modified)).toEqual(bs.modified.split(" "));
    expect(bs.split(/ /).map(s => s.modified)).toEqual(bs.modified.split(/ /));
});

test("BiString.join", () => {
    const sep = new BiString(" ", ", ");
    const chunks = new BiString("The quick brown fox").split(" ");
    const bs = sep.join(chunks);
    expect(bs.original).toBe("The quick brown fox");
    expect(bs.modified).toBe("The, quick, brown, fox");
});

test("BiString.trim{,Start,End}", () => {
    let bs = new BiString("  Hello  world!  ");
    expect(bs.trim().modified).toBe("Hello  world!");
    expect(bs.trimStart().modified).toBe("Hello  world!  ");
    expect(bs.trimEnd().modified).toBe("  Hello  world!");

    bs = new BiString("    ");
    expect(bs.trim().modified).toBe("");
    expect(bs.trimStart().modified).toBe("");
    expect(bs.trimEnd().modified).toBe("");
});

test("BiString.normalize", () => {
    // "Héllö" -- é is composed but ö has a combining diaeresis
    let bs = new BiString("H\u00E9llo\u0308").normalize("NFC");
    expect(bs.original).toBe("H\u00E9llo\u0308");
    expect(bs.modified).toBe("H\u00E9ll\u00F6");
    expect(bs.modified).toBe(bs.original.normalize("NFC"));
    expect(bs.slice(1, 2).equals(new BiString("\u00E9"))).toBe(true);
    expect(bs.slice(4, 5).equals(new BiString("o\u0308", "\u00F6"))).toBe(true);

    bs = new BiString("H\u00E9llo\u0308").normalize("NFD");
    expect(bs.original).toBe("H\u00E9llo\u0308");
    expect(bs.modified).toBe("He\u0301llo\u0308");
    expect(bs.modified).toBe(bs.original.normalize("NFD"));
    expect(bs.slice(1, 3).equals(new BiString("\u00E9", "e\u0301"))).toBe(true);
    expect(bs.slice(5, 7).original).toBe("o\u0308");
    expect(bs.slice(5, 7).modified).toBe("o\u0308");
    expect(bs.slice(5, 7).equals(new BiString("o\u0308"))).toBe(true);
});

test("BiString.toLowerCase", () => {
    let bs = new BiString("Hello World").toLowerCase();
    let expected = new BiString("Hello World", "hello world", Alignment.identity(11));
    expect(bs.equals(expected)).toBe(true);

    // Odysseus
    bs = new BiString("ὈΔΥΣΣΕΎΣ").toLowerCase();
    expected = new BiString("ὈΔΥΣΣΕΎΣ", "ὀδυσσεύς", Alignment.identity(8));
    expect(bs.equals(expected)).toBe(true);

    // Examples from The Unicode Standard, Version 12.0, Chapter 3.13
    bs = new BiString("ᾼΣͅ").toLowerCase();
    expected = new BiString("ᾼΣͅ", "ᾳςͅ", Alignment.identity(4));
    expect(bs.equals(expected)).toBe(true);

    bs = new BiString("ͅΣͅ").toLowerCase();
    expected = new BiString("ͅΣͅ", "ͅσͅ", Alignment.identity(3));
    expect(bs.equals(expected)).toBe(true);

    bs = new BiString("ᾼΣᾼ").toLowerCase();
    expected = new BiString("ᾼΣᾼ", "ᾳσᾳ", Alignment.identity(5));
    expect(bs.equals(expected)).toBe(true);

    bs = new BiString("Σ").toLowerCase();
    expected = new BiString("Σ", "σ");
    expect(bs.equals(expected)).toBe(true);
});

test("BiString.toUpperCase", () => {
    let bs = new BiString("Hello World").toUpperCase();
    let expected = new BiString("Hello World", "HELLO WORLD", Alignment.identity(11));
    expect(bs.equals(expected)).toBe(true);

    bs = new BiString("straße").toUpperCase();
    expected = new BiString("stra", "STRA", Alignment.identity(4)).concat(
        new BiString("ß", "SS"),
        new BiString("e", "E"),
    );
    expect(bs.equals(expected)).toBe(true);

    // Odysseus
    bs = new BiString("Ὀδυσσεύς").toUpperCase();
    expected = new BiString("Ὀδυσσεύς", "ὈΔΥΣΣΕΎΣ", Alignment.identity(8));
    expect(bs.equals(expected)).toBe(true);
});

test("README", () => {
    let bs = new BiString("𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 🦊 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 🐶");
    bs = bs.normalize("NFKD");
    bs = bs.toLowerCase();
    bs = bs.replace("🦊", "fox")
    bs = bs.replace("🐶", "dog")
    bs = bs.replace(/[^\w\s]+/g, "");
    bs = bs.slice(0, 19);
    expect(bs.modified).toBe("the quick brown fox");
    expect(bs.original).toBe("𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 🦊");
});

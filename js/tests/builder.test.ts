import { BiString, BiStringBuilder, Alignment } from "..";

test("BiStringBuilder word chunks", () => {
    const builder = new BiStringBuilder("  the quick  brown fox ")
    builder.discard(2);
    builder.replace(3, "the");
    builder.skip(1);
    builder.replace(5, "quick");
    builder.replace(2, " ");
    builder.replace(5, "brown");
    builder.skip(1);
    builder.replace(3, "fox");
    builder.discard(1);

    const bs = builder.build();

    expect(bs.original).toBe("  the quick  brown fox ");
    expect(bs.modified).toBe("the quick brown fox");

    expect(bs.slice(0, 1).original).toBe("the");
    expect(bs.slice(1, 2).original).toBe("the");
    expect(bs.slice(2, 3).original).toBe("the");

    expect(bs.slice(0, 3).original).toBe("the");
    expect(bs.slice(1, 3).original).toBe("the");

    expect(bs.slice(0, 4).original).toBe("the ");

    expect(bs.slice(3, 4).original).toBe(" ");
    expect(bs.slice(9, 10).original).toBe("  ");

    expect(bs.slice(4, 15).original).toBe("quick  brown");
    expect(bs.slice(5, 14).original).toBe("quick  brown");

    expect(bs.slice(0, 0).original).toBe("");
    expect(bs.slice(10, 10).original).toBe("");
});

test("BiStringBuilder char chunks", () => {
    const builder = new BiStringBuilder("  the quick  brown fox ");
    builder.discardMatch(/\s+/y);
    while (!builder.isComplete) {
        builder.skipMatch(/\S+/y);
        builder.replaceMatch(/\s+(?=\S)/y, " ");
        builder.discardMatch(/\s+$/y);
    }

    const bs = builder.build();

    expect(bs.original).toBe("  the quick  brown fox ");
    expect(bs.modified).toBe("the quick brown fox");

    expect(bs.slice(0, 1).original).toBe("t");
    expect(bs.slice(1, 2).original).toBe("h");
    expect(bs.slice(2, 3).original).toBe("e");

    expect(bs.slice(0, 3).original).toBe("the");
    expect(bs.slice(1, 3).original).toBe("he");

    expect(bs.slice(0, 4).original).toBe("the ");
    expect(bs.slice(1, 4).original).toBe("he ");

    expect(bs.slice(3, 4).original).toBe(" ");
    expect(bs.slice(9, 10).original).toBe("  ");

    expect(bs.slice(4, 15).original).toBe("quick  brown");
    expect(bs.slice(5, 14).original).toBe("uick  brow");

    expect(bs.slice(0, 0).original).toBe("");
    expect(bs.slice(10, 10).original).toBe("");
});

test("BiStringBuilder('')", () => {
    const builder = new BiStringBuilder("");
    const bs = builder.build();
    expect(bs.original).toBe("");
    expect(bs.modified).toBe("");
    expect(bs.slice(0, 0).original).toBe("");
});

test("BiStringBuilder.rewind", () => {
    const builder = new BiStringBuilder("I wish I wouldn't've spent one thousand dollars.");
    builder.skipMatch(/[^.]*/y);
    builder.discardRest();
    builder.rewind();
    builder.skipMatch(/I wish I would/y);
    builder.replaceMatch(/n't/y, " not");
    builder.replaceMatch(/'ve/y, " have");
    builder.skipMatch(/ spent /y);
    builder.replaceMatch(/one thousand dollars/y, "$1,000");

    const bs = builder.build();
    expect(bs.original).toBe("I wish I wouldn't've spent one thousand dollars.");
    expect(bs.modified).toBe("I wish I would not have spent $1,000");
});

test("BiStringBuilder.replaceAll", () => {
    const builder = new BiStringBuilder("the cheese that the mouse that the cat that the dog chased played with ate");
    builder.replaceMatch(/that/, "which");
    builder.replaceAll(/that/g, "whom");

    const bs = builder.build();
    expect(bs.original).toBe("the cheese that the mouse that the cat that the dog chased played with ate");
    expect(bs.modified).toBe("the cheese which the mouse whom the cat whom the dog chased played with ate");
});

test("BiStringBuilder.replaceAll back-references", () => {
    const builder = new BiStringBuilder("it doesn't work and stuff doesn't get replaced");
    builder.replaceAll(/\bdoesn't (\S+)/g, "$1s");

    const bs = builder.build();
    expect(bs.original).toBe("it doesn't work and stuff doesn't get replaced");
    expect(bs.modified).toBe("it works and stuff gets replaced");
});

test("BiStringBuilder.append", () => {
    const builder = new BiStringBuilder("hello WORLD");
    builder.append(new BiString("hello", "HELLO", Alignment.identity(5)));
    builder.skip(1)
    builder.append(new BiString("WORLD", "world", Alignment.identity(5)));

    const bs = builder.build();
    expect(bs.slice(1, 4).equals(new BiString("ell", "ELL", Alignment.identity(3)))).toBe(true);
    expect(bs.slice(7, 10).equals(new BiString("ORL", "orl", Alignment.identity(3)))).toBe(true);
});

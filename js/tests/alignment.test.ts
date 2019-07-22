/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 */

import { Alignment } from "..";

test("Empty Alignment", () => {
    expect(() => new Alignment([])).toThrow();

    const a = Alignment.identity(0);
    expect(a.values).toEqual([[0, 0]]);

    expect(a.originalBounds()).toEqual([0, 0]);
    expect(a.modifiedBounds()).toEqual([0, 0]);

    expect(a.originalBounds(0, 0)).toEqual([0, 0]);
    expect(a.modifiedBounds(0, 0)).toEqual([0, 0]);
});

test("Alignment.identity()", () => {
    const a = Alignment.identity(1, 16);

    const values = [];
    for (let i = 1; i <= 16; ++i) {
        values.push([i, i]);
    }
    expect(a.values).toEqual(values);

    expect(a.originalBounds()).toEqual([1, 16]);
    expect(a.modifiedBounds()).toEqual([1, 16]);

    expect(a.originalBounds(4, 7)).toEqual([4, 7]);
    expect(a.modifiedBounds(4, 7)).toEqual([4, 7]);
});

test("Alignment", () => {
    const a = new Alignment([[0, 0], [1, 2], [2, 4], [3, 6]]);

    expect(a.originalBounds()).toEqual([0, 3]);
    expect(a.modifiedBounds()).toEqual([0, 6]);

    expect(a.originalBounds(0, 0)).toEqual([0, 0]);
    expect(a.originalBounds(0, 1)).toEqual([0, 1]);
    expect(a.originalBounds(0, 2)).toEqual([0, 1]);
    expect(a.originalBounds(0, 3)).toEqual([0, 2]);
    expect(a.originalBounds(1, 1)).toEqual([0, 1]);
    expect(a.originalBounds(1, 3)).toEqual([0, 2]);
    expect(a.originalBounds(1, 4)).toEqual([0, 2]);
    expect(a.originalBounds(2, 2)).toEqual([1, 1]);
    expect(a.originalBounds(2, 4)).toEqual([1, 2]);
    expect(a.originalBounds(2, 5)).toEqual([1, 3]);
    expect(a.originalBounds(3, 3)).toEqual([1, 2]);

    expect(a.modifiedBounds(0, 0)).toEqual([0, 0]);
    expect(a.modifiedBounds(0, 1)).toEqual([0, 2]);
    expect(a.modifiedBounds(0, 2)).toEqual([0, 4]);
    expect(a.modifiedBounds(0, 3)).toEqual([0, 6]);
    expect(a.modifiedBounds(1, 1)).toEqual([2, 2]);
    expect(a.modifiedBounds(2, 2)).toEqual([4, 4]);
});

test("Alignment canonicalization", () => {
    let a = new Alignment([[0, 0], [1, 2], [1, 2], [2, 4]]);
    expect(a.values).toEqual([[0, 0], [1, 2], [2, 4]]);

    a = new Alignment([[0, 0], [1, 2]])
        .concat(new Alignment([[1, 2], [2, 4]]));
    expect(a.values).toEqual([[0, 0], [1, 2], [2, 4]]);
});

function test_composition(first: Alignment, second: Alignment) {
    const composed = first.compose(second);

    const [of, ol] = composed.originalBounds();
    const [mf, ml] = composed.modifiedBounds();

    expect([of, ol]).toEqual(first.originalBounds());
    expect([mf, ml]).toEqual(second.modifiedBounds());

    for (let i = of; i <= ol; ++i) {
        for (let j = i; j <= ol; ++j) {
            expect(composed.modifiedBounds(i, j))
                .toEqual(second.modifiedBounds(first.modifiedBounds(i, j)));
        }
    }

    for (let i = mf; i <= ml; ++i) {
        for (let j = i; j <= ml; ++j) {
            expect(composed.originalBounds(i, j))
                .toEqual(first.originalBounds(second.originalBounds(i, j)));
        }
    }
}

test("Alignment.compose", () => {
    const first = new Alignment([
        [0, 0],
        [1, 2],
        [2, 4],
        [3, 6],
    ]);
    const second = new Alignment([
        [0, 0],
        [1, 2],
        [2, 4],
        [3, 6],
        [4, 8],
        [5, 10],
        [6, 11],
    ]);
    test_composition(first, second);
});

function test_identity_composition(alignment: Alignment) {
    test_composition(alignment, Alignment.identity(alignment.modifiedBounds()));
    test_composition(Alignment.identity(alignment.originalBounds()), alignment);
}

test("Alignment.compose(Alignment.identity)", () => {
    const a = new Alignment([
        [0, 2],
        [2, 2],
        [4, 4],
        [6, 6],
        [8, 6],
    ]);

    // Modified sequence is smaller
    test_identity_composition(a);

    // Original sequence is smaller
    test_identity_composition(a.inverse());
});

test("Alignment.infer", () => {
    let a = Alignment.infer("test", "test");
    let b = Alignment.identity(4);
    expect(a.equals(b)).toBe(true);

    a = Alignment.infer("asdf", "jkl;");
    expect(a.equals(b)).toBe(true);

    a = Alignment.infer("color", "colour");
    b = new Alignment([
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
        [4, 5],
        [5, 6],
    ]);
    expect(a.equals(b)).toBe(true);

    a = Alignment.infer("ab---", "ab");
    b = new Alignment([
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
    ])
    expect(a.equals(b)).toBe(true);
});

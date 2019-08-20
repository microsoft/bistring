/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 */

export type Bounds = readonly [number, number];
export type BiIndex = readonly [number, number];

type CostFn<T, U> = (o?: T, m?: U) => number;

/**
 * An alignment between two related sequences.
 *
 * Consider this alignment between two strings:
 *
 * .. code-block:: text
 *
 *     |it's| |aligned!|
 *     |    \ \        |
 *     |it is| |aligned|
 *
 * An alignment stores all the indices that are known to correspond between the original and modified sequences.  For
 * the above example, it would be
 *
 * .. code-block:: ts
 *
 *     let a = new Alignment([
 *         [0, 0],
 *         [4, 5],
 *         [5, 6],
 *         [13, 13],
 *     ]);
 *
 * Alignments can be used to answer questions like, "what's the smallest range of the original sequence that is
 * guaranteed to contain this part of the modified sequence?"  For example, the range `(0, 5)` ("it is") is known to
 * match the range `(0, 4)` ("it's") of the original sequence.
 *
 * .. code-block:: ts
 *
 *     console.log(a.original_bounds(0, 5));
 *     // [0, 4]
 *
 * Results may be imprecise if the alignment is too course to match the exact inputs:
 *
 * .. code-block:: ts
 *
 *     console.log(a.original_bounds(0, 2));
 *     // [0, 4]
 *
 * A more granular alignment like this:
 *
 * .. code-block:: text
 *
 *     |i|t|'s| |a|l|i|g|n|e|d|!|
 *     | | |  \ \ \ \ \ \ \ \ \ /
 *     |i|t| is| |a|l|i|g|n|e|d|
 *
 * .. code-block:: ts
 *
 *     a = new Alignment([
 *         [0, 0], [1, 1], [2, 2], [4, 5], [5, 6], [6, 7], [7, 8],
 *         [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 13],
 *     ]);
 *
 * Can be more precise:
 *
 * .. code-block:: ts
 *
 *     console.log(a.original_bounds(0, 2));
 *     // [0, 2]
 */
export default class Alignment {
    readonly values: readonly BiIndex[];
    readonly length: number;

    /**
     * Create a new Alignment.
     *
     * @param values
     *         The pairs of indices to align.  Each element should be a pair destructurable as `[x, y]`, where `x` is
     *         the original sequence position and `y` is the modified sequence position.
     */
    constructor(values: Iterable<BiIndex>) {
        const copy: BiIndex[] = [];

        for (const [o, m] of values) {
            if (copy.length > 0) {
                const [oPrev, mPrev] = copy[copy.length - 1];
                if (o < oPrev) {
                    throw new Error("Original sequence position moved backwards")
                } else if (m < mPrev) {
                    throw new Error("Modified sequence position moved backwards")
                } else if (o === oPrev && m === mPrev) {
                    continue;
                }
            }
            copy.push(Object.freeze([o, m] as BiIndex));
        }

        if (copy.length === 0) {
            throw new Error("No sequence positions to align");
        }

        this.values = Object.freeze(copy);
        this.length = copy.length;

        Object.freeze(this);
    }

    static identity(bounds: Bounds): Alignment;
    static identity(start: number, end?: number): Alignment;

    /**
     * Create an identity alignment, which maps all intervals to themselves.  You can pass the size of the sequence:
     *
     * .. code-block:: ts
     *
     *     let a = Alignment.identity(5);
     *
     * or the start and end positions:
     *
     * .. code-block:: ts
     *
     *     a = Alignment.identity(1, 5);
     *
     * or the bounds in a single parameter:
     *
     * .. code-block:: ts
     *
     *     a = Alignment.identity([1, 5]);
     */
    static identity(start: number | Bounds, end?: number): Alignment {
        if (typeof(start) !== "number") {
            end = start[1];
            start = start[0];
        }

        if (end === undefined) {
            end = start;
            start = 0;
        }

        const values: BiIndex[] = [];
        for (let i = start; i <= end; ++i) {
            values.push([i, i]);
        }

        return new Alignment(values);
    }

    /**
     * Infer the alignment between two sequences with the lowest edit distance.
     *
     * Warning: this operation has time complexity ``O(N*M)``, where `N` and `M` are the lengths of the original and
     * modified sequences, and so should only be used for relatively short sequences.
     *
     * @param original
     *         The original sequence.
     * @param modified
     *         The modified sequence.
     * @param costFn
     *         A function returning the cost of performing an edit.  `costFn(a, b)` returns the cost of replacing `a`
     *         with `b`.  `costFn(a, undefined)` returns the cost of deleting `a`, and `costFn(undefined, b)` returns
     *         the cost of inserting `b`.  By default, all operations have cost 1 except replacing identical elements,
     *         which has cost 0.
     * @returns
     *         The inferred alignment.
     */
    static infer<T, U>(original: Iterable<T>, modified: Iterable<U>, costFn?: CostFn<T, U>): Alignment {
        if (costFn === undefined) {
            costFn = (o, m) => Number(o !== m);
        }

        let oArray = original instanceof Array ? original : Array.from(original);
        let mArray = modified instanceof Array ? modified : Array.from(modified);
        if (oArray.length < mArray.length) {
            let result = this._inferRecursive(mArray, oArray, (m, o) => costFn!(o, m));
            return new Alignment(result).inverse();
        } else {
            let result = this._inferRecursive(oArray, mArray, costFn);
            return new Alignment(result);
        }
    }

    /**
     * Hirschberg's algorithm for computing optimal alignments in linear space.
     *
     * https://en.wikipedia.org/wiki/Hirschberg's_algorithm
     */
    private static _inferRecursive<T, U>(original: T[], modified: U[], costFn: CostFn<T, U>): BiIndex[] {
        if (original.length <= 1 || modified.length <= 1) {
            return this._inferMatrix(original, modified, costFn);
        }

        const oMid = original.length >> 1;
        const oLeft = original.slice(0, oMid);
        const oRight = original.slice(oMid);

        const lCosts = this._inferCosts(oLeft, modified, costFn);

        const oRightRev = oRight.slice();
        oRightRev.reverse();
        const modifiedRev = modified.slice();
        modifiedRev.reverse();
        const rCosts = this._inferCosts(oRightRev, modifiedRev, costFn);
        rCosts.reverse();

        let mMid = -1, best = Infinity;
        for (let i = 0; i < lCosts.length; ++i) {
            const score = lCosts[i] + rCosts[i];
            if (score < best) {
                mMid = i;
                best = score;
            }
        }
        const mLeft = modified.slice(0, mMid);
        const mRight = modified.slice(mMid);

        const left = this._inferRecursive(oLeft, mLeft, costFn);
        const right = this._inferRecursive(oRight, mRight, costFn);
        for (const [o, m] of right) {
            left.push([o + oMid, m + mMid]);
        }
        return left;
    }

    /**
     * The Needleman–Wunsch or Wagner–Fischer algorithm.  Here we use it in a way that only computes the final row of
     * costs, without finding the alignment itself.  Hirschberg's algorithm uses it as a subroutine to find the optimal
     * alignment in less than O(N*M) space.
     *
     * https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm
     * https://en.wikipedia.org/wiki/Wagner%E2%80%93Fischer_algorithm
     */
    private static _inferCosts<T, U>(original: T[], modified: U[], costFn: CostFn<T, U>): number[] {
        let row = [0];
        for (let i = 0; i < modified.length; ++i) {
            const cost = row[i] + costFn(undefined, modified[i]);
            row.push(cost);
        }

        let prev = Array(row.length);
        prev.fill(0);

        for (const o of original) {
            [prev, row] = [row, prev];
            row[0] = prev[0] + costFn(o, undefined);

            for (let i = 0; i < modified.length; ++i) {
                const m = modified[i];
                const subCost = prev[i] + costFn(o, m);
                const delCost = prev[i + 1] + costFn(o, undefined);
                const insCost = row[i] + costFn(undefined, m);
                row[i + 1] = Math.min(subCost, delCost, insCost);
            }
        }

        return row;
    }

    /**
     * The Needleman–Wunsch or Wagner–Fischer algorithm, using the entire matrix to compute the optimal alignment.
     */
    private static _inferMatrix<T, U>(original: T[], modified: U[], costFn: CostFn<T, U>): BiIndex[] {
        const row = [{cost: 0, i: -1, j: -1}];
        for (let j = 0; j < modified.length; ++j) {
            const m = modified[j];
            row.push({cost: row[j].cost + costFn(undefined, m), i: 0, j: j});
        }

        const matrix = [row];

        for (let i = 0; i < original.length; ++i) {
            const o = original[i];
            const prev = matrix[i];
            const row = [{cost: prev[0].cost + costFn(o, undefined), i: i, j: 0}];

            for (let j = 0; j < modified.length; ++j) {
                const m = modified[j];
                let cost = prev[j].cost + costFn(o, m);
                let x = i, y = j;

                const delCost = prev[j + 1].cost + costFn(o, undefined);
                if (delCost < cost) {
                    cost = delCost;
                    x = i;
                    y = j + 1;
                }

                const insCost = row[j].cost + costFn(undefined, m);
                if (insCost < cost) {
                    cost = insCost;
                    x = i + 1;
                    y = j;
                }

                row.push({cost: cost, i: x, j: y});
            }

            matrix.push(row);
        }

        const result: BiIndex[] = [];
        let i = matrix.length - 1;
        let j = matrix[i].length - 1;
        while (i >= 0) {
            result.push([i, j]);
            ({i, j} = matrix[i][j]);
        }
        result.reverse()
        return result;
    }

    /**
     * Extract a slice of this alignment.
     *
     * @param start
     *         The position to start from.
     * @param end
     *         The position to end at.
     * @returns
     *         The requested slice as a new `Alignment`.
     */
    slice(start?: number, end?: number): Alignment {
        return new Alignment(this.values.slice(start, end));
    }

    /**
     * Binary search for computing corresponding bounds.
     *
     * @param which
     *         Which side of the sequence to search (0 for original, 1 for modified).
     * @param start
     *         The start of the span to map.
     * @param end
     *         The end of the span to map.
     * @returns
     *         The indices in `this.values` that contain the given range.
     */
    private _search(which: number, start: number, end: number): Bounds {
        let first = 0, limit = this.length;
        while (first < limit) {
            const mid = first + ((limit - first) >> 2);
            if (this.values[mid][which] <= start) {
                first = mid + 1;
            } else {
                limit = mid;
            }
        }
        if (first === 0) {
            throw new RangeError("Start index too small");
        }
        --first;

        let last = first;
        limit = this.length;
        while (last < limit) {
            const mid = last + ((limit - last) >> 2);
            if (this.values[mid][which] < end) {
                last = mid + 1;
            } else {
                limit = mid;
            }
        }
        if (last === this.length) {
            throw new RangeError("End index too large");
        }

        return [first, last];
    }

    /**
     * Shared implementation of `originalBounds()` and `modifiedBounds()`.
     *
     * @param which
     *         Which side of the sequence to search (0 for original, 1 for modified).
     * @param start
     *         The start of the span to map.
     * @param end
     *         The end of the span to map.
     * @returns
     *         The corresponding span in the other sequence (`1 - which`).
     */
    private _bounds(which: number, start?: number | Bounds, end?: number): Bounds {
        if (start === undefined) {
            return [
                this.values[0][1 - which],
                this.values[this.length - 1][1 - which],
            ];
        } else if (typeof(start) !== "number") {
            end = start[1];
            start = start[0];
        }

        if (end === undefined) {
            end = this.values[this.length - 1][which];
        }

        const [first, last] = this._search(which, start, end);
        return [this.values[first][1 - which], this.values[last][1 - which]];
    }

    originalBounds(): Bounds;
    originalBounds(bounds: Bounds): Bounds;
    originalBounds(start: number, end: number): Bounds;

    /**
     * Maps a subrange of the modified sequence to the original sequence.
     *
     * @param start
     *         The start of the span in the modified sequence.
     * @param end
     *         The end of the span in the modified sequence.
     * @returns
     *         The bounds of the corresponding span in the original sequence.
     */
    originalBounds(start?: number | Bounds, end?: number): Bounds {
        return this._bounds(1, start, end);
    }

    modifiedBounds(): Bounds;
    modifiedBounds(bounds: Bounds): Bounds;
    modifiedBounds(start: number, end: number): Bounds;

    /**
     * Maps a subrange of the original sequence to the modified sequence.
     *
     * @param start
     *         The start of the span in the original sequence.
     * @param end
     *         The end of the span in the original sequence.
     * @returns
     *         The bounds of the corresponding span in the modified sequence.
     */
    modifiedBounds(start?: number | Bounds, end?: number): Bounds {
        return this._bounds(0, start, end);
    }

    /**
     * Shared implementation of `sliceByOriginal()` and `sliceByModified()`.
     *
     * @param which
     *         Which side of the sequence to slice by (0 for original, 1 for modified).
     * @param start
     *         The start of the span to map.
     * @param end
     *         The end of the span to map.
     * @returns
     *         The requested slice of this alignment.
     */
    private _sliceBy(which: number, start: number | Bounds, end?: number): Alignment {
        if (typeof(start) !== "number") {
            end = start[1];
            start = start[0];
        }

        if (end === undefined) {
            end = this.values[this.length - 1][which];
        }

        const [first, last] = this._search(which, start, end);
        const values = this.values.slice(first, last + 1);
        for (const i in values) {
            const v = values[i].slice() as [number, number];
            v[which] = Math.max(start, Math.min(v[which], end));
            values[i] = v;
        }
        return new Alignment(values);
    }

    /**
     * Slice this alignment by a span of the original sequence.
     *
     * @param start
     *         The start of the span in the original sequence.
     * @param end
     *         The end of the span in the original sequence.
     * @returns
     *         The requested slice of this alignment.
     */
    sliceByOriginal(start: number | Bounds, end?: number): Alignment {
        return this._sliceBy(0, start, end);
    }

    /**
     * Slice this alignment by a span of the modified sequence.
     *
     * @param start
     *         The start of the span in the modified sequence.
     * @param end
     *         The end of the span in the modified sequence.
     * @returns
     *         The requested slice of this alignment.
     */
    sliceByModified(start: number | Bounds, end?: number): Alignment {
        return this._sliceBy(1, start, end);
    }

    /**
     * Shift this alignment.
     *
     * @param deltaO
     *         The distance to shift the original sequence.
     * @param deltaM
     *         The distance to shift the modified sequence.
     * @returns
     *         An alignment with all the positions shifted by the given amounts.
     */
    shift(deltaO: number, deltaM: number): Alignment {
        const shifted: BiIndex[] = this.values.map(([o, m]) => [o + deltaO, m + deltaM]);
        return new Alignment(shifted);
    }

    /**
     * Concatenate this alignment together with one or more others.
     */
    concat(...others: Alignment[]): Alignment {
        const values = this.values.slice();
        for (const other of others) {
            values.push(...other.values);
        }
        return new Alignment(values);
    }

    /**
     * @returns
     *         An alignment equivalent to applying `this` first, then `other`.
     */
    compose(other: Alignment): Alignment {
        const [mf, ml] = this.modifiedBounds();
        const [of, ol] = other.originalBounds();
        if (mf !== of || ml !== ol) {
            throw new RangeError("Incompatible alignments");
        }

        const values: BiIndex[] = [];
        let i = 0, iMax = this.length;
        let j = 0, jMax = other.length;

        while (i < iMax) {
            while (this.values[i][1] > other.values[j][0]) {
                ++j;
            }
            while (this.values[i][1] < other.values[j][0] && this.values[i + 1][1] <= other.values[j][0]) {
                ++i;
            }
            values.push([this.values[i][0], other.values[j][1]]);

            while (i + 1 < iMax && this.values[i][0] === this.values[i + 1][0]) {
                ++i;
            }

            let needsUpper = false;
            while (j + 1 < jMax && this.values[i][1] >= other.values[j + 1][0]) {
                needsUpper = true;
                ++j;
            }
            if (needsUpper) {
                values.push([this.values[i][0], other.values[j][1]]);
            }

            ++i;
        }

        return new Alignment(values);
    }

    /**
     * @returns
     *         The inverse of this alignment, from the modified to the original sequence.
     */
    inverse(): Alignment {
        return new Alignment(this.values.map(([o, m]) => [m, o]));
    }

    /**
     * @returns
     *         Whether this alignment is the same as `other`.
     */
    equals(other: Alignment): boolean {
        if (this.length != other.length) {
            return false;
        }

        for (let i = 0; i < this.length; ++i) {
            const [to, tm] = this.values[i];
            const [oo, om] = other.values[i];
            if (to != oo || tm != om) {
                return false;
            }
        }

        return true;
    }
}

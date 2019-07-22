import Alignment, { BiIndex } from "./alignment";
import BiString from "./bistring";

// https://unicode.org/reports/tr44/#GC_Values_Table
const CATEGORIES = [
    "Lu", "Ll", "Lt", "Lm", "Lo",
    "Mn", "Mc", "Me",
    "Nd", "Nl", "No",
    "Pc", "Pd", "Ps", "Pe", "Pi", "Pf", "Po",
    "Sm", "Sc", "Sk", "So",
    "Zs", "Zl", "Zp",
    "Cc", "Cf", "Cs", "Co", "Cn",
];

// TODO: Babel doesn't polyfill this, and the source transformation doesn't catch it
// const CATEGORY_REGEXP = new RegExp(CATEGORIES.map(c => `(\\p{${c}})`).join("|"), "u");
const CATEGORY_REGEXP = /(\p{Lu})|(\p{Ll})|(\p{Lt})|(\p{Lm})|(\p{Lo})|(\p{Mn})|(\p{Mc})|(\p{Me})|(\p{Nd})|(\p{Nl})|(\p{No})|(\p{Pc})|(\p{Pd})|(\p{Ps})|(\p{Pe})|(\p{Pi})|(\p{Pf})|(\p{Po})|(\p{Sm})|(\p{Sc})|(\p{Sk})|(\p{So})|(\p{Zs})|(\p{Zl})|(\p{Zp})|(\p{Cc})|(\p{Cf})|(\p{Cs})|(\p{Co})|(\p{Cn})/u;

function category(cp: string): string {
    const match = cp.match(CATEGORY_REGEXP)!;
    const index = match.indexOf(cp, 1) - 1;
    return CATEGORIES[index];
}

/**
 * A single glyph in a string, augmented with some extra information.
 */
class AugmentedGlyph {
    /** The original form of the glyph. */
    readonly original: string;
    /** The Unicode compatibility normalized form of the glyph. */
    readonly normalized: string;
    /** The uppercase form of the glyph. */
    readonly upper: string;
    /** The root code point of the grapheme cluster. */
    readonly root: string;
    /** The specific Unicode category of the glyph (Lu, Po, Zs, etc.). */
    readonly category: string;
    /** The top-level Unicode category of the glyph (L, P, Z, etc.). */
    readonly topCategory: string;

    constructor(original: string, normalized: string, upper: string) {
        this.original = original;
        this.normalized = normalized;
        this.upper = upper;
        this.root = String.fromCodePoint(upper.codePointAt(0)!);
        this.category = category(this.root);
        this.topCategory = this.category[0];
    }

    static costFn(a?: AugmentedGlyph, b?: AugmentedGlyph) {
        if (!a || !b) {
            // cost(insert) + cost(delete) (4 + 4) should be more than cost(substitute) (6)
            return 4;
        }

        let result = 0;
        result += +(a.original !== b.original);
        result += +(a.normalized !== b.normalized);
        result += +(a.upper !== b.upper);
        result += +(a.root !== b.root);
        result += +(a.category !== b.topCategory);
        result += +(a.topCategory !== b.topCategory);
        return result;
    }
}

/**
 * Not quite as good as UAX #29 grapheme clusters, but we're waiting on Intl.Segmenter.
 */
const GLYPH_REGEXP = /\P{M}\p{M}*|^\p{M}+/gu;

/**
 * A string augmented with some extra information about each glyph.
 */
class AugmentedString {
    /** The original string. */
    readonly original: string;
    /** The augmented glyphs of the string. */
    readonly glyphs: readonly AugmentedGlyph[];
    /** The alignment between the original string and the augmented glyphs. */
    readonly alignment: Alignment;

    constructor(original: string) {
        const normalized = new BiString(original).normalize("NFKD");
        const upper = new BiString(normalized.modified).toUpperCase();

        const glyphs = [];
        const alignment: BiIndex[] = [[0, 0]];
        for (const match of upper.matchAll(GLYPH_REGEXP)) {
            const [o, m] = alignment[alignment.length - 1];

            const upperC = match[0];

            const normBounds = upper.alignment.originalBounds(o, o + upperC.length);
            const normC = upper.original.slice(...normBounds);

            const origBounds = normalized.alignment.originalBounds(normBounds);
            const origC = normalized.original.slice(...origBounds);

            glyphs.push(new AugmentedGlyph(origC, normC, upperC));

            alignment.push([o + normC.length, m + 1]);
        }
        this.original = original;
        this.glyphs = glyphs;
        this.alignment = normalized.alignment.compose(new Alignment(alignment));
    }
}

/**
 * Infer the alignment between two strings with a "smart" heuristic.
 *
 * We use Unicode normalization and case mapping to minimize differences that are due to case, accents, ligatures, etc.
 */
export default function heuristicInfer(original: string, modified: string): BiString {
    const augOrig = new AugmentedString(original);
    const augMod = new AugmentedString(modified);

    let alignment = Alignment.infer(augOrig.glyphs, augMod.glyphs, AugmentedGlyph.costFn);
    alignment = augOrig.alignment.compose(alignment);
    alignment = alignment.compose(augMod.alignment.inverse());

    return new BiString(original, modified, alignment);
}

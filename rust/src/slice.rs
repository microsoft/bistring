//! BiString slices.

use crate::align;
use crate::bound::Bounds;
use crate::owned::BiString;

use std::borrow::ToOwned;
use std::fmt::{self, Debug, Formatter};
use std::ops::{Index, Range, RangeBounds};

// We want a &BiStr slice to refer to three slices at once, really: the original substring, the
// modified substring, and the slice of the alignment.  Rust has fat pointers, but they're not
// *that* fat!  So we cheat and encode the slice positions in the fat pointer itself.  BiStr is
// newtype wrapper over a slice of zero-sized types, so &BiStr is a pointer and a length.  The start
// and end indices of the slice are squeezed into the length, taking up half the bits each:
//
//                           +----------------------------------+
//                           | original: "HELLO WORLD"          |
//     let s: BiString = ... | modified: "hello world"          |
//         ^                 | alignment: [(0, 0), (1, 1), ...] |
//         |                 +----------------------------------+
//         |
//         +----------------------------+       high   low
//                                      |       0001 | 0100
//                                  +------------------------+
//     let slice: &BiStr = &s[1..4] | pointer |    length    |
//                                  +------------------------+
//
// Inspired by bitvec: https://myrrlyn.net/blog/bitvec/addressing-bits

/// The bit width of a single range bound (half a usize).
const WIDTH: u32 = usize::BITS / 2;

/// The largest possible value for a bound, representing an unbounded side of a range.
const MAX: usize = (1usize << WIDTH) - 1;

/// Pack range bounds into a usize.
fn encode(bounds: Bounds) -> usize {
    let start = if let Some(n) = bounds.start {
        assert!(n < MAX);
        n
    } else {
        MAX
    };

    let end = if let Some(n) = bounds.end {
        assert!(n < MAX);
        n
    } else {
        MAX
    };

    (start << WIDTH) | end
}

/// Unpack range bounds from a usize.
fn decode(encoded: usize) -> Bounds {
    Bounds {
        start: match encoded >> WIDTH {
            MAX => None,
            n => Some(n),
        },
        end: match encoded & MAX {
            MAX => None,
            n => Some(n),
        },
    }
}

/// A slice of a [`BiString`].
///
/// Like [`str`], `BiStr` is an unsized type, typically used behind a reference as `&BiStr`.  A
/// bistring slice points to both a modified substring and the corresponding original substring.
///
///     # use bistring::{BiString, BiStr};
///     let s: BiString = BiString::from("HELLO WORLD").to_ascii_lowercase();
///     assert_eq!(s.original(), "HELLO WORLD");
///     assert_eq!(s.modified(), "hello world");
///
///     let slice: &BiStr = &s[1..4];
///     assert_eq!(slice.original(), "ELL");
///     assert_eq!(slice.modified(), "ell");
pub struct BiStr([()]);

impl BiStr {
    /// Create a new bistring slice with the given range.
    pub(crate) fn new(target: &BiString, range: impl RangeBounds<usize>) -> &Self {
        let ptr = target as *const BiString as *const ();
        let len = encode(Bounds::new(range));
        unsafe { &*(std::ptr::slice_from_raw_parts(ptr, len) as *const BiStr) }
    }

    /// Convert this slice reference to a pointer.
    fn as_ptr(&self) -> *const [()] {
        self as *const BiStr as *const [()]
    }

    /// Get the BiString this slice refers to.
    fn target(&self) -> &BiString {
        unsafe { &*(self.as_ptr() as *const BiString) }
    }

    /// Get the bound information from this slice.
    fn bounds(&self) -> Bounds {
        // Could be safe with feature(slice_ptr_len)
        decode(unsafe { &*self.as_ptr() }.len())
    }

    /// Get the bound information from this slice as a Range.
    fn range(&self) -> Range<usize> {
        self.bounds().to_range(self.target().modified().len())
    }

    /// The original substring.
    pub fn original(&self) -> &str {
        let target = self.target();
        let range = target.alignment().to_original_range(self.bounds());
        &target.original()[range]
    }

    /// The modified substring.
    pub fn modified(&self) -> &str {
        &self.target().modified()[self.range()]
    }

    /// The alignment for this slice.
    pub fn alignment(&self) -> align::Slice<'_> {
        self.target()
            .alignment()
            .slice_by_modified(self.bounds())
            .shifted_to_origin()
    }
}

impl Debug for BiStr {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        let original = self.original();
        let modified = self.modified();
        if original == modified {
            write!(f, "⮎{:?}⮌", original)
        } else {
            write!(f, "({:?} ⇋ {:?})", original, modified)
        }
    }
}

impl Eq for BiStr {}

impl PartialEq for BiStr {
    fn eq(&self, rhs: &Self) -> bool {
        self.original() == rhs.original()
            && self.modified() == rhs.modified()
            && self.alignment() == rhs.alignment()
    }
}

impl PartialEq<BiString> for BiStr {
    fn eq(&self, rhs: &BiString) -> bool {
        self == &rhs[..]
    }
}

impl<R: RangeBounds<usize>> Index<R> for BiStr {
    type Output = BiStr;

    fn index(&self, index: R) -> &Self {
        &self.target()[self.bounds().slice(index)]
    }
}

impl ToOwned for BiStr {
    type Owned = BiString;

    fn to_owned(&self) -> BiString {
        BiString::new(self.original(), self.modified(), self.alignment())
    }
}

#[cfg(test)]
mod tests {
    use crate::BiString;

    #[test]
    fn test_concat() {
        let mut bs = BiString::chunk("  ", "");
        bs += "Hello";
        bs += &BiString::chunk("  ", " ");
        bs += "world!";
        bs += &BiString::chunk("  ", "");

        let mut slice = &bs[..];
        slice = &slice[..];
        assert_eq!(slice.original(), "  Hello  world!  ");
        assert_eq!(slice.modified(), "Hello world!");

        slice = &slice[4..7];
        assert_eq!(slice.original(), "o  w");
        assert_eq!(slice.modified(), "o w");
        assert_eq!(slice, &("o" + BiString::chunk("  ", " ") + "w"));

        slice = &slice[1..2];
        assert_eq!(slice.original(), "  ");
        assert_eq!(slice.modified(), " ");
    }
}

//! Sequence alignments.

use crate::bound::Bounds;

use std::fmt::{self, Debug, Formatter};
use std::iter::{FromIterator, IntoIterator};
use std::mem;
use std::ops::{Add, Bound, Range, RangeBounds};

/// An alignment between two related sequences.
///
/// Consider this alignment between two strings:
///
/// ```text
/// |it's| |aligned!|
/// |    \ \        |
/// |it is| |aligned|
/// ```
///
/// An alignment stores all the indices that are known to correspond between the original and
/// modified sequences.  For the above example, it would be
///
///     # use bistring::Alignment;
///     # use std::iter::FromIterator;
///     let a = Alignment::from_iter([
///         (0, 0),
///         (4, 5),
///         (5, 6),
///         (13, 13),
///     ]);
///
/// Alignments can be used to answer questions like, "what's the smallest range of the original
/// sequence that is guaranteed to contain this part of the modified sequence?"  For example, the
/// range `0..5` ("it is") is known to match the range `0..4` ("it's") of the original sequence:
///
///     # use bistring::Alignment;
///     # use std::iter::FromIterator;
///     # let a = Alignment::from_iter([(0, 0), (4, 5), (5, 6), (13, 13)]);
///     assert_eq!(a.to_original_range(0..5), 0..4);
///
/// Results may be imprecise if the alignment is too course to match the exact inputs:
///
///     # use bistring::Alignment;
///     # use std::iter::FromIterator;
///     # let a = Alignment::from_iter([(0, 0), (4, 5), (5, 6), (13, 13)]);
///     assert_eq!(a.to_original_range(0..2), 0..4);
///
/// A more granular alignment like this:
///
/// ```text
/// |i|t|'s| |a|l|i|g|n|e|d|!|
/// | | |  \ \ \ \ \ \ \ \ \ /
/// |i|t| is| |a|l|i|g|n|e|d|
/// ```
///
///     # use bistring::Alignment;
///     # use std::iter::FromIterator;
///     let a = Alignment::from_iter([
///         (0, 0), (1, 1), (2, 2), (4, 5), (5, 6), (6, 7), (7, 8),
///         (8, 9), (9, 10), (10, 11), (11, 12), (12, 13), (13, 13),
///     ]);
///
/// Can be more precise:
///
///     # use bistring::Alignment;
///     # use std::iter::FromIterator;
///     # let a = Alignment::from_iter([
///     #     (0, 0), (1, 1), (2, 2), (4, 5), (5, 6), (6, 7), (7, 8),
///     #     (8, 9), (9, 10), (10, 11), (11, 12), (12, 13), (13, 13),
///     # ]);
///     assert_eq!(a.to_original_range(0..2), 0..2);
#[derive(Clone, Default, Eq, PartialEq)]
pub struct Alignment {
    indices: Vec<(usize, usize)>,
}

impl Alignment {
    /// Create a new empty alignment.
    pub fn new() -> Self {
        Self::default()
    }

    /// Create an identity alignment.
    ///
    /// An identity alignment aligns sequence positions with themselves.  For example,
    ///
    ///     # use bistring::Alignment;
    ///     let alignment = Alignment::identity(0..=8);
    ///     assert_eq!(alignment.to_original_range(3..5), 3..5);
    ///     assert_eq!(alignment.to_modified_range(3..5), 3..5);
    pub fn identity(indices: impl IntoIterator<Item = usize>) -> Self {
        indices.into_iter()
            .map(|i| (i, i))
            .collect()
    }

    /// Infer the alignment between two sequences with the lowest edit distance.
    ///
    ///     # use bistring::Alignment;
    ///     assert_eq!(
    ///         Alignment::infer("color".chars(), "color".chars()),
    ///         Alignment::identity(0..=5),
    ///     );
    ///
    ///     let a = Alignment::infer("color".chars(), "colour".chars());
    ///     // "o" <-> "ou"
    ///     assert_eq!(a.to_original_range(3..5), 3..4);
    ///
    /// # Warning
    ///
    /// This operation has time complexity `O(N*M)`, where `N` and `M` are the lengths of the
    /// original and modified sequences, and so should only be used for relatively short sequences.
    pub fn infer<T, U, O, M>(original: O, modified: M) -> Self
    where
        O: IntoIterator<Item = T>,
        M: IntoIterator<Item = U>,
        T: PartialEq<U>,
    {
        Self::infer_with_costs(original, modified, |e| {
            match e {
                Edit::Replacement(t, u) => (t != u) as i32,
                _ => 1,
            }
        })
    }

    /// Infer the alignment between two sequences with the lowest edit distance.
    ///
    /// This function is similar to [`Self::infer()`], but allows a custom cost function to be
    /// specified.
    ///
    /// # Warning
    ///
    /// This operation has time complexity `O(N*M)`, where `N` and `M` are the lengths of the
    /// original and modified sequences, and so should only be used for relatively short sequences.
    pub fn infer_with_costs<T, U, O, M, F, N>(original: O, modified: M, cost_fn: F) -> Self
    where
        O: IntoIterator<Item = T>,
        M: IntoIterator<Item = U>,
        F: Fn(Edit<&T, &U>) -> N,
        N: Cost,
    {
        let original: Vec<T> = original.into_iter().collect();
        let modified: Vec<U> = modified.into_iter().collect();

        if original.len() < modified.len() {
            // Keep the memory consumption bounded by the smaller of the two sequences
            Self::infer_recursive(&modified, &original, |e| cost_fn(e.inverse()))
                .inverse()
        } else {
            Self::infer_recursive(&original, &modified, &cost_fn)
        }
    }

    /// [Hirschberg's algorithm] for computing optimal alignments in linear space.
    ///
    /// [Hirschberg's algorithm]: https://en.wikipedia.org/wiki/Hirschberg's_algorithm
    fn infer_recursive<T, U, F, N>(original: &[T], modified: &[U], cost_fn: F) -> Self
    where
        F: Copy + Fn(Edit<&T, &U>) -> N,
        N: Cost,
    {
        if original.len() <= 1 || modified.len() <= 1 {
            return Self::infer_matrix(original, modified, cost_fn);
        }

        let omid = original.len() / 2;
        let (oleft, oright) = original.split_at(omid);

        let lcosts = Self::infer_costs(oleft, modified, false, cost_fn);
        let rcosts = Self::infer_costs(oright, modified, true, cost_fn);

        let mut mmid = 0;
        let mut min = lcosts[0] + rcosts[0];
        // min_by_key<N: PartialOrd> would be nice
        for i in 1..lcosts.len() {
            let cost = lcosts[i] + rcosts[i];
            if cost < min {
                mmid = i;
                min = cost;
            }
        }
        let (mleft, mright) = modified.split_at(mmid);

        let mut left = Self::infer_recursive(oleft, mleft, cost_fn);
        let right = Self::infer_recursive(oright, mright, cost_fn);
        left.extend(right.shifted(omid as isize, mmid as isize));
        left
    }

    /// The [Needleman–Wunsch] or [Wagner–Fischer] algorithm, using the entire matrix to compute the
    /// optimal alignment.
    ///
    /// [Needleman–Wunsch]: https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm
    /// [Wagner–Fischer]: https://en.wikipedia.org/wiki/Wagner%E2%80%93Fischer_algorithm
    fn infer_matrix<T, U, F, N>(original: &[T], modified: &[U], cost_fn: F) -> Self
    where
        F: Fn(Edit<&T, &U>) -> N,
        N: Cost,
    {
        let rows = 1 + original.len();
        let cols = 1 + modified.len();

        let mut matrix = Vec::with_capacity(rows * cols);
        matrix.push((N::default(), 0, 0));
        for (j, m) in modified.iter().enumerate() {
            let cost = matrix[j].0 + cost_fn(Edit::Insertion(m));
            matrix.push((cost, 0, j));
        }

        let mut prev = 0;
        for (i, o) in original.iter().enumerate() {
            let next = prev + cols;
            let cost = matrix[prev].0 + cost_fn(Edit::Deletion(o));
            matrix.push((cost, i, 0));

            for (j, m) in modified.iter().enumerate() {
                let mut cost = matrix[prev + j].0 + cost_fn(Edit::Replacement(o, m));
                let (mut x, mut y) = (i, j);

                let del_cost = matrix[prev + j + 1].0 + cost_fn(Edit::Deletion(o));
                if del_cost < cost {
                    cost = del_cost;
                    x = i;
                    y = j + 1;
                }

                let ins_cost = matrix[next + j].0 + cost_fn(Edit::Insertion(m));
                if ins_cost < cost {
                    cost = ins_cost;
                    x = i + 1;
                    y = j;
                }

                matrix.push((cost, x, y));
            }

            prev = next;
        }

        let mut result = Vec::new();
        let mut i = rows - 1;
        let mut j = cols - 1;
        loop {
            result.push((i, j));
            if i == 0 && j == 0 {
                break;
            }
            let prev = matrix[i * cols + j];
            i = prev.1;
            j = prev.2;
        }

        result
            .into_iter()
            .rev()
            .collect()
    }

    /// Index a sequence from the beginning or end.
    fn index<T>(seq: &[T], i: usize, reverse: bool) -> &T {
        if reverse {
            &seq[seq.len() - i - 1]
        } else {
            &seq[i]
        }
    }

    /// The [Needleman–Wunsch] or [Wagner–Fischer] algorithm.  Here we use it in a way that only
    /// computes the final row of costs, without finding the alignment itself.  Hirschberg's
    /// algorithm uses it as a subroutine to find the optimal alignment in less than O(N*M) space.
    ///
    /// [Needleman–Wunsch]: https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm
    /// [Wagner–Fischer]: https://en.wikipedia.org/wiki/Wagner%E2%80%93Fischer_algorithm
    fn infer_costs<T, U, F, N>(original: &[T], modified: &[U], reverse: bool, cost_fn: F) -> Vec<N>
    where
        F: Fn(Edit<&T, &U>) -> N,
        N: Cost,
    {
        let mlen = modified.len();

        let mut row = Vec::with_capacity(mlen + 1);
        row.push(N::default());

        for j in 0..mlen {
            let m = Self::index(modified, j, reverse);
            let cost = row[j] + cost_fn(Edit::Insertion(m));
            row.push(cost);
        }

        let mut prev = vec![N::default(); row.len()];

        for i in 0..original.len() {
            mem::swap(&mut row, &mut prev);

            let o = Self::index(original, i, reverse);
            row[0] = prev[0] + cost_fn(Edit::Deletion(o));

            for j in 0..mlen {
                let m = Self::index(modified, j, reverse);

                let sub_cost = prev[j] + cost_fn(Edit::Replacement(o, m));
                let del_cost = prev[j + 1] + cost_fn(Edit::Deletion(o));
                let ins_cost = row[j] + cost_fn(Edit::Insertion(m));

                let mut min_cost = sub_cost;
                if del_cost < min_cost {
                    min_cost = del_cost;
                }
                if ins_cost < min_cost {
                    min_cost = ins_cost;
                }

                row[j + 1] = min_cost;
            }
        }

        if reverse {
            row.reverse();
        }

        row
    }

    /// Get the number of indices in this alignment.
    ///
    /// Note that this is not the same as the size of either the original or modified sequence.  For
    /// that, see [`original_range()`](#method.original_range) or
    /// [`modified_range()`](#method.modified_range).
    pub fn len(&self) -> usize {
        self.indices.len()
    }

    /// Iterate over the indices in this alignment.
    pub fn iter(&self) -> Iter<'_> {
        (&self).into_iter()
    }

    /// Extract a slice of this alignment.
    pub fn slice(&self, range: impl RangeBounds<usize>) -> Slice<'_> {
        let start = match range.start_bound() {
            Bound::Included(&n) => n,
            Bound::Excluded(&n) => n + 1,
            Bound::Unbounded => 0,
        };
        let end = match range.end_bound() {
            Bound::Included(&n) => n + 1,
            Bound::Excluded(&n) => n,
            Bound::Unbounded => self.len(),
        };

        Slice::new(&self.indices[start..end])
    }

    /// Add a new pair of indices to this alignment.
    ///
    /// The original sequence position `o` will be considered to correspond to the modified sequence
    /// position `m`.
    ///
    /// # Panics
    ///
    /// If either the original or modified sequence position moves backwards.
    pub fn push(&mut self, o: usize, m: usize) {
        if !self.indices.is_empty() {
            let (ol, ml) = self.indices[self.len() - 1];
            assert!(o >= ol);
            assert!(m >= ml);
            if (o, m) == (ol, ml) {
                return;
            }
        }

        self.indices.push((o, m));
    }

    /// Get the bounds of the original sequence as a [`Range`].
    pub fn original_range(&self) -> Range<usize> {
        let (start, _) = self.indices[0];
        let (end, _) = self.indices[self.len() - 1];
        start..end
    }

    /// Get the bounds of the modified sequence as a [`Range`].
    pub fn modified_range(&self) -> Range<usize> {
        let (_, start) = self.indices[0];
        let (_, end) = self.indices[self.len() - 1];
        start..end
    }

    /// Maps a subrange of the modified sequence to the original sequence.
    ///
    /// Any [range-like](RangeBounds) type is accepted, for example:
    ///
    ///     # use bistring::Alignment;
    ///     // (0, 0), (2, 1), (4, 2), ..., (16, 8)
    ///     let a: Alignment = (0..=8)
    ///         .map(|i| (2 * i, i))
    ///         .collect();
    ///
    ///     assert_eq!(a.to_original_range(3.. 5), 6..10);
    ///     assert_eq!(a.to_original_range(3..=5), 6..12);
    ///     assert_eq!(a.to_original_range(3..  ), 6..16);
    ///     assert_eq!(a.to_original_range( ..=5), 0..12);
    pub fn to_original_range(&self, range: impl RangeBounds<usize>) -> Range<usize> {
        self.to_range(range, |(o, m)| (o, m))
    }

    /// Maps a subrange of the original sequence to the modified sequence.
    ///
    /// Any [range-like](RangeBounds) type is accepted, for example:
    ///
    ///     # use bistring::Alignment;
    ///     // (0, 0), (2, 1), (4, 2), ..., (16, 8)
    ///     let a: Alignment = (0..=8)
    ///         .map(|i| (2 * i, i))
    ///         .collect();
    ///
    ///     assert_eq!(a.to_modified_range(6.. 10), 3..5);
    ///     assert_eq!(a.to_modified_range(6..=10), 3..6);
    ///     assert_eq!(a.to_modified_range(6..   ), 3..8);
    ///     assert_eq!(a.to_modified_range( ..=10), 0..6);
    pub fn to_modified_range(&self, range: impl RangeBounds<usize>) -> Range<usize> {
        self.to_range(range, |(o, m)| (m, o))
    }

    /// Shared implementation for to_{original,modified}_range().
    fn to_range<R, F>(&self, range: R, which: F) -> Range<usize>
    where
        R: RangeBounds<usize>,
        F: Fn((usize, usize)) -> (usize, usize),
    {
        let (lb, ub) = self.to_bounds(range, |i| which(i).1);
        let i = which(self.indices[lb]).0;
        let j = which(self.indices[ub]).0;
        i..j
    }

    /// Find the bounds of an interval on one side of this alignment.
    fn to_bounds<R, F>(&self, range: R, which: F) -> (usize, usize)
    where
        R: RangeBounds<usize>,
        F: Copy + Fn((usize, usize)) -> usize,
    {
        let lb = self.lower_bound(range.start_bound(), which);
        let ub = self.upper_bound(range.end_bound(), which);
        (lb, ub)
    }

    /// Find the lower bound of an interval on one side of this alignment.
    fn lower_bound(&self, start: Bound<&usize>, which: impl Fn((usize, usize)) -> usize) -> usize {
        let start = match start {
            Bound::Included(&n) => n,
            Bound::Excluded(&n) => n + 1,
            Bound::Unbounded => return 0,
        };

        let lb = self.indices.partition_point(|&i| which(i) <= start);
        assert!(lb > 0);
        lb - 1
    }

    /// Finds the upper bound of an interval on one side of this alignment.
    fn upper_bound(&self, end: Bound<&usize>, which: impl Fn((usize, usize)) -> usize) -> usize {
        let end = match end {
            Bound::Included(&n) => n + 1,
            Bound::Excluded(&n) => n,
            Bound::Unbounded => return self.len() - 1,
        };

        let ub = self.indices.partition_point(|&i| which(i) < end);
        assert!(ub < self.len());
        ub
    }

    /// Slice this alignment by a range of the original sequence.
    ///
    ///     # use bistring::Alignment;
    ///     let alignment: Alignment = (0..=5)
    ///         .map(|i| (i + 1, i))
    ///         .collect();
    ///     let slice = alignment.slice_by_original(2..4);
    ///     assert!(slice.iter().eq([(2, 1), (3, 2), (4, 3)]));
    pub fn slice_by_original(&self, range: impl RangeBounds<usize>) -> Slice<'_> {
        let bounds = Bounds::new(range);
        let (lb, ub) = self.to_bounds(bounds, |(o, _m)| o);
        Slice::clamped(&self.indices[lb..=ub], bounds, ..)
    }

    /// Slice this alignment by a range of the modified sequence.
    ///
    ///     # use bistring::Alignment;
    ///     let alignment: Alignment = (0..=5)
    ///         .map(|i| (i + 1, i))
    ///         .collect();
    ///     let slice = alignment.slice_by_modified(1..3);
    ///     assert!(slice.iter().eq([(2, 1), (3, 2), (4, 3)]));
    pub fn slice_by_modified(&self, range: impl RangeBounds<usize>) -> Slice<'_> {
        let bounds = Bounds::new(range);
        let (lb, ub) = self.to_bounds(bounds, |(_o, m)| m);
        Slice::clamped(&self.indices[lb..=ub], .., bounds)
    }

    /// Returns a view of this slice with sequence indices shifted.
    pub fn shifted(&self, o: isize, m: isize) -> Slice<'_> {
        self.slice(..).shifted(o, m)
    }

    /// Returns a view of this alignment shifted to start at (0, 0).
    pub fn shifted_to_origin(&self) -> Slice<'_> {
        self.slice(..).shifted_to_origin()
    }

    /// Returns a new alignment equivalent to applying this one first, then the `other`.
    pub fn compose(&self, other: &Alignment) -> Self {
        assert_eq!(self.modified_range(), other.original_range());

        let mut composed = Self::new();

        let mut i = 0;
        let i_max = self.len();

        let mut j = 0;
        let j_max = other.len();

        while i < i_max {
            // Map self.original[i] to its lower bound in other
            while self.indices[i].1 > other.indices[j].0 {
                j += 1;
            }
            while self.indices[i].1 < other.indices[j].0
                && self.indices[i + 1].1 <= other.indices[j].0
            {
                i += 1;
            }
            composed.push(self.indices[i].0, other.indices[j].1);

            // Map self.original[i] to its upper bound in other (if it's different)
            while i + 1 < i_max && self.indices[i].0 == self.indices[i + 1].0 {
                i += 1;
            }

            let mut needs_upper = false;
            while j + 1 < j_max && self.indices[i].1 >= other.indices[j + 1].0 {
                needs_upper = true;
                j += 1;
            }
            if needs_upper {
                composed.push(self.indices[i].0, other.indices[j].1);
            }

            i += 1;
        }

        composed
    }

    /// Returns the inverse of this alignment, swapping the original and modified sequences.
    pub fn inverse(&self) -> Self {
        self.iter()
            .map(|(o, m)| (m, o))
            .collect()
    }
}

impl Debug for Alignment {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "[")?;

        let mut comma = false;
        for (o, m) in self.iter() {
            if comma {
                write!(f, ", ")?;
            }
            write!(f, "{}⇋{}", o, m)?;
            comma = true;
        }

        write!(f, "]")
    }
}

impl<'a> From<Slice<'a>> for Alignment {
    fn from(slice: Slice<'a>) -> Alignment {
        Self::from_iter(slice)
    }
}

impl FromIterator<(usize, usize)> for Alignment {
    fn from_iter<I: IntoIterator<Item = (usize, usize)>>(items: I) -> Self {
        let mut alignment = Self::new();
        for (o, m) in items {
            alignment.push(o, m);
        }
        alignment
    }
}

/// An iterator over the indices in an alignment.
#[derive(Debug)]
pub struct IntoIter(std::vec::IntoIter<(usize, usize)>);

impl Iterator for IntoIter {
    type Item = (usize, usize);

    fn next(&mut self) -> Option<(usize, usize)> {
        self.0.next()
    }
}

impl IntoIterator for Alignment {
    type Item = (usize, usize);
    type IntoIter = IntoIter;

    fn into_iter(self) -> Self::IntoIter {
        IntoIter(self.indices.into_iter())
    }
}

/// An iterator over the indices in an alignment.
#[derive(Debug)]
pub struct Iter<'a>(std::slice::Iter<'a, (usize, usize)>);

impl<'a> Iterator for Iter<'a> {
    type Item = (usize, usize);

    fn next(&mut self) -> Option<(usize, usize)> {
        self.0.next().copied()
    }
}

impl<'a> IntoIterator for &'a Alignment {
    type Item = (usize, usize);
    type IntoIter = Iter<'a>;

    fn into_iter(self) -> Self::IntoIter {
        Iter(self.indices.iter())
    }
}

impl Extend<(usize, usize)> for Alignment {
    fn extend<I: IntoIterator<Item = (usize, usize)>>(&mut self, iter: I) {
        for (o, m) in iter {
            self.push(o, m);
        }
    }
}

/// A slice of a sequence alignment.
#[derive(Clone, Copy, Debug)]
pub struct Slice<'a> {
    slice: &'a [(usize, usize)],
    o_bounds: Bounds,
    m_bounds: Bounds,
    o_shift: isize,
    m_shift: isize,
}

impl<'a> Slice<'a> {
    /// Create a new simple slice.
    fn new(slice: &'a [(usize, usize)]) -> Self {
        Self::clamped(slice, .., ..)
    }

    /// Create a new clamped slice.
    fn clamped(
        slice: &'a [(usize, usize)],
        o_range: impl RangeBounds<usize>,
        m_range: impl RangeBounds<usize>,
    ) -> Self {
        Self {
            slice,
            o_bounds: Bounds::new(o_range),
            m_bounds: Bounds::new(m_range),
            o_shift: 0,
            m_shift: 0,
        }
    }

    /// Get the number of indices in this slice.
    ///
    /// Note that this is not the same as the size of either the original or modified sequence.  For
    /// that, see [`original_range()`](#method.original_range) or
    /// [`modified_range()`](#method.modified_range).
    pub fn len(&self) -> usize {
        self.slice.len()
    }

    /// Iterate over the indices in this slice.
    pub fn iter(&self) -> SliceIter<'_> {
        self.into_iter()
    }

    /// Get the bounds of this slice of the original sequence as a [`Range`].
    pub fn original_range(&self) -> Range<usize> {
        let (mut start, _) = self.slice[0];
        let (mut end, _) = self.slice[self.len() - 1];

        start = self.o_bounds.clamp(start);
        end = self.o_bounds.clamp(end);

        start..end
    }

    /// Get the bounds of this slice of the modified sequence as a [`Range`].
    pub fn modified_range(&self) -> Range<usize> {
        let (_, mut start) = self.slice[0];
        let (_, mut end) = self.slice[self.len() - 1];

        start = self.m_bounds.clamp(start);
        end = self.m_bounds.clamp(end);

        start..end
    }

    /// Returns a view of this slice with sequence indices shifted.
    pub fn shifted(&self, o: isize, m: isize) -> Self {
        Self {
            o_shift: self.o_shift + o,
            m_shift: self.m_shift + m,
            ..*self
        }
    }

    /// Returns a view of this slice shifted to start at (0, 0).
    pub fn shifted_to_origin(&self) -> Self {
        let (mut o, mut m) = self.slice[0];
        o = self.o_bounds.clamp(o);
        m = self.m_bounds.clamp(m);
        self.shifted(-(o as isize), -(m as isize))
    }
}

impl<'a, 'b> PartialEq<Slice<'b>> for Slice<'a> {
    fn eq(&self, rhs: &Slice<'b>) -> bool {
        self.iter().eq(rhs)
    }
}

impl<'a> Eq for Slice<'a> {}

/// An iterator over a Slice.
#[derive(Debug)]
pub struct SliceIter<'a> {
    iter: std::slice::Iter<'a, (usize, usize)>,
    o_bounds: Bounds,
    m_bounds: Bounds,
    o_shift: isize,
    m_shift: isize,
}

impl<'a> Iterator for SliceIter<'a> {
    type Item = (usize, usize);

    fn next(&mut self) -> Option<(usize, usize)> {
        self.iter
            .next()
            .copied()
            .map(|(o, m)| (
                self.o_bounds.clamp(o).wrapping_add(self.o_shift as usize),
                self.m_bounds.clamp(m).wrapping_add(self.m_shift as usize),
            ))
    }
}

impl<'a> IntoIterator for Slice<'a> {
    type Item = (usize, usize);
    type IntoIter = SliceIter<'a>;

    fn into_iter(self) -> Self::IntoIter {
        let Self { slice, o_bounds, m_bounds, o_shift, m_shift } = self;
        SliceIter {
            iter: slice.iter(),
            o_bounds,
            m_bounds,
            o_shift,
            m_shift,
        }
    }
}

impl<'a> IntoIterator for &Slice<'a> {
    type Item = (usize, usize);
    type IntoIter = SliceIter<'a>;

    fn into_iter(self) -> Self::IntoIter {
        (*self).into_iter()
    }
}

/// A type suitable for edit costs when inferring alignments.
pub trait Cost: Add<Output = Self> + Copy + Default + PartialOrd {}

/// Blanket impl for [Cost].
impl<T: Add<Output = Self> + Copy + Default + PartialOrd> Cost for T {}

/// An individual edit, for computing [edit distances].
///
/// [edit distances]: https://en.wikipedia.org/wiki/Levenshtein_distance
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Edit<T, U> {
    /// A replacement of one item with another.
    Replacement(T, U),
    /// The deletion of an item.
    Deletion(T),
    /// The insertion of an item.
    Insertion(U),
}

impl<T, U> Edit<T, U> {
    /// Returns the edit that inverts this one.
    pub fn inverse(self) -> Edit<U, T> {
        match self {
            Edit::Replacement(t, u) => Edit::Replacement(u, t),
            Edit::Deletion(t) => Edit::Insertion(t),
            Edit::Insertion(u) => Edit::Deletion(u),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty() {
        let alignment = Alignment::identity([0]);

        assert!(alignment.iter().eq([(0, 0)]));

        assert_eq!(alignment.original_range(), 0..0);
        assert_eq!(alignment.modified_range(), 0..0);

        assert_eq!(alignment.to_original_range(0..0), 0..0);
        assert_eq!(alignment.to_modified_range(0..0), 0..0);
    }

    #[test]
    fn test_identity() {
        let alignment = Alignment::identity(1..=5);

        assert_eq!(
            alignment,
            Alignment::from_iter([
                (1, 1),
                (2, 2),
                (3, 3),
                (4, 4),
                (5, 5),
            ]),
        );

        assert_eq!(alignment.original_range(), 1..5);
        assert_eq!(alignment.modified_range(), 1..5);

        assert_eq!(alignment.to_original_range(2..4), 2..4);
        assert_eq!(alignment.to_modified_range(2..4), 2..4);
    }

    #[test]
    fn test_aligning() {
        let alignment = Alignment::from_iter([(0, 0), (1, 2), (2, 4), (3, 6)]);

        assert_eq!(alignment.original_range(), 0..3);
        assert_eq!(alignment.modified_range(), 0..6);

        assert_eq!(alignment.to_original_range(0..0), 0..0);
        assert_eq!(alignment.to_original_range(0..1), 0..1);
        assert_eq!(alignment.to_original_range(0..2), 0..1);
        assert_eq!(alignment.to_original_range(0..3), 0..2);
        assert_eq!(alignment.to_original_range(1..1), 0..1);
        assert_eq!(alignment.to_original_range(1..3), 0..2);
        assert_eq!(alignment.to_original_range(1..4), 0..2);
        assert_eq!(alignment.to_original_range(2..2), 1..1);
        assert_eq!(alignment.to_original_range(2..4), 1..2);
        assert_eq!(alignment.to_original_range(2..5), 1..3);
        assert_eq!(alignment.to_original_range(3..3), 1..2);

        assert_eq!(alignment.to_modified_range(0..0), 0..0);
        assert_eq!(alignment.to_modified_range(0..1), 0..2);
        assert_eq!(alignment.to_modified_range(0..2), 0..4);
        assert_eq!(alignment.to_modified_range(0..3), 0..6);
        assert_eq!(alignment.to_modified_range(1..1), 2..2);
        assert_eq!(alignment.to_modified_range(2..2), 4..4);
    }

    #[test]
    fn test_slice() {
        let alignment = Alignment::from_iter([(0, 0), (1, 2), (2, 4), (3, 6), (4, 8)]);

        let slice = alignment.slice(1..4);
        assert!(slice.into_iter().eq([(1, 2), (2, 4), (3, 6)]));
    }

    #[test]
    fn test_canonicalization() {
        assert_eq!(
            Alignment::from_iter([
                (0, 0),
                (1, 2),
                (1, 2),
                (2, 4),
            ]),
            Alignment::from_iter([
                (0, 0),
                (1, 2),
                (2, 4),
            ]),
        );
    }

    fn test_composition(first: &Alignment, second: &Alignment) {
        let composed = first.compose(second);

        let ob = composed.original_range();
        let mb = composed.modified_range();

        assert_eq!(ob, first.original_range());
        assert_eq!(mb, second.modified_range());

        let (of, ol) = (ob.start, ob.end);
        let (mf, ml) = (mb.start, mb.end);

        for i in of..=ol {
            for j in i..=ol {
                assert_eq!(
                    composed.to_modified_range(i..j),
                    second.to_modified_range(first.to_modified_range(i..j)),
                );
            }
        }

        for i in mf..=ml {
            for j in i..=ml {
                assert_eq!(
                    composed.to_original_range(i..j),
                    first.to_original_range(second.to_original_range(i..j)),
                );
            }
        }
    }

    #[test]
    fn test_compose() {
        let first: Alignment = (0..=3)
            .map(|i| (i, 2 * i))
            .collect();
        let second = (0..=6)
            .map(|i| (i, 2 * i))
            .collect();
        test_composition(&first, &second)
    }

    fn test_identity_composition(alignment: &Alignment) {
        let or = alignment.original_range();
        let oident = Alignment::identity(or.start..=or.end);
        test_composition(&oident, alignment);

        let mr = alignment.modified_range();
        let mident = Alignment::identity(mr.start..=mr.end);
        test_composition(alignment, &mident);
    }

    #[test]
    fn test_compose_identity() {
        let alignment = Alignment::from_iter([
            (0, 2),
            (2, 2),
            (4, 4),
            (6, 6),
            (8, 6),
        ]);

        // Modified sequence is smaller
        test_identity_composition(&alignment);

        // Original sequence is smaller
        test_identity_composition(&alignment.inverse());
    }

    #[test]
    fn test_infer() {
        assert_eq!(Alignment::infer("test".chars(), "test".chars()), Alignment::identity(0..=4));
        assert_eq!(Alignment::infer("asdf".chars(), "jkl;".chars()), Alignment::identity(0..=4));

        assert_eq!(
            Alignment::infer("color".chars(), "colour".chars()),
            Alignment::from_iter([
                (0, 0),
                (1, 1),
                (2, 2),
                (3, 3),
                (4, 4),
                (4, 5),
                (5, 6),
            ]),
        );

        assert_eq!(
            Alignment::infer("color".chars(), "colour".chars()),
            Alignment::infer("colour".chars(), "color".chars()).inverse(),
        );

        assert_eq!(
            Alignment::infer("ab---".chars(), "ab".chars()),
            Alignment::from_iter([
                (0, 0),
                (1, 1),
                (2, 2),
                (3, 2),
                (4, 2),
                (5, 2),
            ]),
        );
    }
}

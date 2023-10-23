//! Our unified range type.

use std::ops::{Bound, Range, RangeBounds};

/// A unified range type.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Bounds {
    pub start: Option<usize>,
    pub end: Option<usize>,
}

impl Bounds {
    /// Create a new Bounds from an existing range.
    pub fn new(range: impl RangeBounds<usize>) -> Self {
        Self {
            start: match range.start_bound() {
                Bound::Included(&n) => Some(n),
                Bound::Excluded(&n) => Some(n + 1),
                Bound::Unbounded => None,
            },
            end: match range.end_bound() {
                Bound::Included(&n) => Some(n + 1),
                Bound::Excluded(&n) => Some(n),
                Bound::Unbounded => None,
            },
        }
    }

    /// Convert these bounds to a concrete Range.
    pub fn to_range(&self, len: usize) -> Range<usize> {
        let start = self.start.unwrap_or(0);
        let end = self.end.unwrap_or(len);
        start..end
    }

    /// Index these bounds by another range.
    pub fn slice(&self, range: impl RangeBounds<usize>) -> Self {
        let offset = self.start.unwrap_or(0);

        let start = match range.start_bound() {
            Bound::Included(&n) => Bound::Included(offset + n),
            Bound::Excluded(&n) => Bound::Excluded(offset + n),
            Bound::Unbounded => copy(self.start_bound()),
        };

        let end = match range.end_bound() {
            Bound::Included(&n) => Bound::Included(offset + n),
            Bound::Excluded(&n) => Bound::Excluded(offset + n),
            Bound::Unbounded => copy(self.end_bound()),
        };

        Self::new((start, end))
    }

    /// Clamp a value to within this range.
    pub fn clamp(&self, mut n: usize) -> usize {
        if let Some(start) = self.start {
            n = n.max(start);
        }
        if let Some(end) = self.end {
            n = n.min(end);
        }
        n
    }
}

/// Waiting for feature(bound_cloned)
fn copy(bound: Bound<&usize>) -> Bound<usize> {
    match bound {
        Bound::Included(&n) => Bound::Included(n),
        Bound::Excluded(&n) => Bound::Excluded(n),
        Bound::Unbounded => Bound::Unbounded,
    }
}

impl RangeBounds<usize> for Bounds {
    fn start_bound(&self) -> Bound<&usize> {
        self.start.as_ref().map_or(Bound::Unbounded, |n| Bound::Included(n))
    }

    fn end_bound(&self) -> Bound<&usize> {
        self.end.as_ref().map_or(Bound::Unbounded, |n| Bound::Excluded(n))
    }
}

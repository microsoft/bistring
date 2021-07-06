//! Our unified range type.

use std::ops::{Bound, RangeBounds};

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

impl RangeBounds<usize> for Bounds {
    fn start_bound(&self) -> Bound<&usize> {
        self.start.as_ref().map_or(Bound::Unbounded, |n| Bound::Included(n))
    }

    fn end_bound(&self) -> Bound<&usize> {
        self.end.as_ref().map_or(Bound::Unbounded, |n| Bound::Excluded(n))
    }
}

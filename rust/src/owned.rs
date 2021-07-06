use crate::align::Alignment;

use std::fmt::{self, Debug, Formatter};
use std::iter::{self, FromIterator};
use std::ops::{Add, AddAssign};

/// A bidirectionally transformed string.
#[derive(Clone, Eq, PartialEq)]
pub struct BiString {
    original: String,
    modified: String,
    alignment: Alignment,
}

impl BiString {
    /// Create a new BiString with an explicit alignment.
    pub fn new(
        original: impl Into<String>,
        modified: impl Into<String>,
        alignment: impl Into<Alignment>,
    ) -> Self {
        Self::new_impl(original.into(), modified.into(), alignment.into())
    }

    /// Outlined non-generic part of new()
    fn new_impl(original: String, modified: String, alignment: Alignment) -> Self {
        assert_eq!(alignment.original_range(), 0..original.len());
        assert_eq!(alignment.modified_range(), 0..modified.len());

        Self {
            original,
            modified,
            alignment,
        }
    }

    /// Create a new BiString with a course alignment.
    pub fn chunk(original: impl Into<String>, modified: impl Into<String>) -> Self {
        let original = original.into();
        let modified = modified.into();
        let alignment = Alignment::from_iter([(0, 0), (original.len(), modified.len())]);
        Self::new(original, modified, alignment)
    }

    /// Create a new BiString with identical original and modified strings.
    pub fn from_string(string: impl Into<String>) -> Self {
        Self::from_string_impl(string.into())
    }

    /// Outlined non-generic part of from_string()
    fn from_string_impl(original: String) -> Self {
        let modified = original.clone();
        let alignment = Alignment::identity(
            original
                .char_indices()
                .map(|(i, _c)| i)
                .chain(iter::once(original.len())),
        );
        Self::new(original, modified, alignment)
    }

    /// The original string, before any modifications.
    pub fn original(&self) -> &str {
        &self.original
    }

    /// The current value of the string, after all modifications.
    pub fn modified(&self) -> &str {
        &self.modified
    }

    /// The sequence alignment between the original and modified strings.
    pub fn alignment(&self) -> &Alignment {
        &self.alignment
    }

    /// Append a string to this BiString.
    pub fn push_str(&mut self, string: &str) {
        let ol = self.original.len();
        let ml = self.modified.len();
        for i in 1..=string.len() {
            self.alignment.push(ol + i, ml + i);
        }

        self.original.push_str(string);
        self.modified.push_str(string);
    }

    /// Append another BiString to this BiString.
    pub fn push_bistr(&mut self, bistring: &BiString) {
        let ol = self.original.len();
        let ml = self.modified.len();
        for (o, m) in bistring.alignment.iter() {
            self.alignment.push(ol + o, ml + m);
        }

        self.original += &bistring.original;
        self.modified += &bistring.modified;
    }

    /// Make a copy of this bistring with its ASCII characters lowercased.
    pub fn to_ascii_lowercase(&self) -> Self {
        Self::new(&self.original, self.modified.to_ascii_lowercase(), self.alignment.clone())
    }

    /// Make a copy of this bistring with its ASCII characters uppercased.
    pub fn to_ascii_uppercase(&self) -> Self {
        Self::new(&self.original, self.modified.to_ascii_uppercase(), self.alignment.clone())
    }
}

impl Add<&str> for BiString {
    type Output = Self;

    fn add(mut self, rhs: &str) -> Self {
        self.push_str(rhs);
        self
    }
}

impl Add<&BiString> for BiString {
    type Output = Self;

    fn add(mut self, rhs: &BiString) -> Self {
        self.push_bistr(rhs);
        self
    }
}

impl Add<BiString> for &str {
    type Output = BiString;

    fn add(self, rhs: BiString) -> BiString {
        // XXX: Re-use allocation?
        let mut bs = BiString::from(self);
        bs.push_bistr(&rhs);
        bs
    }
}

impl AddAssign<&str> for BiString {
    fn add_assign(&mut self, rhs: &str) {
        self.push_str(rhs);
    }
}

impl AddAssign<&BiString> for BiString {
    fn add_assign(&mut self, rhs: &Self) {
        self.push_bistr(rhs);
    }
}

impl Debug for BiString {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        if self.original == self.modified {
            write!(f, "⮎{:?}⮌", self.original)
        } else {
            write!(f, "({:?} ⇋ {:?})", self.original, self.modified)
        }
    }
}

impl From<&str> for BiString {
    fn from(string: &str) -> Self {
        Self::from_string(string)
    }
}

impl From<String> for BiString {
    fn from(string: String) -> Self {
        Self::from_string(string)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_concat() {
        let mut bs = BiString::chunk("  ", "");
        bs += "Hello";
        bs += &BiString::chunk("  ", " ");
        bs += "world!";
        bs += &BiString::chunk("  ", "");

        assert_eq!(bs.original(), "  Hello  world!  ");
        assert_eq!(bs.modified(), "Hello world!");
    }
}

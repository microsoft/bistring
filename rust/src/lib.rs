//! Bidirectionally transformed strings.

#![warn(rust_2018_idioms)]

mod bound;
mod owned;
mod slice;

pub mod align;

pub use align::Alignment;
pub use owned::BiString;
pub use slice::BiStr;

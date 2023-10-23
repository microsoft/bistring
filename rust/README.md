bistring
========

[![crates.io version](https://img.shields.io/crates/v/bistring)](https://crates.io/crates/bistring)

The bistring library provides non-destructive versions of common string processing operations like normalization, case folding, and find/replace.
Each bistring remembers the original string, and how its substrings map to substrings of the modified version.

For example:

```rust
use bistring::BiString;

let mut s = BiString::from("𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 🦊 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 🐶");
s = s.nfkd();                    // Unicode normalization
s = s.casefold();                // Case-insensitivity
s = s.replace("🦊", "fox");      // Replace emoji with text
s = s.replace("🐶", "dog");
s = s.replace(/[^\w\s]+/g, "");  // Strip everything but letters and spaces
let slice = &s[..19];            // Extract a substring
// The modified substring, after changes
assert_eq!(slice.modified(), "the quick brown fox");
// The original substring, before changes
assert_eq!(slice.original(), "𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 🦊");
```

This allows you to perform very aggressive text processing completely invisibly.

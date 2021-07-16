bistring
========

[![npm version](https://badge.fury.io/js/bistring.svg)](https://www.npmjs.com/package/bistring)

The bistring library provides non-destructive versions of common string processing operations like normalization, case folding, and find/replace.
Each bistring remembers the original string, and how its substrings map to substrings of the modified version.

For example:

```js
import BiString from "bistring";

let s = new BiString("𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 🦊 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 🐶");
s = s.normalize("NFKD");         // Unicode normalization
s = s.toLowerCase();             // Case-insensitivity
s = s.replace("🦊", "fox");      // Replace emoji with text
s = s.replace("🐶", "dog");
s = s.replace(/[^\w\s]+/g, "");  // Strip everything but letters and spaces
s = s.substring(0, 19);          // Extract a substring
console.log(s.modified);         // The modified substring, after changes
// the quick brown fox
console.log(s.original);         // The original substring, before changes
// 𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 🦊
```

This allows you to perform very aggressive text processing completely invisibly.


Demo
----

[Click here](https://microsoft.github.io/bistring/demo.html) for a live demo of the bistring library in your browser.

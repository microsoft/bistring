bistring
========

The bistring library provides non-destructive versions of common string processing operations like normalization, case folding, and find/replace.
Each bistring remembers the original string, and how its substrings map to substrings of the modified version.

For example:

```python
>>> from bistring import bistr
>>> s = bistr('𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 𝖉𝖔𝖌')
>>> s = s.normalize('NFKD')     # Unicode normalization
>>> s = s.casefold()            # Case-insensitivity
>>> s = s.sub(r'[^a-z ]+', '')  # Strip everything but letters and spaces
>>> s = s[:19]                  # Extract a substring
>>> s.modified                  # The modified substring, after changes
'the quick brown fox'
>>> s.original                  # The original substring, before changes
'𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 𝖋𝖔𝖝'
```

This allows you to perform very aggressive text processing completely invisibly.


Contributing
------------

This project welcomes contributions and suggestions.
Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution.
For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide a CLA and decorate the PR appropriately (e.g., label, comment).
Simply follow the instructions provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

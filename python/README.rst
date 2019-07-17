bistring
========

The bistring library provides non-destructive versions of common string processing operations like normalization, case folding, and find/replace.
Each bistring remembers the original string, and how its substrings map to substrings of the modified version.

For example:

.. code-block:: python

    >>> from bistring import bistr
    >>> s = bistr('𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 🦊 𝖏𝖚𝖒𝖕𝖘 𝖔𝖛𝖊𝖗 𝖙𝖍𝖊 𝖑𝖆𝖟𝖞 🐶')
    >>> s = s.normalize('NFKD')     # Unicode normalization
    >>> s = s.casefold()            # Case-insensitivity
    >>> s = s.replace('🦊', 'fox')  # Replace emoji with text
    >>> s = s.replace('🐶', 'dog')
    >>> s = s.sub(r'[^\w\s]+', '')  # Strip everything but letters and spaces
    >>> s = s[:19]                  # Extract a substring
    >>> s.modified                  # The modified substring, after changes
    'the quick brown fox'
    >>> s.original                  # The original substring, before changes
    '𝕿𝖍𝖊 𝖖𝖚𝖎𝖈𝖐, 𝖇𝖗𝖔𝖜𝖓 🦊'

This allows you to perform very aggressive text processing completely invisibly.

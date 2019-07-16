Frequently Asked Questions
==========================

.. testsetup:: *

    from bistring import bistr


How do I convert indices back and forth between the original and modified strings?
----------------------------------------------------------------------------------

Use :attr:`bistring.bistr.alignment`:

    >>> s = bistr('The quick, brown 🦊')
    >>> s = s.replace(',', '')
    >>> s = s.replace('🦊', 'fox')
    >>> s[16:19]
    bistr('🦊', 'fox')
    >>> s.alignment.original_bounds(16, 19)
    (17, 18)
    >>> s.alignment.modified_bounds(11, 16)
    (10, 15)
    >>> s[10:15]
    bistr('brown')

See :class:`bistring.Alignment` for more details.


How do I perform case-insensitive operations?
---------------------------------------------

Use :meth:`bistring.bistr.casefold`.
Do not use :meth:`~bistring.bistr.lower`, :meth:`~bistring.bistr.upper`, or any other method, as you will get wrong results for many non-English languages.

To check case-insensitive equality, you don't even need `bistring`:

    >>> 'HELLO WORLD!'.casefold() == 'HeLlO wOrLd!'.casefold()
    True

To search for a substring case-insensitively:

    >>> s = bistr('Bundesstraße').casefold()
    >>> s.find_bounds('STRASSE'.casefold())
    (6, 13)
    >>> s[6:13]
    bistr('straße', 'strasse', ...)


Forget case insensitivity, how do I make sure that identical looking strings compare equal?
-------------------------------------------------------------------------------------------

This is a hard problem with Unicode strings.
To start with, you should at least perform some kind of `Unicode normalization <https://unicode.org/reports/tr15/>`_.
That ensures that different ways of writing the semantically identical thing (e.g. with precomposed accented characters vs. combining accents) become actually identical:

    >>> a = bistr('\u00EAtre')  # 'être' with a single character for the ê
    >>> b = bistr('e\u0302tre') # 'être' with an 'e' and a combining '^'
    >>> a.normalize('NFC').modified == b.normalize('NFC').modified
    True
    >>> a.normalize('NFD').modified == b.normalize('NFD').modified
    True

Normalization form NFC tries to keep precomposed characters together whenever possible, while NFD always decomposes them.
In general, NFC is more convenient for people to work with, but NFD can be useful for things like removing accents and other combining marks from text.


What about similar-looking strings, that aren't necessarily identical?
----------------------------------------------------------------------

Unicode contains things like ligatures, alternative scripts, and other oddities than can result in similar-looking strings that are represented very differently.
Here is where the "compatibility" normalization forms, NFKC and NFKD, can help:

    >>> s = bistr('𝕳𝖊𝖑𝖑𝖔 𝖜𝖔𝖗𝖑𝖉')
    >>> s = s.normalize('NFKC')
    >>> s
    bistr('𝕳𝖊𝖑𝖑𝖔 𝖜𝖔𝖗𝖑𝖉', 'Hello world', Alignment.identity(11))
    >>> s[6:]
    bistr('𝖜𝖔𝖗𝖑𝖉', 'world', Alignment.identity(5))


How do I ensure I get the same results on every machine?
--------------------------------------------------------

Always pass an explicit locale to any `bistr` method that takes one.
Many of Python's string APIs implicitly use the system's default locale, which may be quite different than the one you developed with.
While this may be the right behaviour if you're displaying strings to the current user, it's rarely the right behaviour if you're dealing with text that originated or will be displayed elsewhere, e.g. for cloud software.
`bistr` always accepts a locale parameter in these APIs, to ensure reproducible and sensible results:

    >>> s = bistr('i').upper()     # s will be 'I' in most locales, but 'İ' in Turkish locales!
    >>> bistr('i').upper('en_US')  # An English locale guarantees a dotless capital I
    bistr('i', 'I')
    >>> bistr('i').upper('tr_TR')  # A Turkish locale gives a dotted capital İ
    bistr('i', 'İ')


Tokenization
------------

How do I tokenize text in a reversible way?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

`bistring` provides some convenient tokenization APIs that track string indices.
To use Unicode word boundary rules, for example:

    >>> from bistring import WordTokenizer
    >>> tokenizer = WordTokenizer('en_US')
    >>> tokens = tokenizer.tokenize('The quick, brown fox jumps over the lazy dog')
    >>> tokens[1]
    Token(bistr('quick'), start=4, end=9)


How do I find the whole substring of text for some tokens?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

:meth:`bistring.Tokenization.substring` gives the substring itself.
:meth:`bistring.Tokenization.text_bounds` gives the bounds of that substring.

    >>> tokens.substring(1, 3)
    bistr('quick, brown')
    >>> tokens.text_bounds(1, 3)
    (4, 16)


How do I find the tokens for a substring of text?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

:meth:`bistring.Tokenization.bounds_for_text`

    >>> tokens.bounds_for_text(4, 16)
    (1, 3)
    >>> tokens.substring(1, 3)
    bistr('quick, brown')


How to I snap a substring of text to the nearest token boundaries?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

:meth:`bistring.Tokenization.snap_text_bounds`

    >>> tokens.text[6:14]
    bistr('ick, bro')
    >>> tokens.snap_text_bounds(6, 14)
    (4, 16)
    >>> tokens.text[4:16]
    bistr('quick, brown')

Frequently Asked Questions
==========================


What is a bistring, anyway?
---------------------------

Simply put, a `bistring` is a pair of strings, an original string and a modified one, along with information about how they align with each other.
The :class:`bistring.bistr` class has an API very similar to the built-in :class:`str`, but all its operations keep track of the original string and the alignment for you.

    >>> from bistring import bistr
    >>> s = bistr('HELLO WORLD')
    >>> print(s)
    ⮎'HELLO WORLD'⮌
    >>> s = s.lower()
    >>> print(s)
    ('HELLO WORLD' ⇋ 'hello world')
    >>> print(s[6:])
    ('WORLD' ⇋ 'world')


Why am I getting more text than I expect when slicing?
------------------------------------------------------

When a bistring doesn't have precise enough alignment information to slice exactly, it will give you back the smallest string it knows for certain contains a match for the region you requested.
In the worst case, that may be the entire string!
This happens, for example, when you use the two-argument `bistr` constructor, which makes no effort to infer a granular alignment between the strings:

    >>> s = bistr('color', 'colour')
    >>> print(s[3:5])
    ('color' ⇋ 'ou')

Instead, you should start from your original string as a `bistr`, and then transform it how you want:

    >>> s = bistr('color')
    >>> s = s.sub(r'(?<=col)o(?=r)', 'ou')
    >>> print(s)
    ('color' ⇋ 'colour')
    >>> print(s[3:5])
    ('o' ⇋ 'ou')

Alternatively, you can piece many smaller bistrings together to achieve the alignment you want manually:

    >>> s = bistr('col') + bistr('o', 'ou') + bistr('r')
    >>> print(s)
    ('color' ⇋ 'colour')
    >>> print(s[3:5])
    ('o' ⇋ 'ou')


What if I don't know the alignment?
-----------------------------------

If at all possible, you should use `bistring` all the way through your text processing code, which will ensure an accurate alignment is tracked for you.
If you don't control that code, or there are other reasons it won't work with `bistring`, you can still have us guess an alignment for you in simple cases with :meth:`bistring.bistr.infer`.

    >>> s = bistr.infer('color', 'colour')
    >>> print(s[0:3])
    ⮎'col'⮌
    >>> print(s[3:5])
    ('o' ⇋ 'ou')
    >>> print(s[5:6])
    ⮎'r'⮌

`infer()` is an expensive operation (``O(N*M)`` in the length of the strings), so if you absolutely need it, try to use it only for short strings.


How do I get the actual indices, rather than just substrings?
-------------------------------------------------------------

Use :attr:`bistring.bistr.alignment`:

    >>> s = bistr('The quick, brown 🦊')
    >>> s = s.replace(',', '')
    >>> s = s.replace('🦊', 'fox')
    >>> print(s[16:19])
    ('🦊' ⇋ 'fox')
    >>> s.alignment.original_bounds(16, 19)
    (17, 18)
    >>> s.alignment.modified_bounds(11, 16)
    (10, 15)
    >>> print(s[10:15])
    ⮎'brown'⮌

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
    >>> print(s[6:13])
    ('straße' ⇋ 'strasse')


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
    >>> print(s)
    ('𝕳𝖊𝖑𝖑𝖔 𝖜𝖔𝖗𝖑𝖉' ⇋ 'Hello world')
    >>> print(s[6:])
    ('𝖜𝖔𝖗𝖑𝖉' ⇋ 'world')


How do I ensure I get the same results on every machine?
--------------------------------------------------------

Always pass an explicit locale to any `bistr` method that takes one.
Many of Python's string APIs implicitly use the system's default locale, which may be quite different than the one you developed with.
While this may be the right behaviour if you're displaying strings to the current user, it's rarely the right behaviour if you're dealing with text that originated or will be displayed elsewhere, e.g. for cloud software.
`bistr` always accepts a locale parameter in these APIs, to ensure reproducible and sensible results:

    >>> # s will be 'I' in most locales, but 'İ' in Turkish locales!
    >>> s = bistr('i').upper()
    >>> # An English locale guarantees a dotless capital I
    >>> print(bistr('i').upper('en_US'))
    ('i' ⇋ 'I')
    >>> # A Turkish locale gives a dotted capital İ
    >>> print(bistr('i').upper('tr_TR'))
    ('i' ⇋ 'İ')


Tokenization
------------

How do I tokenize text in a reversible way?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

`bistring` provides some convenient tokenization APIs that track string indices.
To use Unicode word boundary rules, for example:

    >>> from bistring import WordTokenizer
    >>> tokenizer = WordTokenizer('en_US')
    >>> tokens = tokenizer.tokenize('The quick, brown fox jumps over the lazy dog')
    >>> print(tokens[1])
    [4:9]=⮎'quick'⮌


How do I find the whole substring of text for some tokens?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

:meth:`bistring.Tokenization.substring` gives the substring itself.
:meth:`bistring.Tokenization.text_bounds` gives the bounds of that substring.

    >>> print(tokens.substring(1, 3))
    ⮎'quick, brown'⮌
    >>> tokens.text_bounds(1, 3)
    (4, 16)


How do I find the tokens for a substring of text?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

:meth:`bistring.Tokenization.bounds_for_text`

    >>> tokens.bounds_for_text(4, 16)
    (1, 3)
    >>> print(tokens.substring(1, 3))
    ⮎'quick, brown'⮌


How to I snap a substring of text to the nearest token boundaries?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

:meth:`bistring.Tokenization.snap_text_bounds`

    >>> print(tokens.text[6:14])
    ⮎'ick, bro'⮌
    >>> tokens.snap_text_bounds(6, 14)
    (4, 16)
    >>> print(tokens.text[4:16])
    ⮎'quick, brown'⮌


What if I don't know the token positions?
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If at all possible, you should use a :class:`bistring.Tokenizer` or some other method that tokenizes with position information.
If you can't, you can use :meth:`bistring.Tokenization.infer` to guess the alignment for you:

    >>> from bistring import Tokenization
    >>> tokens = Tokenization.infer('hello, world!', ['hello', 'world'])
    >>> print(tokens[0])
    [0:5]=⮎'hello'⮌
    >>> print(tokens[1])
    [7:12]=⮎'world'⮌

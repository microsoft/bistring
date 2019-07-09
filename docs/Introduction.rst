Introduction
============

Many operations commonly performed on text strings are destructive; that is, they lose some information about the original string.
Systems that deal with text will commonly perform many of these operations on their input, whether it's changing case, performing unicode normalization, collapsing whitespace, stripping punctuation, etc.
This helps systems behave in a more uniform manner regarding the many different ways you or I might express the same thing.
But the consequence is that when handling parts of this processed text, it may be hard to know what exactly the user originally wrote.
Sometimes those details can be very important to the user.

Consider an AI personal assistant, for example, that is helping a user send a text message to a friend.
The user writes,

    send jane a text that says, "Hey! How are you? Haven't seen you in a while, what's up 😀"

The system may perform some normalization on that text, such that it ends up looking like this, with casing and punctuation gone:

    send jane a text that says hey how are you havent seen you in a while whats up emoji

The AI may then identify that the body of the message should be:

    hey how are you havent seen you in a while whats up emoji

However, that message wouldn't make much sense as-is.
If the assistant uses `bistring` though, it's easy for it to match that with the original text the user intended:

    >>> from bistring import bistr
    >>> query = bistr(
    ... 'send jane a text that says, '
    ... '"Hey! How are you? Haven\'t seen you in a while, what\'s up 😀"'
    ... )

    >>> # Get rid of upper-/lower-case distinctions
    >>> query = query.casefold()
    >>> print(query.modified)
    send jane a text that says, "hey! how are you? haven't seen you in a while, what's up 😀"

    >>> import regex
    >>> # Remove all punctuation
    >>> query = query.sub(regex.compile(r'\pP'), '')
    >>> # Replace all symbols with 'emoji'
    >>> query = query.sub(regex.compile(r'\pS'), 'emoji')
    >>> print(query.modified)
    send jane a text that says hey how are you havent seen you in a while whats up emoji

    >>> # Extract the substring we care about, the message body
    >>> message = query[27:84]
    >>> print(message.modified)
    hey how are you havent seen you in a while whats up emoji
    >>> print(message.original)
    Hey! How are you? Haven't seen you in a while, what's up 😀

Every `bistr` keeps track of the original string it started with, and maintains a sequence alignment between the original and the modified strings.
This alignment means that it knows exactly what substring of the original text is associated with every chunk of the modified text.
So when you slice a `bistr`, you get the matching slice of original text automatically!

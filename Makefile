all:
	+$(MAKE) -C python
	+$(MAKE) -C docs html

check:
	+$(MAKE) -C python check
	+$(MAKE) -C docs doctest

clean:
	+$(MAKE) -C python clean
	+$(MAKE) -C docs clean

.PHONY: all check

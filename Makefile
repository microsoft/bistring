all:
	+$(MAKE) -C python
	+$(MAKE) -C js
	+$(MAKE) -C docs html

check:
	+$(MAKE) -C python check
	+$(MAKE) -C js check
	+$(MAKE) -C docs doctest

clean:
	+$(MAKE) -C python clean
	+$(MAKE) -C js clean
	+$(MAKE) -C docs clean

.PHONY: all check

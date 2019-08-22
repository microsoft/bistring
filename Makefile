all:
	+$(MAKE) -C python
	+$(MAKE) -C js
	+$(MAKE) -C docs html

deps:
	+$(MAKE) -C python deps
	+$(MAKE) -C js deps
	+$(MAKE) -C docs deps

check:
	+$(MAKE) -C python check
	+$(MAKE) -C js check
	+$(MAKE) -C docs doctest

clean:
	+$(MAKE) -C python clean
	+$(MAKE) -C js clean
	+$(MAKE) -C docs clean

.PHONY: all deps check clean

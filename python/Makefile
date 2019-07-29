all:
	mypy -p bistring --html-report=build/mypy

check: all
	pytest

clean:
	python setup.py clean --all

.PHONY: all check clean

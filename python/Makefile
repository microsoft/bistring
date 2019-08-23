all:
	pipenv run mypy -p bistring --html-report=build/mypy

deps:
	pipenv sync --dev

check: all
	pipenv run pytest

clean:
	pipenv run python setup.py clean --all

.PHONY: all deps check clean

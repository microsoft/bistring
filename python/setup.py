#!/usr/bin/env python3

# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from pathlib import Path
from setuptools import setup


def readme():
    with open(Path(__file__).parent/'README.rst') as f:
        return f.read()


setup(
    name='bistring',
    version='0.5.0',
    description='Bidirectionally transformed strings',
    long_description=readme(),
    long_description_content_type='text/x-rst',
    classifiers=[
        'Development Status :: 4 - Beta',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3.10',
        'Topic :: Text Processing :: General',
        'Typing :: Typed',
    ],
    keywords='bistring string non-destructive',
    url='https://github.com/microsoft/bistring',
    author='Microsoft Research Montreal',
    author_email='msrmtle@microsoft.com',
    license='MIT',
    packages=[
        'bistring',
    ],
    package_data={
        'bistring': [
            'py.typed',
        ],
    },
    zip_safe=False,
    test_suite='tests',
    python_requires='>=3.10',
    setup_requires=[
        'pytest-runner',
    ],
    install_requires=[
        'pyicu',
    ],
    extras_require={
        'dev': [
            'exceptiongroup',
            'lxml',
            'mypy',
            'pytest',
            'regex',
            'tomli',
        ],
    },
    tests_require=[
        'bistring[dev]',
    ],
)

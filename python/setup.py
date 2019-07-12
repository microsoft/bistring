#!/usr/bin/env python3

# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

from setuptools import setup


setup(
    name='bistring',
    version='0.1',
    author='Microsoft Research Montreal',
    author_email='msrmtle@microsoft.com',
    description='Bidirectionally transformed strings',
    url='https://github.com/microsoft/bistring',
    packages=[
        'bistring',
    ],
    test_suite='tests',
    setup_requires=[
        'pytest-runner',
    ],
    install_requires=[
        'pyicu',
    ],
    extras_require={
        'test': [
            'pytest',
            'regex',
        ],
    },
    tests_require=[
        'bistring[test]',
    ],
)

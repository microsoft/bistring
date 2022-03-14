# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.

# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# http://www.sphinx-doc.org/en/master/config

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.

import os
from pathlib import Path
import subprocess


# -- Project information -----------------------------------------------------

project = 'bistring'
copyright = '2022, Microsoft'
author = 'Tavian Barnes'

# The full version, including alpha/beta/rc tags
release = '0.5.0'


# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.doctest',
    'sphinx.ext.intersphinx',
    'sphinx_autodoc_typehints',
    'sphinx_js',
]

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = [
    'node_modules',
    '_build',
    'Thumbs.db',
    '.DS_Store',
]


# -- Intersphinx configuration -----------------------------------------------

intersphinx_mapping = {
    'python': ('https://docs.python.org/3', None),
}


# -- Autodoc configuration ---------------------------------------------------

autoclass_content = 'both'

autodoc_default_options = {
    'members': True,
    'member-order': 'bysource',
    'show-inheritance': True,
    'special-members': '__getitem__',
}

autodoc_inherit_docstrings = False


# -- sphinx-js configuration -------------------------------------------------

parent = Path(__file__).parent.resolve()
npm_bin = parent/'node_modules/.bin'
os.environ["PATH"] = str(npm_bin) + ":" + os.environ["PATH"]

js_language = 'typescript'

js_source_path = '../js/src'

jsdoc_config_path = '../js/tsconfig.json'

root_for_relative_js_paths = '..'

def npm_install(app, config):
    node_modules = parent/'node_modules'
    if not node_modules.exists():
        subprocess.run(['npm', '--prefix=' + str(parent), 'install'])

def setup(app):
    app.connect('config-inited', npm_install)


# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = 'sphinx_rtd_theme'

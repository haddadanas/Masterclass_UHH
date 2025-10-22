# Masterclasses @ Hamburg

This repository contains a modified version of the iSpy WebGL Event Display, which has been adapted for the masterclasses at the University of Hamburg. The original version of the iSpy WebGL Event Display was developed by the CMS Collaboration (contributors: [F. Ali](https://github.com/9inpachi), [L. Barnard](https://github.com/lukebarnard), [M. Hategan](https://github.com/hategan), [S. Lee](https://github.com/SeungJunLee0), [C. Logrén](https://github.com/carpppa), [T. McCauley](https://github.com/tpmccauley), [P. Nguyen](https://github.com/phongn), [M. Saunby](https://github.com/msaunby)) and is available at the following links:

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.8043417.svg)](https://doi.org/10.5281/zenodo.8043417)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/cms-outreach/ispy-webgl)

# Developer's Guide

This guide provides instructions for developers who want to edit, expand functionalities, or contribute to the event display project. It covers the setup of the development environment, cloning the repository, installing dependencies, and running the application in development mode.

### Prerequisites

- **Node.js**: [Download](https://nodejs.org/en/download/)

### Getting the Code

You can either download the repository as a ZIP file or clone the repository using Git (recommended). If you want to contribute to the project, it is highly recommended to fork the repository to your personal GitHub account and clone the fork.

Then, follow these commands:

```bash
# Clone the repository using git clone.
# (Adjust the URL if you're using a fork)
$ git clone git@github.com:haddadanas/Masterclass_UHH.git masterclass
$ cd masterclass/

# Installing Dependencies
$ npm update
# After npm installs all dependencies, you should be ready to code


# Compile the TypeScript code to JavaScript and bundle everything using webpack
$ npm run build
# For debugging purposes, process using the development mode for TypeScript and webpack
$ npm run build:dev
# For testing, start a server and run the website locally
$ npm test
```

### Structure of the Code

- The main code files are located in the `ts/` directory.
- The webpage can be found in the `index.html` file.
- The processed and bundled files will be output to the `dist/` directory.
- The `dist/` directory also contains all assets used by the website, including stylesheets, images, and locale files for translations.

## Guides for Teachers or Students

Look for the _Help_ section in the application for guides on how to use the event display or set it up for the masterclasses.

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.4.0](https://github.com/delucis/bgio-firebase/compare/v0.3.5...v0.4.0) (2021-11-19)


### ⚠ BREAKING CHANGES

* This release now requires a minimum Node version of 12

### build

* drop support for Node 10 ([39b7119](https://github.com/delucis/bgio-firebase/commit/39b7119a3a540c3de925850c7e346738d552eaa5))

### [0.3.5](https://github.com/delucis/bgio-firebase/compare/v0.3.4...v0.3.5) (2021-09-30)

### [0.3.4](https://github.com/delucis/bgio-firebase/compare/v0.3.3...v0.3.4) (2021-08-03)

### [0.3.3](https://github.com/delucis/bgio-firebase/compare/v0.3.2...v0.3.3) (2021-05-28)

### [0.3.2](https://github.com/delucis/bgio-firebase/compare/v0.3.1...v0.3.2) (2021-05-11)

### [0.3.1](https://github.com/delucis/bgio-firebase/compare/v0.3.0...v0.3.1) (2020-12-12)

## [0.3.0](https://github.com/delucis/bgio-firebase/compare/v0.2.2...v0.3.0) (2020-10-20)


### ⚠ BREAKING CHANGES

* Versions of boardgame.io <0.41.1 are no longer supported and other uses that
directly relied on calling `listGames` or `createGame` will need to be updated to use the new method
names.

### Features

* rename deprecated storage API methods ([42be298](https://github.com/delucis/bgio-firebase/commit/42be298988f3afefa4654bde83730c9b8e8bd9c6))

### [0.2.2](https://github.com/delucis/bgio-firebase/compare/v0.2.1...v0.2.2) (2020-10-20)


### Bug Fixes

* **package:** Only support current boardgame.io ([4b6230a](https://github.com/delucis/bgio-firebase/commit/4b6230a1cab87cdfc4d5d4086e27c2e0cd7a6ff0))

### [0.2.1](https://github.com/delucis/bgio-firebase/compare/v0.2.0...v0.2.1) (2020-09-18)

## [0.2.0](https://github.com/delucis/bgio-firebase/compare/v0.1.2...v0.2.0) (2020-09-08)


### ⚠ BREAKING CHANGES

* **deps:** The minimum version of the boardgame.io peer dependency is now 0.40.0.

### Features

* Implement match list filtering ([610fc73](https://github.com/delucis/bgio-firebase/commit/610fc731cb3e3c70b5548e91241d41c2387cb837))


### Bug Fixes

* Update imported boardgame.io types ([aff6b36](https://github.com/delucis/bgio-firebase/commit/aff6b36eb30852439d2afe0d6cd10922835f15cf))


* **deps:** bump boardgame.io from >=0.39.4 to >=0.40.0 ([a11542c](https://github.com/delucis/bgio-firebase/commit/a11542c0b7e151d1d41bed65e5ff153e38154ca2))

### [0.1.2](https://github.com/delucis/bgio-firebase/compare/v0.1.1...v0.1.2) (2020-07-19)

* Update dependencies

### [0.1.1](https://github.com/delucis/bgio-firebase/compare/v0.1.0...v0.1.1) (2020-06-04)


### Features

* Set `ignoreUndefinedProperties` in Firestore settings by default ([#22](https://github.com/delucis/bgio-firebase/issues/22)) ([e6fe1e3](https://github.com/delucis/bgio-firebase/commit/e6fe1e33d6beac5a00457b1bdb71ea67da5a7440))

## 0.1.0 (2020-04-09)


### Features

* Implement new boardgame.io storage API ([#2](https://github.com/delucis/bgio-firebase/issues/2)) ([8f52f93](https://github.com/delucis/bgio-firebase/commit/8f52f93806b3cb49f0cfa770d24c9dc30e5b0227))
* Port legacy Firebase connector to Typescript ([a995dd7](https://github.com/delucis/bgio-firebase/commit/a995dd72abf611d4cb8562d299d5034b877dc328))

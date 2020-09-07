# bgio-firebase

[![NPM Version](https://img.shields.io/npm/v/bgio-firebase?logo=firebase)](https://www.npmjs.com/package/bgio-firebase)
[![Build Status](https://travis-ci.com/delucis/bgio-firebase.svg?branch=latest)](https://travis-ci.com/delucis/bgio-firebase)
[![Coverage Status](https://coveralls.io/repos/github/delucis/bgio-firebase/badge.svg?branch=latest)](https://coveralls.io/github/delucis/bgio-firebase?branch=latest)

>  🔌 A Firestore database connector for [boardgame.io][bgio]

This package provides a database connector that allows you to use a Firebase Cloud Firestore instance to store boardgame.io metadata and game state.


## Installation

```sh
npm install --save bgio-firebase
```


## Usage

This example shows one way to use the database connector when running your server on most Google infrastructure. For more details on configuring Firebase on your server, [see the Firebase documentation][fbsetup].

```js
const admin = require('firebase-admin');
const { Server } = require('boardgame.io/server');
const { Firestore } = require('bgio-firebase');
const { MyGame } = require('./game');

const database = new Firestore({
  config: {
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://<MY-PROJECT>.firebaseio.com',
  },
});

const server = Server({
  games: [MyGame],
  db: database,
});

server.run(8000);
```


## Options

The `Firestore` class can be configured with an options object with the following properties.

### `app`

- **type:** `string`

If you are using multiple Firebase apps on your server, pass in the name of the app the Firestore connector should use.

### `config`

- **type:** `admin.AppOptions`

An options object to pass to the Firebase Admin SDK's `initializeApp` method. This configures your connection with Firebase. [See the Firebase docs for details][appopts].

### `dbPrefix`

- **type:** `string`
- **default:** `'bgio_'`

Prefix for the boardgame.io collections within your Firebase project.

### `ignoreUndefinedProperties`

- **type:** `boolean`
- **default:** `true`

By default, the Firestore instance’s [`settings` method][settings] is called
internally to avoid errors from `undefined` values in data from boardgame.io.
`settings` can only be called once, so if you want to call it with your own
custom options, you can pass `false` here to disable the internal call.


## Database structure

collection ID            | document ID | contents
-------------------------|-------------|-------------------
`{dbPrefix}metadata`     | `{matchID}` | match metadata
`{dbPrefix}state`        | `{matchID}` | game state
`{dbPrefix}initialState` | `{matchID}` | initial game state
`{dbPrefix}log`          | `{matchID}` | game action logs


## Contributing

Bug reports and pull requests are very welcome! I’m not a database expert or a Firebase expert or any kind of expert, so it’s very possible that there could be improvements to how the connector interfaces with Firebase. If you run into any problems or have questions, please [open an issue][newissue].

Please also note [the code of conduct][COC] and be kind to each other.


## License

The code in this repository is provided under [the MIT License][license].


[bgio]: https://boardgame.io/
[fbsetup]: https://firebase.google.com/docs/admin/setup#node.js
[appopts]: https://firebase.google.com/docs/reference/admin/node/admin.AppOptions
[settings]: https://googleapis.dev/nodejs/firestore/latest/Firestore.html#settings
[newissue]: https://github.com/delucis/bgio-firebase/issues/new/choose
[COC]: CODE_OF_CONDUCT.md
[license]: LICENSE

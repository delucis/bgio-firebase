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

> **Note:** Versions 0.38 and below of boardgame.io used a different database API and [provided their own connector][old-connector], which you should use instead if you’re using an older version of the library.


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

### History

The original connector provided by boardgame.io used a flat database structure using IDs to distinguish between entry types:

collection | ID                             | value
-----------|--------------------------------|--------------
`{dbName}` | `{gameName}:{gameID}:metadata` | game metadata
`{dbName}` | `{gameName}:{gameID}`          | game state

A server running a game called “tic-tac-toe” would generate entries with IDs such as `tic-tac-toe:abcd123` and `tic-tac-toe:abcd123:metadata` and they were all stored in the same top-level collection (named `bgio` by default).

### Now

boardgame.io v0.39 introduced some [breaking changes][0.39cl] in data structure — adding a `gameName` field to metadata and breaking up some of the game state — and this new connector takes the opportunity to restructure the database into logical collections of data.

collection               | ID         | value
-------------------------|------------|-------------------
`{dbPrefix}metadata`     | `{gameID}` | game metadata
`{dbPrefix}state`        | `{gameID}` | game state
`{dbPrefix}initialState` | `{gameID}` | initial game state
`{dbPrefix}log`          | `{gameID}` | game action logs

### Migration

To migrate a database that used the connector provided with boardgame.io < 0.39 to be compatible with the new connector, you would need to do something like the following. (This assumes the default `dbPrefix` “bgio_”, but you can use a different prefix if you prefer.)

1. Copy all metadata entries, stripping the `:metadata` from their IDs, to a new collection called `bgio_metadata`.

2. Add a `gameName` field for each metadata entry. Given the structure of the IDs, you should be able to extract the game name from the ID and add it to metadata object.

3. Copy all game state data to a new collection called `bgio_state`.

4. For each game state object, copy the contents of the `_initial` field to a new document with the same ID as the state document, in a collection called `bgio_initialState`. Then delete the `_initial` field.

5. For each game state object, copy its `log` field to a new document with the same ID as the state document, in a collection called `bgio_log`. Then delete the `log` field.

    The created document should have the form:

    ```js
    {
      log: [/* log entries */]
    }
    ```


## Contributing

Bug reports and pull requests are very welcome! I’m not a database expert or a Firebase expert or any kind of expert, so it’s very possible that there could be improvements to how the connector interfaces with Firebase. If you run into any problems or have questions, please [open an issue][newissue].

Please also note [the code of conduct][COC] and be kind to each other.


## License

The code in this repository is provided under [the MIT License][license].


[bgio]: https://boardgame.io/
[old-connector]: https://github.com/nicolodavis/boardgame.io/blob/3a8e07d099dc1832830fce53e4b3907993fbddfc/docs/documentation/storage.md#firebase
[0.39cl]: https://github.com/nicolodavis/boardgame.io/blob/master/docs/documentation/CHANGELOG.md#v0390
[fbsetup]: https://firebase.google.com/docs/admin/setup#node.js
[appopts]: https://firebase.google.com/docs/reference/admin/node/admin.AppOptions
[settings]: https://googleapis.dev/nodejs/firestore/latest/Firestore.html#settings
[dbstruct]: #database-structure
[newissue]: https://github.com/delucis/bgio-firebase/issues/new/choose
[COC]: CODE_OF_CONDUCT.md
[license]: LICENSE

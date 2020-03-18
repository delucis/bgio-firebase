# bgio-firebase

>  🔌 A Firebase database connector for [boardgame.io][bgio]

This package provides a database connector that allows you to use a Firebase Firestore or Realtime Database instance to store boardgame.io metadata and game state.


## Installation

```sh
npm install --save bgio-firebase
```


## Usage

This example shows one way to use the database connector when running your server on most Google infrastructure. For more details on configuring Firebase on your server, [see the Firebase documentation][fbsetup].

```js
const admin = require('firebase-admin');
const { Server } = require('boardgame.io/server');
const { FirebaseDB } = require('bgio-firebase');
const { MyGame } = require('./game');

const server = Server({
  games: [MyGame],

  db: new FirebaseDB({
    config: {
      credential: admin.credential.applicationDefault(),
      databaseURL: 'https://<MY-PROJECT>.firebaseio.com',
    },
  }),
});

server.run(8000);
```

> **Note:** Versions 0.38 and below of boardgame.io used a different database API and [provided their own connector][old-connector], which you should use instead if you’re using an older version of the library.


## Options

The `FirebaseDB` class can be configured with an options object with the following properties, all of which are optional.

### `config`

- **type:** `admin.AppOptions`
- **default:** `{}`

An options object to pass to the Firebase Admin SDK's `initializeApp` method. This configures your connection with Firebase. [See the Firebase docs for details][appopts].

### `dbname`

- **type:** `string`
- **default:** `'bgio'`

The name of the database within your Firebase project.

### `engine`

- **type:** `'Firestore' | 'RTDB'`
- **default:** `'Firestore'`

Tell the connector whether to use a Firestore or Realtime Database instance.

### `cacheSize`

- **type:** `number`
- **default:** `1000`

The number of games to cache in the server’s memory.  
**N.B.** A cache size of `0` will result in an infinite cache!


<!--
## Database structure
TODO: Document how the database is structured internally.
-->


[bgio]: https://boardgame.io/
[old-connector]: https://github.com/nicolodavis/boardgame.io/blob/3a8e07d099dc1832830fce53e4b3907993fbddfc/docs/documentation/storage.md#firebase
[fbsetup]: https://firebase.google.com/docs/admin/setup#node.js
[appopts]: https://firebase.google.com/docs/reference/admin/node/admin.AppOptions

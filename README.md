
## Overview

This is a low level api for Muut IO. It has the essentials to get quickly started with developing your conversionational application.

It weights only 4kb and has no external dependencies. It works nicely with client side frameworks such as React, Riot or Vue. This repository has a quick "Todo MVC"- like example, that uses the [Riot framework](//riotjs.com). Please look for the demo directory for the relevant files.

The low leve API (muutio.js on the root of this repository) takes care of various things that are common to any kind of real-time application.


## Features

**Session management** so that all calls are authenticated after user logs in.

**Connection management**. If the connection closes, the system is able to reconnect automatically after the computer is re-connected to a network.

**Familiar API** with promise- methods `done`, `fail` and `always` and event emitting `on`, `off`, `one` and `emit`.

**Connection management** with lifecycle events like `ready`, `close` and `reconnect`

**Server sent events** and falling back to longpolling when SSE is not supported.

**Posting images and files** for attaching images and metadata to posts and replies with simple interface.



## Anatomy of Muut application

1. initialize and render threads from the server data
2. login -> reload with new data (thread expansion)
3. post, reply, like, .... load history, metadata (fast render, no event for self)
4. logout, disable UI widgets that aren't usable



## Hello, World

``` js
muutio('goma', function(data) {

  // the client is ready

  // make calls...
  this.call('type', { path: '/goma/gallery' }, function() {
    // success

  }).fail(function() {
    // failure

  })

  // reveive events...
  this.on('like', function(event, data) {
    console.info(event)
  })

})
```

## Methods

`time_offset` property for checking the difference between client and server


## Events

```
api.on('like unlike', fn)

api.on('*', fn)
```

### Event list

```
{
  // name of the event
  event: 'like'

  // timestamp in seconds
  ts: 1478161054


  data: [IDENTICAL TO WHAT THE MUUT CLIENT GETS]
}
```


## Connection lifecycle


```
api.on('close', fn)

api.on('reconnect', fn)

```
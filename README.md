
## Changes
- RPC --> muutio
- event() --> on()
- session() --> session
- evented() --> observable()


## Features

- session management
- connection management (using heartbeats)
  - automatic reconnection when back online
  - "ready", "close" and "reconnect" events
- error handling (dealing with error_invalid_channel for example)
- URL handling (randomly picking events-1/2/3.muut.com for example)
- deciding between longpoll and SSE
- simple API (`call`, `on("like")`, ...)
- ability to send multipart data (files and images)
- ignoring redundant clients like Googlebot
- `time_offset` property for checking the difference between client and server



## Initialization

``` js
var muut = muutio('goma', {})

muut.on('like', function(event) {
  console.info(event)
})
```

## Events

```
muut.event('like unlike', fn).event('*', fn)

// lifecycle methods
muut.close()

muut.connect()

// lifecycle events
muut.on('close', fn)

muut.on('reconnect', fn)

```



## Overview

- low level api for Muut IO
- just the essentials to get a quick start


## Features

- session management
- connection management (using heartbeats)
  - automatic reconnection when back online
  - "ready", "close" and "reconnect" events
- error handling (dealing with error_invalid_channel for example)
- URL handling (randomly picking events-1/2/3.api.com for example)
- deciding between longpoll and SSE
- simple API (`call`, `on("like")`, ...)
- ability to send multipart data (files and images)
- ignoring redundant clients like Googlebot
- `time_offset` property for checking the difference between client and server



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



## Server connection


```
api.on('close', fn)

api.on('reconnect', fn)

```

## Events

```
api.on('like unlike', fn)

api.on('*', fn)
```

## Event list

```
{
  // name of the event
  event: 'like'

  // timestamp in seconds
  ts: 1478161054


  data: [IDENTICAL TO WHAT THE MUUT CLIENT GETS]
}
```

window.muutio = function(project, conf, fn) {

  if (isFn(conf)) { fn = conf; conf = {} }

  conf = conf || {}

  var self = observable({}, ['ready', 'close', 'reconnect']),
      host = conf.host || 'https://client-api.muut.com',
      online = navigator.onLine

  // not supported
  if (online === undefined) online = true

  self.session = conf.session || { sessionId: localStorage['jsonrpc.session'] }

  self.path = '/' + project

  self.call = function(method) {
    if (!online) throw 'not connected'

    var message = { method: method, session: self.session, transport: 'ajax' },
        args = [].slice.call(arguments),
        params = args.slice(1, -1),
        fn = args.slice(-1)[0]


    if (!isFn(fn)) {
      if (fn !== undefined) params = args.slice(1)
      fn = undefined
    }

    message.params = params

    // send
    self.emit('send', method, message.params)

    // File(s)
    var files = params && params[0] && params[0].files,
        promise = observable({}, ['done', 'fail', 'always'])

    // done action
    promise.done(function(json) {
      fn && fn.call(self, json.result)
    })

    // multipart
    if (window.File && files) {
      delete params[0].files
      multipart(promise, message, files)

    // normal
    } else {
      post(host, message, function(json) {
        self.emit('receive', json, method)
        if (json.error) promise.fail(json.error)
        else promise.done(json)
        promise.always(json)
      })

    }

    return promise
  }


  // File handling
  function multipart(promise, message, files) {
    var data = new FormData()

    files.forEach(function(file) {
      data.append(file.altname || file.name, file)
    })

    data.append('jsonrpc', JSON.stringify(message))

    // XHR
    var xhr = new XMLHttpRequest()

    xhr.onload = function(e) {
      var json = JSON.parse(e.target.response)
      promise.emit('done', json).emit('always', e)
    }

    xhr.onerror = function(e) {
      promise.emit('fail', e).emit('always', e)
    }

    xhr.open('POST', host)
    xhr.send(data)
  }

  function setSession(s) {
    if (s && s.sessionId && s.channelId) {
      self.session = extend({}, s)

      try {
        localStorage['jsonrpc.session'] = s.sessionId
      } catch (e) {}

    }
  }

  // update session, access to json data
  self.on('receive', function(json, method) {
    setSession(json.session)

    if (method == 'init') {
      // close old session
      close()

      setSession(json.session)

      // time
      self.time_offset = Date.now() - json.server_time * 1000

      // ready
      self.ready(json.result)
    }
  })


  self.start = function(params, fn) {

    self.call('init', params, function(data) {

      fn && fn.call(self, data)

      // start polling
      var poll = !navigator.userAgent.toLowerCase().split('googlebot')[1] && conf.poll !== false

      if (self.session && poll) {
        try {
          if (window.EventSource) sse()
          else longpoll()

        } catch (e) {
          console.error(e.stack || e)
          longpoll()
        }
      }
    })

  }

  // lifecycle management
  var pong

  if (navigator.onLine !== undefined) {

    setInterval(function() {
      var flag = navigator.onLine

      if (flag != online) {
        self.emit(flag ? 'online' : 'offline')
        online = flag
      }

      var diff = pong && Date.now() - pong

      if (diff > 60 * 1000 && online) {
        pong = Date.now()
        setTimeout(reconnect, 2000)
      }

    }, 272)

  }

  function onreceive(json) {
    pong = Date.now()

    // heartbeat
    if (!json || json == 'ok' || json == 'ping') return

    // error?
    var err = json.error || json.params && json.params.error

    if (!err) {
      self.emit('receive', json)
      self.emit.apply(self, json.params)

    } else if (err == 'error_invalid_channel') {
      reconnect()

    } else {
      throw err
    }

  }


  function close() {
    delete self.session.channelId

    if (channel && channel.readyState == 1) {
      channel.close()
      self.emit('close')

    } else if (conn && conn.readyState == 1) {
      conn.abort()
      self.emit('close')
    }

  }

  function reconnect() {
    close()
    self.emit('reconnect')
  }


  function eventHost() {
    var random = 1 + Math.round(Math.random() * 2)
    return host.replace('client-api', 'events-' + random)
  }

  // one instance
  var channel

  function sse() {
    var sess = self.session

    if (!sess.channelId) return

    channel = new EventSource(eventHost() + '/sse/' + sess.sessionId + '/' + sess.channelId)

    channel.onmessage = function(e) {
      onreceive(JSON.parse(e.data))
    }

    // reconnect
    channel.onerror = function(e) {
      channel.close()
      setTimeout(sse, 2700)
    }

  }

  var conn

  function longpoll() {
    if (!self.session.channelId) return

    var params = extend({ transport: 'ajax' }, self.session)

    conn = post(eventHost() + '/notifications', params, function(json) {
      onreceive(json)
      if (json.error) conn.abort()
      else longpoll()

    }).fail(function(xhr, event) {
      setTimeout(longpoll, 2700)
      try { conn.abort() } catch(e) {} 

    })

  }

  self.start({ path: self.path  }, fn)

  return self

}


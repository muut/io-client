!function() {

window.muutio = function(path, conf, fn) {

  if ($.isFunction(conf)) { fn = conf; conf = {} }

  conf = conf || {}

  var self = observable({}, ['ready', 'close', 'reconnect']),
      host = conf.host || 'https://client-api.muut.com',
      online = navigator.onLine


  // not supported
  if (online === undefined) online = true

  self.session = conf.session || { sessionId: localStorage['jsonrpc.session'] }

  self.call = function(method) {
    if (!online) throw 'not connected'

    var message = { method: method, session: self.session, transport: 'ajax' },
        args = [].slice.call(arguments),
        params = args.slice(1, -1),
        fn = args.slice(-1)[0]


    if (!$.isFunction(fn)) {
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
      fn && fn(json.result)
    })

    // multipart
    if (window.File && files) {
      delete params[0].files
      multipart(promise, message, files)

    // normal
    } else {
      $.post(host, JSON.stringify(message).replace(/\?\?/g, '?&quest;'), function(json) {
        self.emit('receive', json, method)
        if (json.error) promise.fail(json.error)
        else promise.done(json)
        promise.always(json)

      }, 'json')

    }

    return promise
  }


  // File handling
  function multipart(promise, message, files) {
    var data = new FormData()

    $.each(files, function(i, file) {
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
      self.session = $.extend({}, s)

      try {
        localStorage['jsonrpc.session'] = s.sessionId
      } catch (e) {}

    }
  }

  // update session
  self.on('receive', function(json) {
    setSession(json.session)
  })


  self.start = function(params, fn) {

    self.call('init', params, function(data) {

      // close old session
      close()
      setSession(json.session)

      // time
      self.time_offset = Date.now() - json.server_time * 1000

      // ready
      self.ready(json.result)

      fn && fn()

      // start polling
      var poll = !navigator.userAgent.toLowerCase().split('googlebot')[1] && conf.poll !== false

      if (session && poll) {
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

      if (diff > 60 * 1000 && is_online) {
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
    delete session.channelId

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
    if (!session.channelId) return

    channel = new EventSource(eventHost() + '/sse/' + session.sessionId + '/' + session.channelId)

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
    if (!session.channelId) return

    var params = $.extend({ transport: 'ajax' }, session)

    conn = $.post(eventHost() + '/notifications', params, null, 'json').done(function(json) {
      onreceive(json)
      if (json.error) conn.abort()
      else longpoll()

    }).fail(function(xhr, event) {
      setTimeout(longpoll, 2700)
      try { conn.abort() } catch(e) {} 

    })

  }

  self.start({ path: '/' + path  }, fn)

  return self

}


function observable(el, methods) {

  var slice = [].slice, callbacks = {}

  $.extend(el, {

    on: function(events, flag, fn) {

      events = events.split(' ')

      if ($.isFunction(flag)) { fn = flag; flag = 0 }

      if ($.isFunction(fn)) {
        for (var i = 0, len = events.length, type; i < len; i++) {
          type = events[i].trim()
          ;(callbacks[type] = callbacks[type] || []).push(fn)
          if (len > 1 || events == '*') fn.typed = true
        }

        if (flag) fn.typed ? fn('inline', flag) : fn(flag)
      }

      return el
    },

    off: function(events, fn) {

      // remove all
      if (events == '*') return callbacks = {}

      events = events.split(' ')

      for (var j = 0, type; j < events.length; j++) {

        type = events[j].trim()

        // remove single type
        if (!fn) { callbacks[type] = []; continue }

        var fns = callbacks[type] || [],
          pos = -1

        for (var i = 0, len = fns.length; i < len; i++) {
          if (fns[i] === fn || fns[i].listener === fn) { pos = i; break }
        }

        if (pos >= 0) fns.splice(pos, 1)

      }

      return el

    },

    // single event supported
    one: function(type, fn) {

      function on() {
        el.off(type, fn)
        fn.apply(el, arguments)
      }

      if ($.isFunction(fn)) {
        on.listener = fn
        el.on(type, on)
      }

      return el
    },

    emit: function(type) {

      var args = slice.call(arguments, 1),
        fns = callbacks[type] || [],
        all = callbacks['*']

      if (all) fns = fns.concat(all)

      for (var i = 0, len = fns.length, fn, added, params; i < len; ++i) {
        fn = fns[i]

        // possibly removed
        if (!fn) continue

        // add event argument when multiple listeners
        params = fn.typed ? [type].concat(args) : args
        if (fn.apply(el, params) === false) return el
      }

      return el
    }

  })


  $.each(methods || [], function(i, name) {
    el[name] = function(arg) {
      return $.isFunction(arg) ? el.on(name, arg) : el.emit.apply(el, [name].concat(slice.call(arguments)))
    }
  })

  return el

}



}()

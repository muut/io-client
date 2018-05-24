var muutio = (function() {
  var localStorage = typeof window !== 'undefined' ? window.localStorage : {}
  var nodeXHR = null;
  function openLogin(session, path) {
    var url = 'https://app.muut.com/account/auth/login/?path=' + path
    url += '&sessionId=' + session.sessionId
    url += '&channelId=' + session.channelId

    openWindow(url, 750, 500)
  }

  // opens an URL on the center of the screen
  function openWindow(url, width, height) {
    var w = typeof window !== 'undefined' ? window : {},
      left = (w.screenX || w.screenLeft) + (w.outerWidth - width) / 2,
      top = (w.screenY || w.screenTop) + 50,
      opts = 'left=' + left + ',top=' + top + ',status=0,scrollbars=0,menubar=0'

    w.open(url, 'moot_popup', opts + ',width=' + width + ',height=' + height).focus()
  }
  return function(conf, opts, fn, xhr) {
    nodeXHR = xhr;
    if (isFn(opts)) {
      fn = opts
      opts = {}
    }
    if (typeof conf == 'string') conf = { path: '/' + conf }

    opts = opts || {}

    var self = observable({}, ['ready', 'close', 'reconnect', 'error']),
      host = opts.host || 'https://client-api.muut.com',
      online = typeof navigator !== 'undefined' ? navigator.onLine : true

    // not supported
    if (online === undefined) online = true

    self.session = opts.session || { sessionId: localStorage['jsonrpc.session'] }

    self.path = conf.path

    self.openLogin = function() {
      openLogin(self.session, self.path)
    }

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

      promise.fail(function(error){
        self.error(error)
      })

      // multipart
      if (typeof window !== 'undefined' && window.File && files) {
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

    // use a better name
    self.on('moot', function(thread, seed) {
      self.emit('thread', thread, seed)
    })

    self.start = function(params, fn) {
      self.call('init', params, function(data) {
        fn && fn.call(self, data)

        // start polling
        var poll = typeof navigator !== 'undefined' ? (!navigator.userAgent.toLowerCase().split('googlebot')[1] && opts.poll !== false) : false

        if (self.session && poll) {
          try {
            if (typeof window !== 'undefined' && window.EventSource) sse()
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

    if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      setInterval(function() {
        var flag = typeof navigator !== 'undefined' ? navigator.onLine : false

        if (flag != online) {
          self.emit(flag ? 'online' : 'offline')
          online = flag
        }

        var diff = pong && Date.now() - pong

        if (diff > 60 * 1000 && online) {
          pong = Date.now()
          // setTimeout(reconnect, 2000)
          if (typeof window !== 'undefined' && !window.EventSource) { // if long polling
            if (conn && conn.readyState > 0 && conn.readyState < 4) {
              // don't reconnect, we still have a pending connection,
            } else {
              // only when readyState is 1 OR 4 we try to reconnect, but don't re-initialize
              // setTimeout(reconnect, 2000)
              longpoll()
            }
          } else { // SSE
            if (channel) { channel.close() }
            // setTimeout(reconnect, 2000)
            sse() // prevent re-initialization of the app, just reconnect sse
          }
        }
      }, 272)
    }

    function onreceive(json) {
      pong = Date.now()

      // heartbeat
      if (!json || json == 'ok' || json == 'ping') return

      // error?
      var err = json.error || (json.params && json.params.error)

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

      if (conn) {
        if (conn.readyState > 0 && conn.readyState < 4) {
          // 0 = UNSENT, 4 = DONE
          // prevent multiple connections
          return
        }
      }

      conn = post(eventHost() + '/notifications', params, function(json) {
        onreceive(json)
        if (json.error) conn.abort()
        else longpoll()
      }).fail(function(xhr, event) {
        setTimeout(longpoll, 2700)
        try {
          conn.abort()
        } catch (e) {}
      })
    }

    self.start(conf, fn)

    return self
  }
  function observable(el, methods) {
    var slice = [].slice,
      callbacks = {}

    extend(el, {
      on: function(events, flag, fn) {
        events = events.split(' ')

        if (isFn(flag)) {
          fn = flag
          flag = 0
        }

        if (isFn(fn)) {
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
        if (events == '*') return (callbacks = {})

        events = events.split(' ')

        for (var j = 0, type; j < events.length; j++) {
          type = events[j].trim()

          // remove single type
          if (!fn) {
            callbacks[type] = []
            continue
          }

          var fns = callbacks[type] || [],
            pos = -1

          for (var i = 0, len = fns.length; i < len; i++) {
            if (fns[i] === fn || fns[i].listener === fn) {
              pos = i
              break
            }
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

        if (isFn(fn)) {
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
      },
    })

    methods.forEach(function(name) {
      el[name] = function(arg) {
        return isFn(arg) ? el.on(name, arg) : el.emit.apply(el, [name].concat(slice.call(arguments)))
      }
    })

    return el
  }

  function isFn(arg) {
    return typeof arg == 'function'
  }

  function extend(obj, from) {
    from &&
      Object.keys(from).forEach(function(key) {
        obj[key] = from[key]
      })
    return obj
  }

  function post(host, data, fn) {
    var conn = nodeXHR ? new nodeXHR() : new XMLHttpRequest()

    conn.onload = function(e) {
      var status = conn.status
      if (status >= 200 && status < 400) {
        if (nodeXHR) {
          fn(JSON.parse(conn.responseText))
        } else {
          fn(JSON.parse(e.target.response))
        }
      } else {
        fn({ error: conn.statusText, status: status })
      }
    }

    conn.onerror = function(e) {
      fn({ error: e })
    }

    conn.open('POST', host)

    var msg = JSON.stringify(data).replace(/\?\?/g, '?&quest;')
    conn.send(msg)

    return conn
  }
})()

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = muutio;
} else {
  window.muutio = muutio;
}

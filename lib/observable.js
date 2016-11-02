
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




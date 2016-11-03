
function isFn(arg) {
  return typeof arg == 'function'
}

function extend(obj, from) {
  from && Object.keys(from).forEach(function(key) {
    obj[key] = from[key]
  })
  return obj
}


function post(host, data, fn) {
  var conn = new XMLHttpRequest()

  conn.onload = function(e) {
    var status = conn.status
    if (status >= 200 && status < 400) {
      fn(JSON.parse(e.target.response))
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


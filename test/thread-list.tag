
<thread-list>

  <div class="thread" each={ threads }>
    <img class="avatar" src={ seed.user.img }>

    <main>
      <h3>{ seed.title }</h3>
      <p each={ para in seed.body }>{ para }</p>
    </main>

    <div class="reply" each={ replies }>
      <img class="avatar" src={ user.img }>
      <main>
        <p each={ para in seed.body }>{ para }</p>
      </main>
    </div>
  </div>

  var self = this

  muutio('playground', { host: 'http://localhost:3000' }, function(data) {
    self.update({ threads: data.moots.entries })
  })

</thread-list>
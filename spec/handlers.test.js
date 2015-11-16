
'use strict';

const tape = require( 'tape' )
const co = require( 'co' )
const IO = require( '../' )

const application = require( './helpers/utils' ).application
const connection = require( './helpers/utils' ).connection


tape( 'An event handler can be associated with an event', t => {
  t.plan( 1 )

  const io = new IO()
  const app = application( io )
  const client = connection( app.server )

  io.on( 'req', ctx => {
    t.pass( 'The event handler has been triggered' )
    client.disconnect()
  })

  client.emit( 'req' )
})

tape( 'Multiple events can be set listening', t => {
  t.plan( 1 )

  const io = new IO()
  const app = application( io )
  const client = connection( app.server )

  var count = 0

  io.on( 'req', ctx => {
    count++
  })
  io.on( 'req2', ctx => {
    count++
    t.equal( count, 2, 'Both events were triggered' )
    client.disconnect()
  })

  client.emit( 'req' )
  client.emit( 'req2' )
})

tape( 'Multiple handlers can be connected to an event', t => {
  t.plan( 1 )

  const io = new IO()
  const app = application( io )
  const client = connection( app.server )

  var count = 0

  io.on( 'req', ctx => {
    // First handler
    count++
  })
  io.on( 'req', ctx => {
    // Second handler
    count++
  })
  io.on( 'end', ctx => {
    t.equal( count, 2, 'Both handlers should have been triggered' )
    client.disconnect()
  })

  client.emit( 'req' )
  client.emit( 'end' )
})

tape( 'Middleware is run before listeners', t => {
  t.plan( 1 )

  const io = new IO()
  const app = application( io )
  const client = connection( app.server )

  var count = 0

  io.use( co.wrap( function *( ctx, next ) {
    count++
  }))
  io.on( 'req', ctx => {
    t.equal( count, 1, 'Middleware runs before listeners' )
    client.disconnect()
  })

  client.emit( 'req' )
})

tape( 'Middleware can manipulate the context', t => {
  t.plan( 1 )

  const io = new IO()
  const app = application( io )
  const client = connection( app.server )

  io.use( co.wrap( function *( ctx, next ) {
    ctx.foo = true
  }))
  io.on( 'req', ctx => {
    t.ok( ctx.foo, 'Context can be manipulated' )
    client.disconnect()
  })

  client.emit( 'req' )
})

tape( 'Middleware can be traversed', t => {
  t.plan( 2 )

  const io = new IO()
  const app = application( io )
  const client = connection( app.server )

  io.use( co.wrap( function *( ctx, next ) {
    ctx.count = 0
    yield next()
    t.equal( ctx.count, 1, 'Downstream middleware manipulated the context' )
    ctx.count++
  }))
  io.use( co.wrap( function *( ctx, next ) {
    ctx.count++
  }))
  io.on( 'req', ctx => {
    t.equal( ctx.count, 2, 'Middleware upstream and downstream have executed' )
    client.disconnect()
  })

  client.emit( 'req' )
})
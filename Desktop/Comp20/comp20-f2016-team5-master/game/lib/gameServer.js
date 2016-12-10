var util = require('util')
var http = require('http')
var path = require('path')
var ecstatic = require('ecstatic')
var io = require('socket.io')

var Player = require('./Player')

var port = process.env.PORT || 8080

/* ************************************************
** GAME VARIABLES
************************************************ */
var socket	// Socket controller
var players	// Array of connected players

/* ************************************************
** GAME INITIALISATION
************************************************ */

// Create and start the http server
var server = http.createServer(
  ecstatic({ root: path.resolve(__dirname, '../public') })
).listen(port, function (err) {
  if (err) {
    throw err
  }
  init()
})

function init () {
  
  players = [] // Create an empty array to store players
  socket = io.listen(server)  // Attach Socket.IO to server
  setEventHandlers()
}

var setEventHandlers = function () {
  // Socket.IO
  socket.sockets.on('connection', onSocketConnection)
}

// New socket connection
function onSocketConnection (client) {
  util.log('New player has connected: ' + client.id)

  client.on('disconnect', onClientDisconnect) // Listen for client disconnected
  client.on('new player', onNewPlayer) // Listen for new player message
  client.on('move player', onMovePlayer)   // Listen for move player
  client.on('shoot', onShoot) // Listen for shoot
}

// Socket client has disconnected
function onClientDisconnect () {
  util.log('Player has disconnected: ' + this.id)

  var removePlayer = playerById(this.id)

  // Player not found
  if (!removePlayer) {
    util.log('Player not found: ' + this.id)
    return
  }
  players.splice(players.indexOf(removePlayer), 1)   // Remove player from players array

  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {id: this.id})
}

// New player has joined
function onNewPlayer (data) {
  var newPlayer = new Player(data.x, data.y, data.name)   // Create a new player
  newPlayer.id = this.id

  // Broadcast new player to connected socket clients
  this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), name: newPlayer.getName()})

  // Send existing players to the new player
  var i, existingPlayer
  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i]
    var playerData = {
      id: existingPlayer.id,
      x: existingPlayer.getX(), 
      y: existingPlayer.getY(), 
      direction: existingPlayer.getDir(),
      name: existingPlayer.getName(),
      health: existingPlayer.getHealth()
    }
    this.emit('new player', playerData)
  }
  players.push(newPlayer)   // Add new player to the players array
}

// Player has moved
function onMovePlayer (data) {
  var movePlayer = playerById(this.id)   // Find player in array

  if (!movePlayer) {   // Player not found
    util.log('Player not found: ' + this.id)
    return
  }

  movePlayer.setX(data.x)   // Update player position
  movePlayer.setY(data.y)
  movePlayer.setDir(data.direction)
  movePlayer.setStop(data.isStopped)
  movePlayer.setHealth(data.health)

  var playerData = {
    id: movePlayer.id,
    x: movePlayer.getX(), 
    y: movePlayer.getY(),
    direction: movePlayer.getDir(),
    isStopped: movePlayer.getStop(),
    health: movePlayer.getHealth()
  }
  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', playerData)
}

function onShoot(data) {
  var shooter = playerById(this.id)

  if (!shooter) {   // Player not found
    util.log('Player not found: ' + this.id)
    return
  }
  this.broadcast.emit('shoot', {id: this.id})
}

// Find player by ID
function playerById (id) {

  for (var i = 0; i < players.length; i++) {
    if (players[i].id === id) {
      return players[i]
    }
  }
  return false
}

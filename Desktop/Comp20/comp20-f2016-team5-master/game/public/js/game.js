/* global Phaser RemotePlayer io */

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', {preload: preload, create: create, update: update, render: render })

function preload () {
  game.load.image('background', 'assets/space.jpg')
  game.load.image('platform', 'assets/platform.png')
  game.load.spritesheet('player', 'assets/dragon.png', 96, 96)
  game.load.spritesheet('enemy', 'assets/dragon.png', 96, 96)
  game.load.image('bullet', 'assets/bullet.png')
}

var socket // Socket connection
var player
var enemies
var platforms
var weapon
var fireButton
var speed = 500
var damage = 10;
var cursors
var textStyle = {font: '20px Georgia', fill: '#ffffff'}
var name = window.prompt("Please enter a name")

function create () {
  socket = io.connect()
  game.stage.disableVisibilityChange = true;

  initWorld();
  initPlayer();
  initWeapon();  

  enemies = []
  cursors = game.input.keyboard.createCursorKeys()

  setEventHandlers()
}

var setEventHandlers = function () {
  socket.on('connect', onSocketConnected)  // Socket connection successful
  socket.on('disconnect', onSocketDisconnect)   // Socket disconnection
  socket.on('new player', onNewPlayer)   // New player message received
  socket.on('move player', onMovePlayer)   // Player move message received
  socket.on('shoot', onShoot)       // Player shoot message recieved
  socket.on('remove player', onRemovePlayer)   // Player removed message received
}

// Socket connected
function onSocketConnected () {
  console.log('Connected to socket server')
  enemies.forEach(function (enemy) {   // Reset enemies on reconnect
    enemy.player.kill()
  })
  enemies = []

  // Send local player data to the game server
  socket.emit('new player', {x: player.x, y: player.y, name: player.name})
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server')
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.id)

  // Avoid possible duplicate players
  var duplicate = playerById(data.id)
  if (duplicate) {
    console.log('Duplicate player!')
    return
  }
  newPlayer = new RemotePlayer(data.id, game, player, data.x, data.y, data.name)

  enemies.push(newPlayer) // Add new player to the remote players array
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerById(data.id)

  // Player not found
  if (!movePlayer) {
    console.log('Player not found: ', data.id)
    return
  }

  // Update player position
  movePlayer.player.x = data.x
  movePlayer.player.y = data.y
  movePlayer.direction = data.direction
  movePlayer.isStopped = data.isStopped
}

function onShoot(data) {
  var shooter = playerById(data.id)

  if (!shooter) {
    console.log('Player not found: ', data.id)
    return
  }
  shooter.fireWeapon()
}

// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id)

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id)
    return
  }

  removePlayer.player.kill()

  // Remove player from array
  enemies.splice(enemies.indexOf(removePlayer), 1)
}

function update () {
  game.physics.arcade.collide(player, platforms)
  

  for (var i = 0; i < enemies.length; i++) {
      enemies[i].update()
      game.physics.arcade.overlap(player, enemies[i].weapon.bullets, function() {
        player.health -= damage
        enemies[i].weapon.killAll()
      })

      game.physics.arcade.overlap(enemies[i].player, weapon.bullets, function() {
        enemies[i].hit(damage)
        weapon.killAll()
      })
  }

  if (cursors.left.isDown) {
    player.body.velocity.x = -1*speed
    player.direction = 'left'
    player.isStopped = false;
  } 
  else if (cursors.right.isDown) {
    player.body.velocity.x = speed
    player.direction = 'right'
    player.isStopped = false;
  }
  else {
    player.animations.stop()
    player.isStopped = true
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.body.velocity.y = -800
  }

  if (player.body.touching.down) {
    player.body.velocity.x *= 0.9
  }

  player.animations.play(player.direction)
  healthText.setText(player.health)

  if (fireButton.isDown) {
    fireWeapon();
  }

  if (player.health <= 0) {
    player.kill()
  }

  var playerData = {
    x: player.x,
    y: player.y, 
    direction: player.direction,
    isStopped: player.isStopped,
    health: player.health
  }

  socket.emit('move player', playerData)
}

function render () {

}

function initWorld() {
  game.add.sprite(0, 0, 'background');

  platforms = game.add.group();
  platforms.enableBody = true;
  var ground = platforms.create(0, game.world.height - 64, 'platform');

  ground.scale.setTo(2, 2);
  ground.body.immovable = true;
  var ledge = platforms.create(600, 400, 'platform');
  ledge.body.immovable = true;
  ledge.scale.setTo(0.7,0.5)
  ledge = platforms.create(-100, 250, 'platform');
  ledge.body.immovable = true;
  ledge.scale.setTo(0.7,0.5)

}

function initPlayer() {
  var startX = Math.round(Math.random() * (1000) - 500)
  var startY = game.world.height - 150

  player = game.add.sprite(startX, startY, 'player')
  player.anchor.setTo(0.5, 0.5)
  player.animations.add('right', [8,9,10,11], 10, true)
  player.animations.add('left', [4,5,6,7], 10, true)

  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.gravity.y = 1500;
  player.body.collideWorldBounds = true
  player.body.drag.x = 500
  player.body.drag.y = 200

  player.name = name
  player.health = 100
  player.direction = 'right'
  player.isStopped = true;
  player.addChild(game.add.text(0,-70,player.name,textStyle))

  healthText = game.add.text(0,0,player.health,textStyle)

  player.bringToTop()
}

function initWeapon() {
  weapon = game.add.weapon(1, 'bullet');
  weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
  weapon.bulletSpeed = 1000;
  weapon.fireRate = 20;
  weapon.trackSprite(player, 0, -30, false)

  fireButton = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
}

function fireWeapon() {
  if (player.direction == 'left') {
    weapon.fireAngle = 180
  } 
  else if (player.direction == 'right') {
    weapon.fireAngle = 0
  }
  weapon.fire()
  socket.emit('shoot', {})
}

// Find player by ID
function playerById (id) {

  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].id === id) {
      return enemies[i]
    }
  }
  return false
}

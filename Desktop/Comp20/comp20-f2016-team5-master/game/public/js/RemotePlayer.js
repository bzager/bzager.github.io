/* global game */

var RemotePlayer = function (index, game, player, startX, startY, name) {
  var x = startX
  var y = startY
  var textStyle = {font: '20px Georgia', fill: '#ffffff'}


  this.game = game
  this.health = 100
  this.player = player
  this.name = name
  this.id = index.toString()
  this.alive = true
  this.direction = 'right'
  this.isStopped = true

  this.player = game.add.sprite(x, y, 'player')
  this.player.frame = 8

  this.player.animations.add('right', [8,9,10,11], 10, true)
  this.player.animations.add('left', [4,5,6,7], 10, true)
  this.player.anchor.setTo(0.5, 0.5)

  game.physics.enable(this.player, Phaser.Physics.ARCADE)
  this.player.body.collideWorldBounds = true

  this.weapon = game.add.weapon(1, 'bullet');
  this.weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
  this.weapon.bulletSpeed = 1000;
  this.weapon.fireRate = 20;
  this.weapon.trackSprite(this.player, 0, -30, false);

  this.player.addChild(this.game.add.text(0, -70, this.name, textStyle))

}

RemotePlayer.prototype.update = function () {
  
  if (this.health <= 0) {
    this.player.kill()
  }

  if (!this.isStopped) {
    this.player.animations.play(this.direction)
  }
  else {
    this.player.animations.stop()
  }
}

RemotePlayer.prototype.fireWeapon = function () {
  if (this.direction == 'right') {
    this.weapon.fireAngle = 0
  }
  else if (this.direction == 'left') {
    this.weapon.fireAngle = 180
  }
  this.weapon.fire()
}

RemotePlayer.prototype.hit = function (damage) {
  this.health -= damage
  //setText(this.health)
}


window.RemotePlayer = RemotePlayer

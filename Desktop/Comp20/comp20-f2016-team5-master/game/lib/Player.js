/* ************************************************
** GAME PLAYER CLASS
************************************************ */
var Player = function (startX, startY, playerName) {
  var x = startX
  var y = startY
  var id
  var health
  var direction
  var name = playerName
  var isStopped

  // Getters and setters
  var getX = function () {
    return x
  }

  var getY = function () {
    return y
  }

  var getHealth = function() {
    return health;
  }

  var getDir = function() {
    return direction
  }

  var getName = function() {
    return name
  }

  var getStop = function() {
    return isStopped
  } 

  var setX = function (newX) {
    x = newX
  }

  var setY = function (newY) {
    y = newY
  }

  var setHealth = function(newHealth) {
    health = newHealth
  }

  var setDir = function(newDir) {
    direction = newDir
  }

  var setName = function(newName) {
    name = newName
  } 

  var setStop = function(stop) {
    isStopped = stop
  }


  // Define which variables and methods can be accessed
  return {
    getX: getX,
    getY: getY,
    getHealth: getHealth,
    getDir: getDir,
    getName: getName,
    getStop: getStop,
    setX: setX,
    setY: setY,
    setHealth: setHealth,
    setDir: setDir,
    setName: setName,
    setStop: setStop,
    id: id
  }
}

// Export the Player class so you can use it in
// other files by using require("Player")
module.exports = Player

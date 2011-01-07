
constants =
    WIDTH: 1024
    HEIGHT: 768
    MILLIS_PER_TICK: 30
    
keys =
    LEFT: 37
    UP: 38
    RIGHT: 39
    DOWN: 40
    SPACE: 32
    CTRL: 17
    
colors =
    RED: "rgba(255,0,0,1.0)"
    BLUE: "rgba(0,0,255,1.0)"
    
input =
    keysHeld: []
    
state = 
    ACTIVE: 0
    DYING: 1
    DEAD: 2
    
utils =
    degToRad: (degrees) ->
        0.0174532925 * degrees

class Renderer
    constructor: ->
        @ctx = document.getElementById("canvas").getContext("2d");

    drawRect: (x, y, width, height, color) ->
        @ctx.fillStyle = color
        @ctx.fillRect(x, y, width, height)
        
    clear: ->
        this.drawRect(0, 0, constants.WIDTH, constants.HEIGHT, "rgba(255,255,255,1.0)")
        
    renderShip: (ship) ->
        @ctx.save()
        @ctx.translate(ship.coord.x, ship.coord.y)
        @ctx.rotate(0.0174532925 * ship.heading)
        this.drawRect(-ship.width/2, -ship.length/2, ship.width, ship.length, ship.color)
        @ctx.restore()
    
    render: (model) ->
        this.clear()      
        this.renderShip(ship) for ship in model.ships
        this.renderShip(bullet) for bullet in model.bullets
        this.renderShip(model.player)
        
class Rocket
    constructor: (coord, heading) ->
        @distTravelled = 0
        @maxDist = 300.0
        @damage = 100
        @radius = 100
        @speed = 400.0
        @coord = coord
        @heading = heading
        @color = colors.RED
        @width = 5
        @length = 10
        @state = state.ACTIVE
    
    update: (dt) ->
        if @distTravelled < @maxDist
            dist = @speed * dt/1000.0
            theta = utils.degToRad(@heading)
            dx = dist * Math.sin(theta)
            dy = dist * Math.cos(theta)
            @coord.x += dx
            @coord.y -= dy
            @distTravelled += Math.sqrt(dx * dx + dy * dy)
        else
            #TODO: explode
            @state = state.DEAD
        
        
class Player
    constructor: ->
        @hp = 100
        @heading = 135.0 #degrees, up = 0
        @coord = x: 200, y: 200 #x, y
        @speed = 200.0 #pix per second
        @rotSpeed = 180.0 #degrees per second
        @width = 20
        @length = 40
        @color = colors.RED
        @state = state.ACTIVE
        
    update: (dt, model) ->
        if input.keysHeld[keys.UP]
            dist = @speed * dt/1000.0
            theta = utils.degToRad(@heading)
            @coord.x += dist * Math.sin(theta)
            @coord.y -= dist * Math.cos(theta)            
        if input.keysHeld[keys.LEFT]
            @heading -= @rotSpeed * dt/1000.0
        if input.keysHeld[keys.RIGHT]
            @heading += @rotSpeed * dt/1000.0
        if input.keysHeld[keys.CTRL]
            model.bullets.push(new Rocket({x: @coord.x, y: @coord.y}, @heading))
        
class Ship
    constructor: (coord) ->
        @hp = 50
        @heading = 0.0
        @coord = coord
        @width = 20
        @length = 40
        @color = colors.BLUE
        @state = state.ACTIVE
        
    update : (dt) ->
        

class Model
    constructor: ->
        @player = new Player
        @ships = (new Ship({x: Math.random() * constants.WIDTH, y: Math.random() * constants.HEIGHT}) for i in [1..10])
        @bullets = []

    update: (dt) ->
        @player.update(dt, this)
        ship.update(dt) for ship in @ships
        for bullet in @bullets
            if bullet
                bullet.update(dt) 
        
        @ships = for ship in @ships
            if ship.state != state.DEAD
                ship
        
        @bullets = (bullet for bullet in (bullet for bullet in @bullets when bullet.state != state.DEAD) when bullet)

class Controller
    constructor: ->
        @model = new Model
        @renderer = new Renderer
        @lastTime = (new Date).getTime()

    tick: ->
        d = new Date();
        time = d.getTime();
        dt = time - @lastTime
        @lastTime = time
        
        @model.update(dt)
        @renderer.render(@model)
            
   
controller = new Controller

document.onkeydown = (event) ->
    input.keysHeld[event.keyCode] = true
    
document.onkeyup = (event) ->
    input.keysHeld[event.keyCode] = false

gameTick = () ->
    controller.tick()

window.onload = () ->
    setInterval(gameTick, constants.MILLIS_PER_TICK);






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
    GREEN: "rgba(0,255,0,1.0)"
    BACKGROUND: "rgba(0,0,0,1.0)"
    
state = 
    ACTIVE: 0
    DYING: 1
    DEAD: 2
    
orders =
    MOVE: 0
    ATTACK: 1
    STOP : 2
    
mouseButtons =
    LEFT: 0
    RIGHT: 2
    WHEEL: 1
    
utils =
    degToRad: (degrees) ->
        0.0174532925 * degrees
    radToDeg: (radians) ->
        57.295779578 * radians
    currentTimeMillis: ->
        d = new Date();
        d.getTime();
    max: (a, b) ->
        if a > b then a else b
    min: (a, b) ->
        if a > b then b else a
    abs: (a) ->
        if a < 0 then -1*a else a
              
input =
    xOffset: 0
    yOffset: 0
    keysHeld: {}
    mouseHeld: {}
    mouseClicked: {}
    boxDrawn: {handled: true}
    isInBox: (coord) ->
        #alert "#{this.boxDrawn.topLeft.x} #{this.boxDrawn.topLeft.y} #{this.boxDrawn.bottomRight.x} #{this.boxDrawn.bottomRight.y}"
        coord.x > this.boxDrawn.topLeft.x and coord.x < this.boxDrawn.bottomRight.x and coord.y > this.boxDrawn.topLeft.y and coord.y < this.boxDrawn.bottomRight.y
    
document.onkeydown = (event) ->
    input.keysHeld[event.keyCode] = true
    
document.onkeyup = (event) ->
    input.keysHeld[event.keyCode] = false

#disable the right-click context menu
document.captureEvents(Event.ONCONTEXTMENU)
document.oncontextmenu = (event) ->
    return false    
    
$("html").mousedown((event) ->
    #event.preventDefault()
    #event.stopPropagation()
    $("#debug").text("Mouse button #{event.button} down at: #{event.clientX} left #{event.clientY} down")
    input.mouseHeld[event.button] = {x: event.clientX - input.xOffset, y: event.clientY - input.yOffset})
    
$("#canvas").mousedown((event) ->
    input.xOffset = this.offsetLeft
    input.yOffset = this.offsetTop)
    
$("html").mouseup((event) ->
    event.preventDefault()
    event.stopPropagation()
    startPos = input.mouseHeld[event.button]
    upX = event.pageX - input.xOffset
    upY = event.pageY - input.yOffset
    if startPos and event.button == mouseButtons.LEFT
        input.boxDrawn = 
            topLeft:
                x: utils.min(startPos.x, upX)
                y: utils.min(startPos.y, upY)
            bottomRight:
                x: utils.max(startPos.x, upX)
                y: utils.max(startPos.y, upY)
            handled: false      
        
    input.mouseHeld[event.button] = false

    if startPos
        input.mouseClicked[event.button] = 
            coord: 
                x: event.clientX - input.xOffset
                y: event.clientY - input.yOffset
            handled: false
    
    $("#debug").text("Mouse button #{event.button} up at: #{event.clientX} left #{event.clientY} down"))

class Renderer
    constructor: ->
        @ctx = document.getElementById("canvas").getContext("2d");

    drawRect: (x, y, width, height, color) ->
        @ctx.fillStyle = color
        @ctx.fillRect(x, y, width, height)
        
    clear: ->
        this.drawRect(0, 0, constants.WIDTH, constants.HEIGHT, colors.BACKGROUND)
        
    renderShip: (ship) ->
        @ctx.save()
        @ctx.translate(ship.coord.x, ship.coord.y)
        @ctx.rotate(-1 * (Math.PI/2 - utils.degToRad(ship.heading)))
        this.drawRect(-ship.width/2, -ship.length/2, ship.width, ship.length, ship.color)
        if ship.selected
            @ctx.lineWidth = 2
            @ctx.strokeStyle = colors.GREEN
            @ctx.strokeRect(-ship.width/2, -ship.length/2, ship.width, ship.length)
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
        @speed = 600.0
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
        

class RocketLauncher
    constructor: ->
        @cooldown = 250 #milliseconds
        @bulletClass = Rocket
        @lastFired = utils.currentTimeMillis()
       
    readyToFire: ->    
        (utils.currentTimeMillis() - @lastFired) > @cooldown
       
    tryFire: (coord, heading, list) ->
        if (this.readyToFire())
            list.push(new @bulletClass(coord, heading))
            @lastFired = utils.currentTimeMillis()

        
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
        
        @rocketLauncher = new RocketLauncher
        
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
            @rocketLauncher.tryFire({x: @coord.x, y: @coord.y}, @heading, model.bullets)
        
class Ship
    constructor: (coord, heading) ->
        @hp = 50
        @speed = 300
        @heading = heading #angle with the positive x-axis
        @coord = coord
        @targetCoord = coord
        @width = 20
        @length = 40
        @color = colors.BLUE
        @state = state.ACTIVE
        @selected = false
        @order
        @orderType
        
    update : (dt) ->
        if @order
            @targetCoord = @order.targetCoord
            @orderType = @order.orderType
            
        if @orderType == orders.MOVE and (@coord.x != @targetCoord.x or @coord.y != @targetCoord.y)
           
            dx = @targetCoord.x - @coord.x
            dy = @targetCoord.y - @coord.y
            theta = Math.atan2(dy, dx)
            
            @heading = utils.radToDeg(theta)
            
            $("#debug").text("Heading: #{@heading}")
            
            dist = @speed * dt/1000.0
            
            #TODO: do "magic boxes" or similar instead
            dx2 = dist * Math.cos(theta)
            dy2 = dist * Math.sin(theta)
            @coord.x += if utils.abs(dx) > utils.abs(dx2) then dx2 else dx
            @coord.y += if utils.abs(dy) > utils.abs(dy2) then dy2 else dy      
        

class GameModel
    constructor: ->
        @model =
            player: new Player
            ships: 
                for i in [1..10]
                    new Ship({x: Math.round(Math.random() * constants.WIDTH), y: Math.round(Math.random() * constants.HEIGHT)}, Math.round(Math.random() * 360.0))
            selected: []
            bullets: []

    update: (dt) ->
        rightClick = input.mouseClicked[mouseButtons.RIGHT]
        if rightClick and !rightClick.handled    
            for ship in @model.ships
                if ship.selected                 
                    ship.order = {targetCoord: rightClick.coord, orderType: orders.MOVE}
            rightClick.handled = true
    
        if !input.boxDrawn.handled
            for ship in @model.ships 
                ship.selected = input.isInBox(ship.coord)
            input.boxDrawn.handled = true                 
    
        @model.player.update(dt, @model)
        ship.update(dt) for ship in @model.ships
        bullet.update(dt) for bullet in @model.bullets
                      
        @model.ships = (ship for ship in @model.ships when ship.state != state.DEAD)     
        @model.bullets = (bullet for bullet in @model.bullets when bullet.state != state.DEAD)

class Controller
    constructor: ->
        @gameModel = new GameModel
        @renderer = new Renderer
        @lastTime = (new Date).getTime()
        @frames = 0
        @startTime = utils.currentTimeMillis()
        @fpsIndicator = $("#fps")

    tick: ->
        d = new Date();
        time = d.getTime();
        dt = time - @lastTime
        @lastTime = time
        
        @gameModel.update(dt)
        @renderer.render(@gameModel.model)
        
        @fpsIndicator.text(Math.round(1000 * @frames/(utils.currentTimeMillis() - @startTime)) + " fps")
        if (utils.currentTimeMillis() - @startTime) > 5000
            @startTime = utils.currentTimeMillis()
            @frames = 0
        @frames++
            
   
controller = new Controller

gameTick = () ->
    controller.tick()

window.onload = () ->
    setInterval(gameTick, constants.MILLIS_PER_TICK);





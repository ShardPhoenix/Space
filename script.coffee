
constants =
    CANVAS_WIDTH: 1024
    CANVAS_HEIGHT: 768
    MINIMAP_WIDTH: 384
    MINIMAP_HEIGHT: 288
    GAME_WIDTH: 10000
    GAME_HEIGHT: 10000   
    MILLIS_PER_TICK: 10
    KEY_SCROLL_RATE: 600 #pix per second
    VIEWPORT_MARGIN: 200 #rendering margin in pixelss
    NUM_SHIPS: 1000
    NUM_PLANETS: 100
    
players =
    COMPUTER: 0
    HUMAN: 1
    
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
    randomColor: ->
        "rgba(#{Math.round(Math.random() * 255)},#{Math.round(Math.random() * 255)},#{Math.round(Math.random() * 255)},1.0)"
        
    forPlayer: (player) ->
        switch player
            when players.COMPUTER then colors.BLUE
            when players.HUMAN then colors.RED
            else colors.GREEN
    
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
    mousePos: {x: 0, y: 0}
    selectBox: {handled: true}
    isInBox: (coord) ->
        coord.x > this.selectBox.topLeft.x and coord.x < this.selectBox.bottomRight.x and coord.y > this.selectBox.topLeft.y and coord.y < this.selectBox.bottomRight.y
        
minimapInput =
    xOffset: 0
    yOffset: 0
    mouseHeld: {}
    mouseClicked: {}
    
document.onkeydown = (event) ->
    input.keysHeld[event.keyCode] = true
    
document.onkeyup = (event) ->
    input.keysHeld[event.keyCode] = false

#disable the right-click context menu
document.captureEvents(Event.ONCONTEXTMENU)
document.oncontextmenu = (event) ->
    return false        
    
#figure out where canvas is relative to the window
$("#canvas").mousedown((event) ->
    input.xOffset = this.offsetLeft
    input.yOffset = this.offsetTop)

$("#minimap").mousedown((event) ->
    minimapInput.xOffset = this.offsetLeft
    minimapInput.yOffset = this.offsetTop)
    
$("#minimap").click((event) ->
    minimapInput.mouseClicked[event.button] = 
        coord: 
            x: event.clientX - minimapInput.xOffset
            y: event.clientY - minimapInput.yOffset
        handled: false
    )
    
$("#minimap").mousedown((event) ->
    event.preventDefault()
    event.stopPropagation()
    minimapInput.mouseHeld[event.button] = {x: event.clientX - minimapInput.xOffset, y: event.clientY - minimapInput.yOffset})
    
#we only care about the current mouse position for the minimap, so adjust as we drag
$("#minimap").mousemove((event) ->
    minimapInput.mouseHeld[event.button].x = event.clientX - minimapInput.xOffset
    minimapInput.mouseHeld[event.button].y = event.clientY - minimapInput.yOffset
)
    
$("#minimap").mouseup((event) ->
    minimapInput.mouseHeld[event.button] = false
)
    
$("html").mousemove((event) ->
    input.mousePos.x = event.clientX - input.xOffset
    input.mousePos.y = event.clientY - input.yOffset
    $("#mousePos").text("X: #{input.mousePos.x}, Y: #{input.mousePos.y}"))
    
$("html").mousedown((event) ->
    event.preventDefault()
    event.stopPropagation()
    $("#debug").text("Mouse button #{event.button} down at: #{event.clientX} left #{event.clientY} down")
    input.mouseHeld[event.button] = {x: event.clientX - input.xOffset, y: event.clientY - input.yOffset})
    
$("html").mouseup((event) ->
    event.preventDefault()
    event.stopPropagation()
    startPos = input.mouseHeld[event.button]
    upX = event.pageX - input.xOffset
    upY = event.pageY - input.yOffset
    if startPos and event.button == mouseButtons.LEFT and (startPos.x != upX or startPos.y != upY)
        input.selectBox = 
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
        @minimap = document.getElementById("minimap").getContext("2d");

    drawRect: (x, y, width, height, color) ->
        @ctx.fillStyle = color
        @ctx.fillRect(x, y, width, height)
        
    drawCircle: (x, y, radius, color) ->
        @ctx.strokeStyle = color
        @ctx.fillStyle = color
        @ctx.beginPath()
        @ctx.arc(x, y, radius, 0, Math.PI*2, true)
        @ctx.closePath()
        @ctx.stroke()
        @ctx.fill()
        
    clear: ->
        this.drawRect(0, 0, constants.CANVAS_WIDTH, constants.CANVAS_HEIGHT, colors.BACKGROUND)
        
    renderShip: (ship, viewport) ->
        @ctx.save()      
        @ctx.translate(ship.coord.x - viewport.x, ship.coord.y - viewport.y)
        @ctx.rotate(utils.degToRad(ship.heading) - Math.PI/2)
        this.drawRect(-ship.width/2, -ship.length/2, ship.width, ship.length, ship.color)
        #this.drawRect(0, 0, 1, 1, colors.RED) #color ship's actual coord
        if ship.selected
            @ctx.lineWidth = 2
            @ctx.strokeStyle = colors.GREEN
            @ctx.strokeRect(-ship.width/2, -ship.length/2, ship.width, ship.length)
        @ctx.restore()
        
    renderPlanet: (planet, viewport) ->
        @ctx.save()      
        @ctx.translate(planet.coord.x - viewport.x, planet.coord.y - viewport.y)
        @ctx.rotate(utils.degToRad(planet.heading) - Math.PI/2)
        this.drawCircle(0, 0, planet.radius, planet.color)
        #this.drawRect(0, 0, 1, 1, colors.RED) #color planet's actual coord
        @ctx.restore()
    
    nearViewport: (coord, viewport) ->
        coord.x > (viewport.x - constants.VIEWPORT_MARGIN) and coord.x < (viewport.x + constants.CANVAS_WIDTH + constants.VIEWPORT_MARGIN) and
            coord.y > (viewport.y - constants.VIEWPORT_MARGIN) and coord.y < (viewport.y + constants.CANVAS_HEIGHT + constants.VIEWPORT_MARGIN)
            
    renderMinimap: (model, viewport) ->
        @minimap.fillStyle = colors.BACKGROUND
        @minimap.fillRect(0, 0, constants.MINIMAP_WIDTH, constants.MINIMAP_HEIGHT)
        
        for planet in model.planets
            @minimap.fillStyle = planet.color
            @minimap.fillRect(planet.coord.x * (constants.MINIMAP_WIDTH/constants.GAME_WIDTH), planet.coord.y * (constants.MINIMAP_HEIGHT/constants.GAME_HEIGHT), 2, 2)
        
        for ship in model.ships
            @minimap.fillStyle = ship.color
            @minimap.fillRect(ship.coord.x * (constants.MINIMAP_WIDTH/constants.GAME_WIDTH), ship.coord.y * (constants.MINIMAP_HEIGHT/constants.GAME_HEIGHT), 1, 1)
            
        #draw selected area box      
        fractionWidth = constants.CANVAS_WIDTH/constants.GAME_WIDTH
        fractionHeight = constants.CANVAS_HEIGHT/constants.GAME_HEIGHT
        boxWidth = fractionWidth * constants.MINIMAP_WIDTH
        boxHeight = fractionHeight * constants.MINIMAP_HEIGHT
        boxX = viewport.x * constants.MINIMAP_WIDTH/constants.GAME_WIDTH
        boxY = viewport.y * constants.MINIMAP_HEIGHT/constants.GAME_HEIGHT
        
        #if we are dragging, draw box there instead
        leftDrag = minimapInput.mouseHeld[mouseButtons.LEFT]
        if leftDrag 
            boxX = leftDrag.x - (constants.CANVAS_WIDTH/constants.GAME_WIDTH * constants.MINIMAP_WIDTH)/2
            boxY = leftDrag.y - (constants.CANVAS_HEIGHT/constants.GAME_HEIGHT * constants.MINIMAP_WIDTH)/2
        
        @minimap.lineWidth = 1
        @minimap.strokeStyle = colors.GREEN
        @minimap.strokeRect(boxX, boxY, boxWidth, boxHeight)
        
    
    render: (model, viewport) ->
        $("#screenCoord").text("Screen X: #{viewport.x} Screen Y: #{viewport.y}")
    
        this.clear()
        this.renderPlanet(planet, viewport) for planet in model.planets when this.nearViewport(planet.coord, viewport)
        this.renderShip(ship, viewport) for ship in model.ships when this.nearViewport(ship.coord, viewport)
        this.renderShip(bullet, viewport) for bullet in model.bullets when this.nearViewport(ship.coord, viewport)
        
        leftPress = input.mouseHeld[mouseButtons.LEFT]
        if (leftPress)
            @ctx.lineWidth = 1
            @ctx.strokeStyle = colors.GREEN
            @ctx.strokeRect(leftPress.x, leftPress.y, input.mousePos.x - leftPress.x, input.mousePos.y - leftPress.y)
            
        this.renderMinimap(model, viewport)
        
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
    constructor: (owner, coord, heading) ->
        @hp = 50
        @speed = 300
        @heading = heading #angle with the positive x-axis
        @coord = coord
        @targetCoord = coord
        @width = 20
        @length = 40
        @color = colors.forPlayer(owner)
        @state = state.ACTIVE
        @selected = false
        @order
        @orderType
        
        @owner = owner
        
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
        

class Planet
    constructor: (coord, radius) ->
        @coord = coord
        @heading = 0.0
        @radius = radius
        @color = colors.randomColor()

class GameModel
    constructor: ->
        @viewport = {x: 0, y: 0}
    
        @model =           
            ships: 
                for i in [1..constants.NUM_SHIPS]
                    new Ship((if Math.random() > 0.5 then players.COMPUTER else players.HUMAN), {x: Math.round(Math.random() * constants.GAME_WIDTH), y: Math.round(Math.random() * constants.GAME_HEIGHT)}, Math.round(Math.random() * 360.0))
            planets:
                for i in [1..constants.NUM_PLANETS]
                    new Planet({x: Math.round(Math.random() * constants.GAME_WIDTH), y: Math.round(Math.random() * constants.GAME_HEIGHT)}, 20 + Math.round(Math.random() * 100))
            selected: []
            bullets: []
            
    gameCoord: (screenCoord) ->
        {x: screenCoord.x + @viewport.x, y: screenCoord.y + @viewport.y}
            
    update: (dt) ->
        #keyboard scroll
        if input.keysHeld[keys.LEFT]
            @viewport.x -= Math.round(constants.KEY_SCROLL_RATE * dt/1000.0)
            if @viewport.x < 0 then @viewport.x = 0
        if input.keysHeld[keys.RIGHT]
            @viewport.x += Math.round(constants.KEY_SCROLL_RATE * dt/1000.0)
            if @viewport.x > (constants.GAME_WIDTH - constants.CANVAS_WIDTH)  then @viewport.x = (constants.GAME_WIDTH - constants.CANVAS_WIDTH)
            
        if input.keysHeld[keys.UP]
            @viewport.y -= Math.round(constants.KEY_SCROLL_RATE * dt/1000.0)
            if @viewport.y < 0 then @viewport.y = 0
        if input.keysHeld[keys.DOWN]
            @viewport.y += Math.round(constants.KEY_SCROLL_RATE * dt/1000.0)
            if @viewport.y > (constants.GAME_HEIGHT - constants.CANVAS_HEIGHT)  then @viewport.y = (constants.GAME_HEIGHT - constants.CANVAS_HEIGHT)
    
    
        rightClick = input.mouseClicked[mouseButtons.RIGHT]
        if rightClick? and !rightClick.handled
            realCoord = this.gameCoord(rightClick.coord)
            for ship in @model.ships
                if ship.selected                 
                    ship.order = {targetCoord: realCoord, orderType: orders.MOVE}
            rightClick.handled = true
            
        leftClick = input.mouseClicked[mouseButtons.LEFT]
        if leftClick? and !leftClick.handled
            realCoord = this.gameCoord(leftClick.coord)
            toBeSelected = null
            for ship in @model.ships when ship.owner == players.HUMAN                                      
                measure = if ship.length > ship.width then ship.length else ship.width
                if utils.abs(realCoord.x - ship.coord.x) < measure/2 and utils.abs(realCoord.y - ship.coord.y) < measure/2
                    toBeSelected = ship
            
            if toBeSelected?
                ship.selected = false for ship in @model.ships
                toBeSelected.selected = true
                
            leftClick.handled = true
    
        if !input.selectBox.handled
            toBeSelected = []
            for ship in @model.ships when ship.owner == players.HUMAN
                if input.isInBox({x: ship.coord.x - @viewport.x, y: ship.coord.y - @viewport.y})
                    toBeSelected.push(ship)
            if toBeSelected.length > 0
                for ship in @model.ships
                    ship.selected = ship in toBeSelected
            input.selectBox.handled = true    
            
        mapDrag = minimapInput.mouseHeld[mouseButtons.LEFT]
        if mapDrag
            @viewport.x = Math.round(mapDrag.x * constants.GAME_WIDTH/constants.MINIMAP_WIDTH - constants.CANVAS_WIDTH/2)
            @viewport.y = Math.round(mapDrag.y * constants.GAME_HEIGHT/constants.MINIMAP_HEIGHT - constants.CANVAS_HEIGHT/2)
            $("#debug3").text("dragging at #{@viewport.x}, #{@viewport.y}")

        mapClick = minimapInput.mouseClicked[mouseButtons.LEFT]
        if mapClick and !mapClick.handled
            @viewport.x = Math.round(mapClick.coord.x * constants.GAME_WIDTH/constants.MINIMAP_WIDTH - constants.CANVAS_WIDTH/2)
            @viewport.y = Math.round(mapClick.coord.y * constants.GAME_HEIGHT/constants.MINIMAP_HEIGHT - constants.CANVAS_HEIGHT/2)
            mapClick.handled = true
            
            
    
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
        @renderer.render(@gameModel.model, @gameModel.viewport)
        
        @fpsIndicator.text(Math.round(1000 * @frames/(utils.currentTimeMillis() - @startTime)) + " fps")
        if (utils.currentTimeMillis() - @startTime) > 5000
            @startTime = utils.currentTimeMillis()
            @frames = 0
        @frames++       
            
   
controller = new Controller

$(setInterval((-> controller.tick()), constants.MILLIS_PER_TICK));





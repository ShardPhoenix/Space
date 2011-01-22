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
        
        #TODO use a queue of orders for shift-clicking
        @order
        @orderType
        
        @owner = owner
        
    update : (dt) ->
        if @order
            #TODO fix this - don't use fields
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
            
            
        #if @orderType == orders.STOP, do nothing
        

class Planet
    constructor: (coord, radius) ->
        @coord = coord
        @heading = 0.0
        @radius = radius
        @color = colors.randomColor()

class GameModel
    constructor: ->
        #this is the top-left coord of the view in gamespace coordinates
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
    
        #TODO: controls stuff should be in controller, constructing an object with commands in gamespace coords that is passed into here
        
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
            
        if input.keysHeld[keys.S]
            for ship in @model.ships
                if ship.selected
                    ship.order = {targetCoord: {}, orderType: orders.STOP}
            
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

        #mapClick = minimapInput.mouseClicked[mouseButtons.LEFT]
        #if mapClick and !mapClick.handled
        #    @viewport.x = Math.round(mapClick.coord.x * constants.GAME_WIDTH/constants.MINIMAP_WIDTH - constants.CANVAS_WIDTH/2)
        #    @viewport.y = Math.round(mapClick.coord.y * constants.GAME_HEIGHT/constants.MINIMAP_HEIGHT - constants.CANVAS_HEIGHT/2)
        #    mapClick.handled = true
            
    
        ship.update(dt) for ship in @model.ships
        bullet.update(dt) for bullet in @model.bullets
                      
        @model.ships = (ship for ship in @model.ships when ship.state != state.DEAD)     
        @model.bullets = (bullet for bullet in @model.bullets when bullet.state != state.DEAD)
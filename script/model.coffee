###
 Weapon Ideas (Mechwarrior-like combat):
 
 - Rocket (explodes at point)
 - Homing missile & anti-missle guns (or missile swarms)
 - Std. laser
 - Beam laser - closer == more damage
 - Rail gun - high damage at all distances, but dodgeable
 - Weapon weights and sizes to fit slots, affect speed + fuel usage
 - Energy vs. shields, missile vs. hull?
 - location-based damage?
 
 - armor + shield types
 - stealth
 - extra speed
 
 
Also other customization (colors, appearance)

Ideas:
    - Move and shoot with keys, target with mouse (Mech/WoW style)
    - Slots of varying sizes (different per ship model) for weapons, defenses, engines, misc comms + scanning, etc
    - Objects - black holes (dungeons?), stars (recharge), stations (bases/shops), planets (mining?), asteroids, wormholes
    - Players can do stuff with bases they control - scanning, manufacturing, player-owned shop, etc
    - Ships have a cargo limit and ammo has weight etc
    - Metal + energy as resources
    - Ship energy - used to fire, for shields, for fast travel. Like mana.
    
 
###


#TODO: coords should probably be immutable (prevents bugs with passing in mutable coords)


class RocketExplosion
    constructor: (world, coord) ->
        @world = world
        @coord = coord
        @damagePerSecond = 100.0
        @secondsToLive = 2.0
        @radius = 100
        @color = colors.YELLOW
        @state = state.ACTIVE
     
    collided: (ship) ->
        utils.abs(ship.coord.x - @coord.x) < @radius and utils.abs(ship.coord.y - @coord.y) < @radius
     
    update: (dt) ->
        seconds = dt/1000.0
        if @secondsToLive > 0
            for ship in @world.model.ships
                if this.collided(ship)
                    damage = @damagePerSecond * seconds
                    ship.effects.push(
                            {
                                done: false
                                apply: (target) -> 
                                    target.hp -= damage
                                    @done = true
                            })
            @secondsToLive -= seconds
            @radius *= @secondsToLive/2.0
        else
            @state = state.DEAD

class Rocket
    constructor: (world, coord, target) ->
        @distTravelled = 0
        @maxDist = utils.dist(coord, target.coord)
        @damage = 100
        @radius = 100
        @speed = 200.0
        @coord = {x: coord.x, y: coord.y}
        @color = colors.RED
        @width = 10
        @length = 5
        @state = state.ACTIVE
        @world = world
        
        dx = target.coord.x - @coord.x
        dy = target.coord.y - @coord.y
        theta = Math.atan2(dy, dx)
        @heading = utils.radToDeg(theta + Math.PI/2)        
    
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
            @state = state.DEAD
            @world.model.explosions.push(new RocketExplosion(@world, @coord))
                 

class RocketLauncher
    constructor: (world) ->
        @world = world
        @cooldown = 500 #milliseconds
        @bulletClass = Rocket
        @lastFired = utils.currentTimeMillis()
        @targetRange = 400.0
        @ammo = 9999
       
    readyToFire: ->
        (utils.currentTimeMillis() - @lastFired) > @cooldown
        
    inRange: (coord1, coord2) ->
        return utils.dist(coord1, coord2) < @targetRange
       
    tryFire: (coord, target) ->
        if (this.readyToFire() and this.inRange(coord, target.coord) and @ammo > 0)
            @world.model.bullets.push(new @bulletClass(@world, coord, target))
            @lastFired = utils.currentTimeMillis()
            @ammo--
            
            
class PlasmaBolt
    constructor: (coord, target) ->
        @distTravelled = 0
        @maxDist = 1000.0
        @damage = 20
        @radius = 100
        @speed = 400.0
        @coord = {x: coord.x, y: coord.y}
        @target = target
        @color = colors.RED
        @width = 6
        @length = 2
        @state = state.ACTIVE
        
        dx = target.coord.x - coord.x
        dy = target.coord.y - coord.y
        theta = Math.atan2(dy, dx)
        @heading = utils.radToDeg(theta + Math.PI/2)
        
    #TODO: make a proper collision algo (for objs with center coord + width + length) and move to utils
    collided: (coord, target) ->
        measure = if target.length > target.width then target.length else target.width
        return utils.abs(coord.x - target.coord.x) < measure/2 and utils.abs(coord.y - target.coord.y) < measure/2
        
    update: (dt) ->
        if @state == state.ACTIVE
            dist = @speed * dt/1000.0
            theta = utils.degToRad(@heading)
            dx = dist * Math.sin(theta)
            dy = dist * Math.cos(theta)
            @coord.x += dx
            @coord.y -= dy
            @distTravelled += Math.sqrt(dx * dx + dy * dy)
            
            if this.collided(@coord, @target)
                that = this
                @target.effects.push(
                    {
                        done: false
                        apply: (target) -> 
                            target.hp -= that.damage
                            @done = true
                    })
                @state = state.DEAD
            
            if @distTravelled > @maxDist
                @state = state.DEAD

class PlasmaGun
    constructor: (world) ->
        @world = world
        @cooldown = 500 #milliseconds
        @bulletClass = PlasmaBolt
        @lastFired = utils.currentTimeMillis()
        @targetRange = 500.0
       
    readyToFire: ->
        (utils.currentTimeMillis() - @lastFired) > @cooldown
        
    inRange: (coord1, coord2) ->
        return utils.dist(coord1, coord2) < @targetRange
       
    tryFire: (coord, target) ->
        if (this.readyToFire() and this.inRange(coord, target.coord))
            @world.model.bullets.push(new @bulletClass(coord, target))
            @lastFired = utils.currentTimeMillis()
            
class HomingMissile
    constructor: (coord, target) ->
        @target = target #must be a ship
        @damage = 100
        @distTravelled = 0
        @maxDist = 1000.0
        @damage = 100
        @radius = 100
        @speed = 200.0
        @coord = {x: coord.x, y: coord.y}
        @heading = 90.0
        @color = colors.WHITE
        @width = 5
        @length = 5
        
    update: (dt) ->
        if @distTravelled < @maxDist and @target
            dx = @target.coord.x - @coord.x
            dy = @target.coord.y - @coord.y
            theta = Math.atan2(dy, dx)
            @heading = utils.radToDeg(theta)   
            dist = @speed * dt/1000.0         
            dx2 = dist * Math.cos(theta)
            dy2 = dist * Math.sin(theta)
            @coord.x += if utils.abs(dx) > utils.abs(dx2) then dx2 else dx
            @coord.y += if utils.abs(dy) > utils.abs(dy2) then dy2 else dy
            
            #@distTravelled += Math.sqrt(dx * dx + dy * dy)
                       
            if @coord.x == @target.coord.x and @coord.y == @target.coord.y
                that = this
                @target.effects.push(
                    {
                        done: false
                        apply: (target) -> 
                            target.hp -= that.damage
                            @done = true
                    })
                @state = state.DEAD
        else
            @state = state.DEAD
            
class HomingMissileLauncher
    constructor: (world) ->
        @world = world
        @cooldown = 2000 #milliseconds
        @bulletClass = HomingMissile
        @lastFired = utils.currentTimeMillis()
        @targetRange = 500.0
        @ammo = 9999
       
    readyToFire: ->
        (utils.currentTimeMillis() - @lastFired) > @cooldown
        
    inRange: (coord1, coord2) ->
        return utils.dist(coord1, coord2) < @targetRange
       
    tryFire: (coord, target) ->
        if (this.readyToFire() and this.inRange(coord, target.coord) and @ammo > 0)
            @world.model.bullets.push(new @bulletClass(coord, target))
            @lastFired = utils.currentTimeMillis()
            @ammo--

   
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
    constructor: (world, owner, coord, heading) ->
        @world = world
        @hp = 50
        @speed = 300 #pix per second
        @rotSpeed = 180 #degrees per second
        @heading = heading #angle with the positive x-axis
        
        @coord = coord
        @targetCoord = coord
        @width = 40
        @length = 20
        @color = colors.forPlayer(owner)
        @state = state.ACTIVE
        @selected = false
        @targeted = false
        @owner = owner
        
        @plasmaGun = new PlasmaGun(world)
          
        @slots = [new HomingMissileLauncher(world), new RocketLauncher(world), new PlasmaGun(world), new PlasmaGun(world)]
        
        @effects = []
        
        #TODO use a queue of orders for shift-clicking
        @orders = {}      
        
    moveToward: (targetCoord, dt) ->
            dx = targetCoord.x - @coord.x
            dy = targetCoord.y - @coord.y
            theta = Math.atan2(dy, dx)
            
            if utils.abs(dx) > 0 or utils.abs(dy) > 0
                @heading = utils.radToDeg(theta - Math.PI/2)
            
            #$("#debug").text("Heading: #{@heading}")
            
            dist = @speed * dt/1000.0
            
            #TODO: do "magic boxes" or similar instead
            dx2 = dist * Math.cos(theta)
            dy2 = dist * Math.sin(theta)
            @coord.x += if utils.abs(dx) > utils.abs(dx2) then dx2 else dx
            @coord.y += if utils.abs(dy) > utils.abs(dy2) then dy2 else dy
            
            return dist
        
    update : (dt) ->     
        #process externally imposed effects
        if @effects.length > 0
            for effect in @effects
                effect.apply(this, dt)
                
        #reset effects - TODO: may need to change if there are lasting effects
        @effects = (effect for effect in @effects when !effect.done)
    
        #process state-based effects
        if @hp <= 0
            @state = state.DEAD
    
        moveOrder = @orders[orders.MOVE]
        attackTargetOrder = @orders[orders.ATTACK_TARGET]
        shootSlotOrder = @orders[orders.SHOOT_SLOT]
        randomMoveOrder = @orders[orders.RANDOM_MOVE]
        stopOrder = @orders[orders.STOP]
        
        forwardOrder = @orders[orders.ACCEL_FORWARD]  
        backwardOrder = @orders[orders.ACCEL_BACKWARD]
        rotLeftOrder = @orders[orders.ROTATE_LEFT]
        rotRightOrder = @orders[orders.ROTATE_RIGHT]
        
        if forwardOrder
            dist = @speed * dt/1000.0
            theta = utils.degToRad(@heading + Math.PI/2)
            @coord.x -= dist * Math.sin(theta)
            @coord.y += dist * Math.cos(theta)
        if backwardOrder
            dist = @speed * 0.5 * dt/1000.0
            theta = utils.degToRad(@heading + Math.PI/2)
            @coord.x += dist * Math.sin(theta)
            @coord.y -= dist * Math.cos(theta)
        if rotLeftOrder
            @heading -= @rotSpeed * dt/1000.0
        if rotRightOrder
            @heading += @rotSpeed * dt/1000.0
            
        if forwardOrder or backwardOrder or rotLeftOrder or rotRightOrder
            @orders[orders.MOVE] = false
            @orders[orders.ATTACK_TARGET] = false
        
        if stopOrder
            @orders = {} #cancel all orders             
            return #don't do anything else
        
        if moveOrder and (@coord.x != moveOrder.targetCoord.x or @coord.y != moveOrder.targetCoord.y)
            this.moveToward(moveOrder.targetCoord, dt)
            @orders[orders.SHOOT_SLOT] = false
            @orders[orders.ATTACK_TARGET] = false
            
        if attackTargetOrder
            if attackTargetOrder.target and attackTargetOrder.target.state == state.ACTIVE
                if @plasmaGun.targetRange > utils.dist(@coord, attackTargetOrder.target.coord)
                    @plasmaGun.tryFire(@coord, attackTargetOrder.target)
                else
                    this.moveToward(attackTargetOrder.target.coord, dt)
            else
                @orders[orders.ATTACK_TARGET] = false
       
        if shootSlotOrder
            if shootSlotOrder.target and shootSlotOrder.target.state == state.ACTIVE
                anyInRange = false
                for slot in shootSlotOrder.slots
                    if @slots[slot]
                        if @slots[slot].targetRange > utils.dist(@coord, shootSlotOrder.target.coord)
                            anyInRange = true
                            @slots[slot].tryFire(@coord, shootSlotOrder.target)
                            @orders[orders.SHOOT_SLOT] = false
                if !anyInRange
                    this.moveToward(shootSlotOrder.target.coord, dt)
                                
        if randomMoveOrder
            if randomMoveOrder.distTravelled < randomMoveOrder.distToMove
                randomMoveOrder.distTravelled += this.moveToward(randomMoveOrder.targetCoord, dt/4) #go slower
            else
                newCoord = 
                    x: (@coord.x - 100 + Math.round(Math.random() * 200))
                    y: (@coord.y - 100 + Math.round(Math.random() * 200))
                                     
                randomMoveOrder.distTravelled = 0
                randomMoveOrder.distToMove = Math.round(Math.random() * 150) + 75
                randomMoveOrder.targetCoord = newCoord
        

class Planet
    constructor: (coord, radius) ->
        @coord = coord
        @heading = 0.0
        @radius = radius
        @color = colors.randomColor()
        
class Star
    constructor: (coord) ->
        @coord = coord
        @color = colors.WHITE

class GameModel
    constructor: ->
        #this is the top-left coord of the view in gamespace coordinates - this should probably be in Controller
        @viewport = {x: 0, y: 0}
        
        startingShips = for i in [1..constants.NUM_SHIPS]
                            new Ship(this, players.COMPUTER, this.randomCoord(), Math.round(Math.random() * 360.0))
                            
        playerStart = this.randomCoord()
        thePlayerShip = new Ship(this, players.HUMAN, playerStart, Math.round(Math.random() * 360.0))
        thePlayerShip.selected = true
        startingShips.push thePlayerShip         
        
        @viewport = {x: playerStart.x - constants.CANVAS_WIDTH/2, y: playerStart.y - constants.CANVAS_HEIGHT/2}
            
        #start computer ships moving randomly
        for ship in startingShips
           if ship.owner == players.COMPUTER
               ship.orders[orders.RANDOM_MOVE] = {orderType: orders.RANDOM_MOVE, targetCoord: this.randomCoord(), distToMove: Math.round(Math.random() * 100) + 50, distTravelled: 0}
    
        @model =
            ships: startingShips
            playerShip : thePlayerShip
            planets:
                for i in [1..constants.NUM_PLANETS]
                    new Planet(this.randomCoord(), 20 + Math.round(Math.random() * 100))
            bullets: []
            explosions: []
               # for i in [1..constants.NUM_SHIPS]
                    #new HomingMissile(this.randomCoord(), 0.0, startingShips[i-1])
            stars: for i in [1..constants.NUM_STARS]
                        new Star(this.randomCoord())
        

        ###
        for ship in @model.ships
            ship.effects.push({
                done: false
                apply: (target) -> 
                    target.color = colors.randomColor()
                    @done = true
            })
        ###
     
    randomCoord: ->
        {x: Math.round(Math.random() * constants.GAME_WIDTH), y: Math.round(Math.random() * constants.GAME_HEIGHT)}
     
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
            if @viewport.x > (constants.GAME_WIDTH - constants.CANVAS_WIDTH) then @viewport.x = (constants.GAME_WIDTH - constants.CANVAS_WIDTH)
            
        if input.keysHeld[keys.UP]
            @viewport.y -= Math.round(constants.KEY_SCROLL_RATE * dt/1000.0)
            if @viewport.y < 0 then @viewport.y = 0
        if input.keysHeld[keys.DOWN]
            @viewport.y += Math.round(constants.KEY_SCROLL_RATE * dt/1000.0)
            if @viewport.y > (constants.GAME_HEIGHT - constants.CANVAS_HEIGHT) then @viewport.y = (constants.GAME_HEIGHT - constants.CANVAS_HEIGHT)
            
                       
        @model.playerShip.orders[orders.ACCEL_FORWARD] = input.keysHeld[keys.W]           
        @model.playerShip.orders[orders.ACCEL_BACKWARD] = input.keysHeld[keys.S]           
        @model.playerShip.orders[orders.ROTATE_LEFT] = input.keysHeld[keys.A]        
        @model.playerShip.orders[orders.ROTATE_RIGHT] = input.keysHeld[keys.D]
        
        if input.keysHeld[keys.W] or input.keysHeld[keys.S] or input.keysHeld[keys.A] or input.keysHeld[keys.D]
            @viewport = {x: @model.playerShip.coord.x - constants.CANVAS_WIDTH/2, y: @model.playerShip.coord.y - constants.CANVAS_HEIGHT/2}
            
        if input.keysHeld[keys.Q] or input.keysHeld[keys.E] or input.keysHeld[keys.R] or input.keysHeld[keys.F] #handle as slot attack
            target = null
            targeted = (ship for ship in @model.ships when ship.targeted)
            selected = (ship for ship in @model.ships when ship.selected)
            
            #for ship in @model.ships when ship.owner == players.COMPUTER
            #    measure = if ship.length > ship.width then ship.length else ship.width
            #    if utils.abs(realCoord.x - ship.coord.x) < measure/2 and utils.abs(realCoord.y - ship.coord.y) < measure/2
            #        target = ship
            
            #shoot at closest target
            if targeted.length > 0
                bestDistance = utils.dist(targeted[0].coord, @model.playerShip.coord)
                target = targeted[0]
                for ship in targeted
                    distance = utils.dist(ship.coord, @model.playerShip.coord)
                    if distance < bestDistance
                        target = ship
                        bestDistance = distance
                for ship in selected
                    ship.orders[orders.SHOOT_SLOT] = {target: target, slots: utils.getSlots(), orderType: orders.SHOOT_SLOT}

        rightClick = input.mouseClicked[mouseButtons.RIGHT]
        if rightClick? and !rightClick.handled
            target = null
            realCoord = this.gameCoord(rightClick.coord)
            selected = (ship for ship in @model.ships when ship.selected)
            for ship in @model.ships when ship.owner == players.COMPUTER
                measure = if ship.length > ship.width then ship.length else ship.width
                if utils.abs(realCoord.x - ship.coord.x) < measure/2 and utils.abs(realCoord.y - ship.coord.y) < measure/2
                    target = ship  
            if target?
                for ship in selected
                    ship.orders[orders.ATTACK_TARGET] = {target: target, orderType: orders.ATTACK_TARGET}
            else
                for ship in selected
                    ship.orders[orders.MOVE] = {targetCoord: realCoord, orderType: orders.MOVE}
            rightClick.handled = true
            
        #if input.keysHeld[keys.S]
        #    for ship in @model.ships
        #       if ship.selected
        #            ship.orders[orders.STOP] = {targetCoord: {}, orderType: orders.STOP}
            
        leftClick = input.mouseClicked[mouseButtons.LEFT]
        if leftClick? and !leftClick.handled
            realCoord = this.gameCoord(leftClick.coord)
            
            if input.keysHeld[keys.TODO_NEW_ATTACK_KEY] #handle as an attack
                target = null
                selected = (ship for ship in @model.ships when ship.selected)
                for ship in @model.ships when ship.owner == players.COMPUTER
                    measure = if ship.length > ship.width then ship.length else ship.width
                    if utils.abs(realCoord.x - ship.coord.x) < measure/2 and utils.abs(realCoord.y - ship.coord.y) < measure/2
                        target = ship
                if target?
                    for ship in selected
                        ship.orders[orders.ATTACK_TARGET] = {target: target, orderType: orders.ATTACK_TARGET}
                else
                    for ship in selected
                        ship.orders[orders.ATTACK_AREA] = {targetCoord: realCoord, orderType: orders.ATTACK_AREA}
                                              
                       
            else #handle as a select
                toBeSelected = null
                toBeTargeted = null
                for ship in @model.ships
                    measure = if ship.length > ship.width then ship.length else ship.width
                    if utils.abs(realCoord.x - ship.coord.x) < measure/2 and utils.abs(realCoord.y - ship.coord.y) < measure/2
                        if ship.owner == players.HUMAN
                            toBeSelected = ship
                        else
                            toBeTargeted = ship
                if toBeSelected?
                    ship.selected = false for ship in @model.ships
                    toBeSelected.selected = true
                if toBeTargeted?
                    ship.targeted = false for ship in @model.ships
                    toBeTargeted.targeted = true
                    
            leftClick.handled = true
    
        if !input.selectBox.handled
            toBeSelected = []
            for ship in @model.ships
                if input.isInBox({x: ship.coord.x - @viewport.x, y: ship.coord.y - @viewport.y})
                    if ship.owner == players.HUMAN
                        toBeSelected.push(ship)
                    else 
                        ship.targeted = true
            if toBeSelected.length > 0
                for ship in @model.ships
                    ship.selected = ship in toBeSelected
            input.selectBox.handled = true
            
            
        #TODO: need to better handle drags that start on minimap and go off, and don't draw minimap going off edge    
        mapDrag = minimapInput.mouseHeld[mouseButtons.LEFT]
        if mapDrag
            @viewport.x = Math.round(mapDrag.x * constants.GAME_WIDTH/constants.MINIMAP_WIDTH - constants.CANVAS_WIDTH/2)
            @viewport.y = Math.round(mapDrag.y * constants.GAME_HEIGHT/constants.MINIMAP_HEIGHT - constants.CANVAS_HEIGHT/2)
            #don't go off edge of map
            if @viewport.x < 0
                @viewport.x = 0
            else if @viewport.x > constants.GAME_WIDTH - constants.CANVAS_WIDTH
                @viewport.x = constants.GAME_WIDTH - constants.CANVAS_WIDTH
            if @viewport.y < 0
                @viewport.y = 0
            else if @viewport.y > constants.GAME_HEIGHT - constants.CANVAS_HEIGHT
                @viewport.y = constants.GAME_HEIGHT - constants.CANVAS_HEIGHT
            
    
        ship.update(dt) for ship in @model.ships
        bullet.update(dt) for bullet in @model.bullets
        explosion.update(dt) for explosion in @model.explosions
                      
        @model.ships = (ship for ship in @model.ships when ship.state != state.DEAD)
        @model.bullets = (bullet for bullet in @model.bullets when bullet.state != state.DEAD)
        @model.explosions = (explosion for explosion in @model.explosions when explosion.state != state.DEAD)
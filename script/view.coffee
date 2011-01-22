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
            @minimap.fillStyle = colors.WHITE #planet.color
            @minimap.fillRect(planet.coord.x * (constants.MINIMAP_WIDTH/constants.GAME_WIDTH), planet.coord.y * (constants.MINIMAP_HEIGHT/constants.GAME_HEIGHT), 3, 3)
        
        for ship in model.ships
            @minimap.fillStyle = ship.color
            @minimap.fillRect(ship.coord.x * (constants.MINIMAP_WIDTH/constants.GAME_WIDTH), ship.coord.y * (constants.MINIMAP_HEIGHT/constants.GAME_HEIGHT), 2, 2)
            
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
            boxY = leftDrag.y - (constants.CANVAS_HEIGHT/constants.GAME_HEIGHT * constants.MINIMAP_WIDTH)/2 + 7 #TODO why is the +7 necessary to stop jumping?
        
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

constants =
    WIDTH: 1024
    HEIGHT: 768
    MILLIS_PER_TICK: 30
    
keys =
    LEFT: 37
    UP: 38
    RIGHT: 39
    DOWN: 40
    
input =
    keysHeld: []

class Renderer
    constructor: ->
        @ctx = document.getElementById("canvas").getContext("2d");

    drawRect: (x, y, width, height, color) ->
        @ctx.fillStyle = color
        @ctx.fillRect(x, y, width, height)
        
    clear: ->
        this.drawRect(0, 0, constants.WIDTH, constants.HEIGHT, "rgba(255,255,255,1.0)")
    
    render: (model) ->
        this.clear()
        @ctx.save()
        @ctx.translate(model.player.pos[0], model.player.pos[1])
        @ctx.rotate(0.0174532925 * model.player.heading)
        this.drawRect(-model.player.width/2, -model.player.length/2, model.player.width, model.player.length, "rgba(255,0,0,1.0)")
        @ctx.restore()

class Player
    constructor: ->
        @hp = 100
        @heading = 135.0 # degrees, up = 0
        @pos = [200, 200] # x, y
        @speed = 3.0
        @rot_speed = 90.0 #degrees per second
        @width = 20
        @length = 40
        
    update: ->
        #TODO: do these in terms of time instead of frame
        if input.keysHeld[keys.UP]
            theta = 0.0174532925 * @heading
            @pos[0] += @speed * Math.sin(theta)
            @pos[1] -= @speed * Math.cos(theta)
            
        if input.keysHeld[keys.LEFT]
            @heading -= 5.0
        if input.keysHeld[keys.RIGHT]
            @heading += 5.0
        
        
class Model
    constructor: ->
        @player = new Player

    update: ->
        @player.update()
        


class Controller
    constructor: ->
        @model = new Model
        @renderer = new Renderer

    tick: ->
        @model.update()
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





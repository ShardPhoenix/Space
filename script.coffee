
constants =
    WIDTH: 800
    HEIGHT: 600

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
        #this.drawRect(Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100, "rgba(255,0,0,1.0)")
        

class GameModel
    update: ->


class GameController
    constructor: ->
        @gameModel = new GameModel
        @renderer = new Renderer

    tick: ->
        @gameModel.update()
        @renderer.render(null)
            

           
gameController = new GameController

gameTick = () ->
    gameController.tick()

window.onload = () ->
    setInterval(gameTick, 30);





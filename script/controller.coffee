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

$("#minimap").mousedown((event) ->
    event.preventDefault()
    event.stopPropagation()
    minimapInput.xOffset = this.offsetLeft
    minimapInput.yOffset = this.offsetTop
    minimapInput.mouseHeld[event.button] = {x: event.clientX - minimapInput.xOffset, y: event.clientY - minimapInput.yOffset})
    
#we only care about the current mouse position for the minimap, so adjust as we drag
$("#minimap").mousemove((event) ->
    if minimapInput.mouseHeld[event.button]
        minimapInput.mouseHeld[event.button].x = event.clientX - minimapInput.xOffset
        minimapInput.mouseHeld[event.button].y = event.clientY - minimapInput.yOffset
)
   
$("#minimap").mouseup((event) ->
    minimapInput.mouseHeld[event.button] = false
)
    
$("#minimap").click((event) ->
    minimapInput.mouseClicked[event.button] = 
        coord: 
            x: event.clientX - minimapInput.xOffset
            y: event.clientY - minimapInput.yOffset
        handled: false
    )
    
#figure out where canvas is relative to the window
$("#canvas").mousedown((event) ->
    input.xOffset = this.offsetLeft
    input.yOffset = this.offsetTop)
   
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
                x: upX
                y: upY
            handled: false
    
    $("#debug").text("Mouse button #{event.button} up at: #{event.clientX} left #{event.clientY} down"))


class Controller
    constructor: ->
        @gameModel = new GameModel
        @renderer = new Renderer
        @lastTime = (new Date).getTime()
        @frames = 0
        @startTime = utils.currentTimeMillis()
        @fpsIndicator = $("#fps")

    tick: ->
        time = (new Date()).getTime();
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





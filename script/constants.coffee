constants =
    CANVAS_WIDTH: 1024
    CANVAS_HEIGHT: 768
    MINIMAP_WIDTH: 384
    MINIMAP_HEIGHT: 288
    GAME_WIDTH: 7500
    GAME_HEIGHT: 7500
    MILLIS_PER_TICK: 20
    KEY_SCROLL_RATE: 600 #pix per second
    VIEWPORT_MARGIN: 200 #rendering margin in pixels
    NUM_SHIPS: 250
    NUM_PLANETS: 25
    NUM_STARS: 1500
    
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
    SHIFT: 16
    S: 83
    A: 65
    Q: 81
    W: 87
    E: 69
    R: 82
    
colors =
    RED: "rgba(255,0,0,1.0)"
    BLUE: "rgba(0,0,255,1.0)"
    GREEN: "rgba(0,255,0,1.0)"
    WHITE: "rgba(255,255,255,1.0)"
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
    ATTACK_TARGET: 1
    ATTACK_AREA: 2
    STOP : 3
    SHOOT_SLOT_1: 4
    
mouseButtons =
    LEFT: 0
    RIGHT: 2
    WHEEL: 1
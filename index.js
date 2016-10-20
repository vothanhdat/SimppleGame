function createImage(src) {
    var image = new Image()
    image.src = src
    return image
}


var GAMESTATE = {
    PLAYING : 0,
    PAUSE : 1,
    OVER : 2,
    NEW : 3,    
}

class Game {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} context
     */
    constructor(canvas, context) {
        this.mainloop = this.mainloop.bind(this)
        this.createTreeLoop = this.createTreeLoop.bind(this)
        this.canvas = canvas;
        this.context = context;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        /**
         * @type {Array<GameOb>}
         */
        this.listOb = [];
        this.slideX = 0;
        this.slideXv = 10;

        this.player = new Dinosaur(this)
        this.ground = new GameGround(this)

        this.state = GAMESTATE.NEW

    }

    start() {
        this.listOb = [];
        this.slideX = 0;
        this.slideXv = 10;

        this.player = new Dinosaur(this)
        this.ground = new GameGround(this)

        this.mainloop();
        this.createTreeLoop();
    }
    playingloop(){
        this.slideX += this.slideXv * 0.3;
        this.slideXv += 0.01;


        this.player.process()
        for (var e of this.listOb)
            e.process()

        this.listOb = this.listOb.filter(e => !e.isdelete)



    }
    mainloop() {

        this.context.fillStyle = '#fff';
        this.context.clearRect(0, 0, this.width, this.height);


        // switch(this.state){
        //     case GAMESTATE.PLAYING : 

        //         break;
        //     case GAMESTATE.NEW:

        //         break;
        // }
        this.playingloop()


        this.context.save()
        this.context.translate(-this.slideX, 0)

        this.ground.render(this.context)
        this.player.render(this.context);

        for (var e of this.listOb) {
            e.render(this.context)
        }

        this.context.restore()


        window.requestAnimationFrame(this.mainloop)
    }

    createTreeLoop() {
        var newTree = new Tree(this.slideX + this.width + 40, 40, this)

        this.listOb.push(newTree)

        setTimeout(this.createTreeLoop, (Math.random() + 0.5) * 2000 /(this.slideXv * 0.1))
    }

    onGameOver(){

    }
}


var GameGroundImage = createImage('ground.png')

class GameGround {
    /**
     * @param {Game} parent
     */
    constructor(parent){
        this.parent = parent
    }
    process(){}
    
    /**
     * @param {CanvasRenderingContext2D} context
     */
    render(context){
        var slidex = this.parent.slideX;
        var width = GameGroundImage.width || 100;
        context.drawImage(GameGroundImage,(slidex / width | 0) * width,this.parent.height - 35)
        context.drawImage(GameGroundImage,(slidex / width | 0) * width + width,this.parent.height - 35)
    }
}



class GameOb {
    /**
     * @param {HTMLImageElement} image
     * @param {Number} width
     * @param {Number} height
     * @param {Number} x
     * @param {Number} y
     * @param {Game} parent
     */
    constructor(image, x, y, width, height, parent) {
        this.image = image;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.parent = parent
        this.isdelete = false;

    }

    /**
     * @param {CanvasRenderingContext2D} context
     */
    render(context) {
        context.save()
        context.translate(this.x,this.y)
        this.beforerender(context)
        context.drawImage(this.image, 0, 0, this.width, this.height)
        this.afterrender(context)
        context.restore()
    }


    beforerender(context) { }

    afterrender(context) { }

    process() { }
    delete() {
        this.isdelete = true
    }
}

var TreeImage = createImage('dinosaur.png')

class Tree extends GameOb {
    /**
     * @param {Game} parent
     */
    constructor(x, size, parent) {
        super(TreeImage, x, parent.height - size - 20, size, size, parent);
    }

    process() {
        if (this.x + 30 < this.parent.slideX)
            this.delete()

        var player = this.parent.player;


        if(Math.abs(player.x - this.x) < 20 && Math.abs(player.y - this.y) < 20 ){
            this.parent.onGameOver()
        }
    }
}

var DinosaurImage = createImage('dinosaur.png')

class Dinosaur extends GameOb {
    constructor(parent) {
        super(DinosaurImage, 0, parent.height - 40 - 20, 40, 40, parent);
        window.addEventListener('keydown',this.onKeyDown.bind(this))
        window.addEventListener('keyup',this.onKeyUp.bind(this))


        this.x = this.parent.slideX + 100;
        this.vy = 0;
        this.inground = true;

        this.keySpace = false;
        this.keySpaceTime = 0;
    }
    /**
     * @param {KeyboardEvent} e
     */
    onKeyDown(e){
        if(e.key == ' ' && !this.keySpace && this.inground){
            this.keySpace = true
            this.keySpaceTime = Date.now()
            this.onJump(10)
        }
    }
    /**
     * @param {KeyboardEvent} e
     */
    onKeyUp(e){
        if(e.key == ' ' && this.keySpace){
            this.keySpace = false;
        }
    }
    onJump(power){
        this.vy -= power;
        this.inground = false;
    }
    process() {
        this.x = this.parent.slideX + 100;
        
        this.y += this.vy;
        this.vy += 1.3;

        if(this.keySpace){
            var deltaTime = Date.now() - this.keySpaceTime
            if(deltaTime < 350)
                this.onJump(Math.sqrt((350 - deltaTime) / 350));
        }

        if(this.y >= this.parent.height - 60){
            this.y = this.parent.height - 60;
            this.inground = true;
            this.vy = 0;
        }
    }
    /**
     * @param {CanvasRenderingContext2D} context
     */
    beforerender(context){
        context.scale(-1,1)
    }
}



window.addEventListener('load', function () {

    var canvas = document.createElement('canvas');

    canvas.width = 800;
    canvas.height = 400;

    var context2D = canvas.getContext('2d')
    document.body.appendChild(canvas);


    var newGame = new Game(canvas, context2D)

    newGame.start()


})

var GameGroundImage = createImage('ground.png')
var TreeImage = createImage('catus.png')
var BirdImage = createImage('bird.png')
var DinosaurImage = createImage('dinosaur.png')


function createImage(src) {
    var image = new Image()
    image.src = src
    return image
}


var GAMESTATE = {
    PLAYING: 0,
    PAUSE: 1,
    OVER: 2,
    NEW: 3,
}

class GameObjectGenerator {
    /**
     * @param {Game} parent
     */
    constructor(parent) {
        this.remainToAddTree = 0;
        this.totalToAddBird = 0;
        this.remainToAddBird = 0;
    }
    process(delta) {
        var list = []
        if (this.remainToAddTree <= 0) {
            list.push('tree')
            this.remainToAddTree = (Math.random() + 0.2) * 300
        } else {
            this.remainToAddTree -= delta
        }

        if(this.totalToAddBird > 800){
            if (this.remainToAddBird <= 0) {
                list.push('bird')
                this.remainToAddBird = (Math.random() + 0.2) * 300
            } else {
                this.remainToAddBird -= delta
            }
        }else{
            this.totalToAddBird += delta;
        }

        return list
    }
}


class GameHuB {
    /**
    * @param {Game} parent
    */
    constructor(parent) {
        this.parent = parent;
        this.score = 0;
        this.bestScore = localStorage.getItem('bestscore') || 0
    }

    process() {
        var parent = this.parent

        this.score = 10 * ((parent.slideX / 300) | 0)

        if(this.score > this.bestScore){
            this.bestScore = this.score
            localStorage.setItem("bestscore", this.bestScore)
        }
    }

    /**
     * @param {CanvasRenderingContext2D} context
     */
    render(context) {
        var parent = this.parent
        var {width, height,stateTime} = this.parent

        context.fillStyle = '#000'


        switch (parent.state) {
            case GAMESTATE.PAUSE:
            case GAMESTATE.PLAYING:

                this.renderScore(context);
                this.renderHighScode(context);

                break;
            case GAMESTATE.NEW:

                context.font = "25px serif";
                context.textAlign = "center";
                context.fillText("Press space to play new game!", width / 2, height * 0.35);
                this.renderHighScode(context);

                break;
            case GAMESTATE.OVER:

                this.renderScore(context);
                this.renderHighScode(context);

                var fontSize = Math.min(30,stateTime * 0.2)

                context.font = fontSize + "px serif";
                context.textAlign = "center"
                context.fillText("GAME OVER ", width / 2, height * 0.45);

                break;
        }

    }

    /**
     * @param {CanvasRenderingContext2D} context
     */
    renderScore(context) {
        var {width, height} = this.parent
        context.font = "48px serif";
        context.textAlign = "center"
        context.fillText(this.score, width / 2, height / 4);

    }

    /**
     * @param {CanvasRenderingContext2D} context
     */
    renderHighScode(context) {
        var {width, height} = this.parent
        context.font = "20px serif";
        context.textAlign = "left"
        context.fillText("BEST : " + this.bestScore, 20, 30);
    }
}

class Game {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} context
     */
    constructor(canvas, context) {
        this.mainloop = this.mainloop.bind(this)
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

        this.gameHub = new GameHuB(this)
        this.player = new Dinosaur(this)
        this.ground = new GameGround(this)
        // this.objectgenerator = new GameObjectGenerator(this)

        this.state = GAMESTATE.NEW
        this.stateTime = 0


        window.addEventListener('keydown', this.onKeyDown.bind(this))

        this.mainloop();
    }

    set state(value) {
        this._state = value
        this.stateTime = 0
    }

    get state() {
        return this._state;
    }

    start() {
        console.log("onGame Start", this.slideXv)

        this.listOb = [];
        this.slideX = 0;
        this.slideXv = 10;

        this.player = new Dinosaur(this)
        this.ground = new GameGround(this)
        this.objectgenerator = new GameObjectGenerator(this)


        this.state = GAMESTATE.PLAYING
    }

    playingloop() {
        this.slideX += this.slideXv * 0.3;
        this.slideXv += 0.01;


        this.player.process()
        for (var e of this.listOb)
            e.process()

        this.listOb = this.listOb.filter(e => !e.isdelete)

        var list = this.objectgenerator.process(Math.sqrt(this.slideXv * 0.3))

        for (var type of list) {
            switch (type) {
                case 'tree':
                    this.listOb.push(new Tree(this.slideX + this.width + 40, 40, this))
                    if(Math.random() < 0.5)
                        this.listOb.push(new Tree(this.slideX + this.width + 60, 30, this))
                    if(Math.random() < 0.5)
                        this.listOb.push(new Tree(this.slideX + this.width + 25, 25, this))                        
                    break;
                case 'bird':
                    this.listOb.push(new Bird(this.slideX + this.width + 40, 40, this))
                    break;
            }
            
        }

    }

    mainloop(timestamp) {

        var deltatime = timestamp - (this.__start || 0);
        this.__start = timestamp;

        this.stateTime += (deltatime || 0)

        switch (this.state) {
            case GAMESTATE.PLAYING:
                this.playingloop()
                break;
            case GAMESTATE.NEW:

                break;
        }


        this.gameHub.process()


        this.context.fillStyle = '#fff';
        this.context.clearRect(0, 0, this.width, this.height);


        this.context.save()
        this.context.translate(-this.slideX, 0)



        this.ground.render(this.context)
        this.player.render(this.context);

        for (var e of this.listOb) {
            e.render(this.context)
        }

        this.context.restore()

        this.gameHub.render(this.context)


        window.requestAnimationFrame(this.mainloop)
    }


    onGameOver() {
        this.state = GAMESTATE.OVER;
    }
    onGamePause() {
        this.state = GAMESTATE.PAUSE;
    }
    onGameResume() {
        this.state = GAMESTATE.PLAYING;
    }
    /**  @param {KeyboardEvent} e */
    onKeyDown(e) {
        switch (this.state) {
            case GAMESTATE.OVER:
                if(this.stateTime <= 500)
                    break;
            case GAMESTATE.NEW:
                if (e.key == ' ')
                    this.start()
                break;
            case GAMESTATE.PAUSE:
                if (e.key == ' ')
                    this.onGameResume()
                break;
            case GAMESTATE.PLAYING:
                //ESC key press down
                if (e.keyCode == 27)
                    this.onGamePause()
                break;
        }
    }


}



class GameGround {
    /**
     * @param {Game} parent
     */
    constructor(parent) {
        this.parent = parent
    }
    process() { }

    /**`
     * @param {CanvasRenderingContext2D} context
     */
    render(context) {
        var slidex = this.parent.slideX;
        var width = GameGroundImage.width || 100;
        context.drawImage(GameGroundImage, (slidex / width | 0) * width, this.parent.height - 55)
        context.drawImage(GameGroundImage, (slidex / width | 0) * width + width, this.parent.height - 55)
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
    constructor(image, x, y, width, height, parent,framenumber = 1) {
        this.image = image;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.parent = parent
        this.isdelete = false;

        this.framenumber = framenumber

        this.nowframe = 0
        this.frameStep = 1
    }

    /**
     * @param {CanvasRenderingContext2D} context
     */
    render(context) {
        context.save()
        context.translate(this.x, this.y)
        this.beforerender(context)

        if(this.framenumber > 1){
            var frameIndex = Math.floor((this.nowframe % 30) / 30 * this.framenumber)
            var offsetWidth = Math.floor(this.image.width / this.framenumber)
            var offsetHeight= this.image.height

            context.drawImage(this.image, 
                frameIndex * offsetWidth,0,offsetWidth,offsetHeight,
                -this.width / 2, -this.height / 2, this.width, this.height
            )
        }else{
            context.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height)
        }

        this.afterrender(context)
        context.restore()
    }


    beforerender(context) { }

    afterrender(context) { }

    process() { 
        this.nowframe += this.frameStep
    }
    delete() {
        this.isdelete = true
    }
}


class Tree extends GameOb {
    /**
     * @param {Game} parent
     */
    constructor(x, size, parent) {
        super(TreeImage, x, parent.height - size / 2 - 40, size / 2, size, parent);
    }

    process() {
        if (this.x + 30 < this.parent.slideX)
            this.delete()

        var player = this.parent.player;


        if (Math.abs(player.x - this.x) < 10 && Math.abs(player.y - this.y) < 10) {
            this.parent.onGameOver()
        }
    }
}

class Bird extends GameOb {
    /**
     * @param {Game} parent
     */
    constructor(x, size, parent) {
        super(BirdImage, x, parent.height * (Math.random() * 0.3 + 0.3), size, size, parent,2);
        this.vx = Math.random() * 3 + 2;

    }

    process() {
        this.x -= this.vx;

        if (this.x + 30 < this.parent.slideX)
            this.delete()

        var player = this.parent.player;

        if (Math.abs(player.x - this.x) < 10 && Math.abs(player.y - this.y) < 10) {
            this.parent.onGameOver()
        }
        super.process()
    }
}


class Dinosaur extends GameOb {
    constructor(parent) {
        super(DinosaurImage, 0, parent.height - 40 - 20, 40, 40, parent,3);
        window.addEventListener('keydown', this.onKeyDown.bind(this))
        window.addEventListener('keyup', this.onKeyUp.bind(this))


        this.x = this.parent.slideX + 100;
        this.vy = 0;
        this.inground = true;

        this.keySpace = false;
        this.keySpaceTime = 0;

        this.frameStep = 2
    }
    /**
     * @param {KeyboardEvent} e
     */
    onKeyDown(e) {
        if (e.key == ' ' && !this.keySpace && this.inground) {
            this.keySpace = true
            this.keySpaceTime = Date.now()
            this.onJump(10)
        }
    }
    /**
     * @param {KeyboardEvent} e
     */
    onKeyUp(e) {
        if (e.key == ' ' && this.keySpace) {
            this.keySpace = false;
        }
    }
    onJump(power) {
        this.vy -= power;
        this.inground = false;
    }
    process() {
        this.x = this.parent.slideX + 100;

        this.y += this.vy;
        this.vy += 1.3;

        if (this.keySpace) {
            var deltaTime = Date.now() - this.keySpaceTime
            if (deltaTime < 350)
                this.onJump(Math.sqrt((350 - deltaTime) / 350));
        }

        if (this.y >= this.parent.height - 60) {
            this.y = this.parent.height - 60;
            this.inground = true;
            this.vy = 0;
        }
        super.process()
    }
}


window.addEventListener('load', function () {

    var canvas = document.createElement('canvas');

    canvas.width = 600;
    canvas.height = 200;

    var context2D = canvas.getContext('2d')
    document.body.appendChild(canvas);


    var newGame = new Game(canvas, context2D)

})

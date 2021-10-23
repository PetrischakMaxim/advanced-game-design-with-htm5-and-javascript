import {game} from "../../library/engine.js";

//Initialize the game engine and load all the assets
let gameSize = 512;
let g = game(
    gameSize, gameSize, setup,
    [
        "images/bloxyee.json",
        "sounds/bounce.wav",
        "sounds/music.wav",
        "fonts/puzzler.otf"
    ],
    load
);

const {canvas, progressBar, assets, sprite, slide, stage} = g;

//Start the engine
g.start();

//Scale and center the game
g.scaleToWindow();

//Optionally re-scale the canvas if the browser window is changed
window.addEventListener("resize", () => {
    g.scaleToWindow("#000");
});

//Game variables
let paddle, ball, topBorder, blocks, blockFrames,
    music, bounceSound, message, titleMessage,

    //game offsets
    gameOffset = gameSize + 2,
    topOffset = 32,

    //ball speed
    ballSpeed = 6,

    //The size of the grid of blocks
    gridWidth = 8,
    gridHeight = 3,
    cellWidth = 64,
    cellHeight = 64,

    //title sprites
    title, playButton,

    //Groups
    titleScene, gameScene,

    //Score
    score = 0,

    //Other
    font = "20px puzzler",
    fps = 30,
    easing = ["decelerationCubed"],

    //The paddle wobble tween
    paddleWobble;

function changeScene() {
    slide(titleScene, gameOffset, 0, fps, easing);
    slide(gameScene, 0, 0, fps, easing);
}

function setBallVelocity(vx = ballSpeed, vy = Math.floor(ballSpeed * 0.75)) {
    ball.vx = vx;
    ball.vy = vy;
}

function plotBlocks() {
    blocks = g.grid(
        gridWidth, gridHeight, cellWidth, cellHeight,
        false, 0, 0,
        () => {
            //Choose a random block from the`blockFrames` array for each grid cell
            let randomBlock = g.randomInt(0, blockFrames.length - 1);
            return sprite(assets[blockFrames[randomBlock]]);
        }
    );
}

function load() {
    //Display the loading progress bar while the game assets load
    progressBar.create(canvas, assets);
    progressBar.update();
}

function setup() {
    //Remove the progress bar
    progressBar.remove();

    //Sound and music
    bounceSound = assets["sounds/bounce.wav"];
    music = assets["sounds/music.wav"];
    music.loop = true;

    //Create the sprites
    //1. The `titleScene` sprites

    //The `title`
    title = sprite(assets["title.png"]);

    //The play button
    playButton = g.button([
        assets["up.png"],
        assets["over.png"],
        assets["down.png"]
    ]);

    //Set the `playButton`'s x property to g so that
    //it's offscreen when the sprite is created
    playButton.x = 100;
    playButton.y = 350;

    //Set the `titleMessage` x position to -200 so that it's offscreen
    titleMessage = g.text("start game", font, "violet", -200, 300);

    //Make the `playButton` and `titleMessage` slide in from the
    //edges of the screen using the `slide` function
    slide(playButton, 250, 350, fps, easing, true);
    slide(titleMessage, 250, 300, fps, easing);

    //Create the `titleScene` group
    titleScene = g.group(title, playButton, titleMessage);

    //2. The `gameScene` sprites

    //The paddle
    paddle = sprite(assets["paddle.png"]);
    stage.putBottom(paddle, 0, -24);

    //The ball
    ball = sprite(assets["ball.png"]);
    stage.putBottom(ball, 0, -128);

    //Set the ball's initial velocity
    setBallVelocity();

    //Add a black border along the top of the screen
    topBorder = g.rectangle(gameSize, topOffset, "black");

    //Plot the blocks
    //First create an array that stores references to all the
    //blocks frames in the texture atlas
    blockFrames = [
        "blue.png",
        "green.png",
        "orange.png",
        "red.png",
        "violet.png"
    ];

    //Use the `grid` function to randomly plot the
    //blocks in a grid pattern
    plotBlocks();

    //Position the blocks topOffset pixels below the top of the canvas
    blocks.y = topOffset;

    //A text sprite for the score
    message = g.text("Score", font, "violet");
    message.x = 8;
    message.y = 8;

    //Add the game sprites to the `gameScene` group
    gameScene = g.group(paddle, ball, topBorder, blocks, message);

    //Position the `gameScene` offscreen at gameOffset *-1 so that its
    //not visible when the game starts
    gameScene.x = gameOffset * -1;

    //Program the play button's `press` function to start the game.
    //Start the music, set the `state` to `play`
    //make `titleScene` slide out to the right and
    //the `gameScene` slide in from the left
    playButton.press = () => {
        if (!music.playing) music.play();
        g.state = play;
        changeScene();
    };
}

//The `play` function contains all the game logic and runs in a loop

function play() {

    //Move the paddle to the mouse's position
    paddle.x = g.pointer.x - paddle.halfWidth;

    //Keep the paddle within the screen boundaries
    g.contain(paddle, stage.localBounds);

    //Move the ball
    g.move(ball);

    //Bounce the ball off the screen edges. Use the `contain` method
    //with a custom `bounds` object (the second argument) that defines
    //the area that the ball should bounce around in.
    //Play the bounceSound when the ball hits one of these edges,
    //and reduce the score by one if it hits the ground

    function ballHitsWall() {
        g.contain(
            ball,
            {x: 0, y: topOffset, width: stage.width, height: stage.height},
            true,

            //what should happen when the ball hits the edges of the boundary?
            (collision) => {

                //Play the bounce sound
                bounceSound.play();

                //If the ball hits the bottom, perform these additional tasks:
                if (collision === "bottom") {
                    //Subtract 1 from the score
                    score -= 1;

                    //Shake the screen (the `gameScene` sprite)
                    g.shake(gameScene, 5);
                }
            }
        );
    }

    ballHitsWall();

    /*
    Check for a collision between the ball and the paddle, and
    bounce the ball off the paddle. Play the `bounceSound` when
    the collision occurs.
    You can use the universal `hit` collision function to do this.
    `hit` arguments:
    spriteA, spriteB, reactToCollision?, bounce?, useGlobalCoordinates?
    actionWhenCollisionOccurs
    */

    function ballHitsPaddle() {
        g.hit(
            ball, paddle, true, true, true,
            () => {

                //1. Play the bounce sound
                bounceSound.play();

                //2. Make the paddle wobble when the ball hits it.

                //a. Remove any possible previous instances of the
                //`paddleWobble` tween, and reset the paddle's scale
                if (paddleWobble) {
                    paddle.scaleX = 1;
                    paddle.scaleY = 1;
                    g.removeTween(paddleWobble);
                }

                //b. Create the wobble tween
                paddleWobble = g.wobble(
                    paddle, 1.1, 1.1, 10, 10, 10, -10, -10, 0.75
                );
            }
        );
    }

    ballHitsPaddle();

    /*
    Check for a collision between the ball and the all
    the blocks in the grid.
    You can use the universal `hit` collision function to do this. If one
    of the first two arguments is an array, the `hit` function will loop
    through all the sprites in that array and check it for a collision
    with the other sprite.
    `hit` arguments:
    spriteA, spriteB, reactToCollision?, bounce?, useGlobalCoordinates?
    actionWhenCollisionOccurs
    */

    function ballHitsBlock() {
        g.hit(
            ball, blocks.children, true, true, true,
            (collision, block) => {

                //Add 1 to the score, play the bounce sound
                //and remove the block that was hit
                score += 1;
                bounceSound.play();
                g.remove(block);

                //Create the particle effect

                //1. Find the globalCenterX and globalCenterY
                //position for the block that was hit
                let globalCenterX = block.gx + block.halfWidth,
                    globalCenterY = block.gy + block.halfHeight;

                //2. Create the effect
                g.particleEffect(
                    globalCenterX, globalCenterY,         //x and y position
                    () => sprite(assets["star.png"]), //Particle function
                    20,                                   //Number of particles
                    0.3,                                  //Gravity
                    true,                                 //Random spacing
                    0, 6.28,                              //Min/max angle
                    12, 24,                               //Min/max size
                    5, 10,                                //Min/max speed
                    0.005, 0.01,                          //Min/max scale speed
                    0.005, 0.01,                          //Min/max alpha speed
                    0.05, 0.1                             //Min/max rotation speed
                );
            }
        );
    }

    ballHitsBlock();

    //Use whichever collision style you prefer
    //Display the current score
    message.content = `Score: ${score}`;

    //Check for the end of the game
    if (blocks.empty) {
        //Pause the game, wait for 1 second, and then call the `end` function
        g.pause();
        g.wait(1000).then(() => end());
    }
}

function end() {

    //Display the `titleScene` and hide the `gameScene`
    slide(titleScene, 0, 0, fps, easing);
    slide(gameScene, gameOffset * -1, 0, fps, easing);

    //Display the final score
    titleMessage.content = `Score: ${score}`;

    //Lower the music volume
    music.volume = 0.3;

    //Assign a new button `press` action to `restart` the game
    playButton.press = () => restart();
}

function restart() {
    //Remove any remaining blocks if there are any
    g.remove(blocks);

    //Plot a new grid of blocks
    plotBlocks();

    //Add the blocks to the `gameScene` and position it
    gameScene.addChild(blocks);
    blocks.y = topOffset;
    blocks.x = 0;

    //Reset the ball and paddle positions
    stage.putBottom(paddle, 0, -22);
    stage.putBottom(ball, 0, -128);

    //Reset the ball's velocity
    setBallVelocity();

    //Reset the score
    score = 0;

    //Set the music volume to full
    music.volume = 1;

    //Hide the titleScene and reveal the gameScene
    changeScene();

    //Set the game state to `play` and `resume` the game
    g.state = () => play();
    g.resume();
}
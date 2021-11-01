import {
    game
} from "../library/engine.js";

//Initialize the game engine and load all the assets
let g = game(
    1024, 512, setup,
    [
        "images/flappyFairy.json",
    ],
    load
);

const {
    canvas,
    progressBar,
    assets,
    sprite,
    stage,
    tilingSprite,
    group,
    randomInt,
    emitter,
    particleEffect,
    hit
} = g;

//Game variables
let fairy, sky, blocks, pointer,
    finish, dust, dustFrames;

g.start();

g.scaleToWindow();

window.addEventListener("resize", () => {
    g.scaleToWindow("#000");
});

function load() {
    progressBar.create(canvas, assets);
    progressBar.update();
}

function setup() {

    sky = tilingSprite(
        canvas.width,
        canvas.height,
        assets["sky.png"]
    );

    //Make the world
    blocks = group();

    //What should the initial size of the gap be between the pillars?
    let gapSize = 4;

    //How many pillars?
    let numberOfPillars = 5;

    //Loop 15 times to make 15 pillars
    for (let i = 0; i < numberOfPillars; i++) {

        //Randomly place the gap somewhere inside the pillar
        let startGapNumber = randomInt(0, 8 - gapSize);

        //Reduce the `gapSize` by one after every fifth pillar. This is
        //what makes gaps gradually become narrower
        if (i > 0 && i % 2 === 0) gapSize -= 1;

        //Create a block if it's not within the range of numbers
        //occupied by the gap
        for (let j = 0; j < 8; j++) {
            if (j < startGapNumber || j > startGapNumber + gapSize - 1) {
                let block = sprite(assets["greenBlock.png"]);
                blocks.addChild(block);

                //Space each pillar 384 pixels apart. The first pillar will be
                //placed at an x position of 512
                block.x = (i * 384) + 512;
                block.y = j * 64;
            }
        }

        //After the pillars have been created, add the finish image
        //right at the end
        if (i === numberOfPillars - 1) {
            finish = sprite(assets["finish.png"]);
            blocks.addChild(finish);
            finish.x = (i * 384) + 896;
            finish.y = 192;
        }
    }

    //Make the fairy
    let fairyFrames = [
        assets["0.png"],
        assets["1.png"],
        assets["2.png"]
    ];
    fairy = sprite(fairyFrames);
    fairy.fps = 24;
    fairy.setPosition(232, 32);
    fairy.vy = 0;
    fairy.oldVy = 0;

    //Create the frames array for the fairy dust images
    //that trail the fairy
    dustFrames = [
        assets["pink.png"],
        assets["yellow.png"],
        assets["green.png"],
        assets["violet.png"]
    ];

    //Create the emitter
    dust = emitter(
        300, //The interval
        () => particleEffect( //The function
            fairy.x + 8, //x position
            fairy.y + fairy.halfHeight + 8, //y position
            () => sprite(dustFrames), //Particle sprite
            3, //Number of particles
            0, //Gravity
            true, //Random spacing
            2.4, 3.6, //Min/max angle
            12, 18, //Min/max size
            1, 2, //Min/max speed
            0.005, 0.01, //Min/max scale speed
            0.005, 0.01, //Min/max alpha speed
            0.05, 0.1 //Min/max rotation speed
        )
    );

    //Make the particle stream start playing when the game starts
    dust.play();

    //Make the pointer and increase the fairy's
    //vertical velocity when it's tapped
    pointer = g.makePointer(canvas);
    pointer.tap = () => fairy.vy += 1.5;

    //Start the game loop
    g.state = play;
}

function play() {

    if (g.particles.length > 0) {
        for (let i = g.particles.length - 1; i >= 0; i--) {
            let particle = g.particles[i];
            particle.update();
        }
    }

    //Make the sky background scroll by shifting the `tileX`
    //of the `sky` tiling sprite
    sky.tileX -= 1;

    //Move the blocks 2 pixels to the left each frame.
    //This will just happen while the finish image is off-screen.
    //As soon as the finish image scrolls into view, the blocks
    //container will stop moving
    if (finish.gx > 256) {
        blocks.x -= 2;
    }

    //Add gravity to the fairy
    fairy.vy += -0.05;
    fairy.y -= fairy.vy;

    //Decide whether or not the fairy should flap her wings
    //If she's starting to go up, make her flap her wings and emit fairy dust
    if (fairy.vy > fairy.oldVy) {
        if (!fairy.playing) {
            fairy.play();
            if (fairy.visible && !dust.playing) dust.play();
        }
    }
    //If she's staring to go down, stop flapping her wings, show the first frame
    //and stop the fairy dust
    if (fairy.vy < 0 && fairy.oldVy > 0) {
        if (fairy.playing) fairy.stop();
        fairy.show(0);
        if (dust.playing) dust.stop();
    }

    //Store the fairy's current vy so we can use it
    //to find out if the fairy has changed direction
    //in the next frame. (You have to do this as the last step)
    fairy.oldVy = fairy.vy;

    //Keep the fairy contained inside the stage and
    //neutralize her velocity if she hits the top or bottom boundary
    let fairyVsStage = g.contain(fairy, stage.localBounds);
    if (fairyVsStage === "bottom" || fairyVsStage === "top") {
        fairy.vy = 0;
    }

    let fairyVsBlock = blocks.children.some(block => hit(fairy, block, true));

    if (fairyVsBlock && fairy.visible) {

        //Make the fairy invisible
        fairy.visible = false;

        //Create a fairy dust explosion
        particleEffect(
            fairy.centerX, fairy.centerY, //x and y position
            () => sprite(dustFrames), //Particle sprite
            20, //Number of particles
            0, //Gravity
            false, //Random spacing
            0, 6.28, //Min/max angle
            16, 32, //Min/max size
            1, 3 //Min/max speed
        );

        //Stop the dust emitter that's trailing the fairy
        dust.stop();

        g.wait(3000).then(() => reset());
    }
}

function reset() {
    fairy.visible = true;
    fairy.y = 32;
    dust.play();
    blocks.x = 0;
}
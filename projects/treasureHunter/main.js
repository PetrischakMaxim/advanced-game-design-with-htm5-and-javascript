import {game} from "../library/engine.js";

//Initialize the game engine and load all the assets
let gameSize = 512;
let g = game(
    gameSize, gameSize, setup,
    [
        "images/treasureHunter.json",
        "sounds/theme.mp3",
        "sounds/hit.mp3",
    ],
    load
);

//Start the engine
g.start();

//Scale and center the game
g.scaleToWindow();

//Optionally re-scale the canvas if the browser window is changed
window.addEventListener("resize", () => {
    g.scaleToWindow("#000");
});

//Declare any variables shared between functions
let player, treasure, music, soundHit, bounceHit,
    enemies, exit, healthBar, barMessage,
    message, gameScene, gameOverScene,
    dungeon, upArrow, rightArrow, downArrow, leftArrow;

function setup() {

    //Remove the progress bar
    g.progressBar.remove();

    music = g.assets["sounds/theme.mp3"];
    music.loop = true;
    soundHit = g.assets["sounds/hit.mp3"];
    bounceHit = g.assets["sounds/bounce.wav"];

    //The dungeon background
    dungeon = g.sprite(g.assets["dungeon.png"]);

    //The exit door
    exit = g.sprite(g.assets["door.png"]);
    exit.x = 32;

    //The player sprite
    player = g.sprite(g.assets["explorer.png"]);
    player.x = 32;
    player.y = 32;

    //Create the treasure
    treasure = g.sprite(g.assets["treasure.png"]);

    //Position it next to the right edge of the canvas
    g.stage.putRight(treasure, -64);

    //Create the `gameScene` group and add the sprites
    gameScene = g.group(dungeon, exit, player, treasure);

    //Make the enemies
    let numberOfEnemies = g.randomInt(5, 8),
        spacing = 48,
        xOffset = 80,
        speed = g.randomInt(2, 5),
        direction = 1;

    //An array to store all the enemies
    enemies = [];

    //Make as many enemies as there are `numberOfEnemies`
    for (let i = 0; i < numberOfEnemies; i++) {

        //Each enemy is made from a blob.png texture atlas frame
        let enemy = g.sprite(g.assets["blob.png"]);

        //Space each enemy horizontally according to the `spacing` value.
        //`xOffset` determines the point from the left of the screen
        //at which the first enemy should be added
        let x = spacing * i + xOffset;

        //Give the enemy a random y position
        let y = g.randomInt(0, g.canvas.height - enemy.height);

        //Set the enemy's direction
        enemy.x = x;
        enemy.y = y;

        //Set the enemy's vertical velocity. `direction` will be either `1` or
        //`-1`. `1` means the enemy will move down and `-1` means the enemy will
        //move up. Multiplying `direction` by `speed` determines the enemy's
        //vertical direction
        enemy.vy = speed * direction;

        //Reverse the direction for the next enemy
        direction *= -1;

        //Push the enemy into the `enemies` array
        enemies.push(enemy);

        //Add the enemy to the `gameScene`
        gameScene.addChild(enemy);
    }

    //Create the health bar
    let outerBar = g.rectangle(128, 8, "black"),
        innerBar = g.rectangle(128, 8, "red");

    //Group the inner and outer bars
    healthBar = g.group(outerBar, innerBar);

    //Set the `innerBar` as a property of the `healthBar`
    healthBar.inner = innerBar;

    //Position the health bar
    healthBar.x = g.canvas.width - 164;
    healthBar.y = 4;

    //Add the health bar to the `gameScene`
    gameScene.addChild(healthBar);

    //Add bar text
    barMessage = g.text("HP " + healthBar.inner.width, "18px Helvetica", "black", 270, 1);
    gameScene.add(barMessage);

    //Add some text for the game over message
    message = g.text("Game Over!", "64px Futura", "black", 20, 20);
    message.x = 120;
    message.y = g.canvas.height / 2 - 64;

    //Create a `gameOverScene` group and add the message sprite to it
    gameOverScene = g.group(message);

    //Make the `gameOverScene` invisible for now
    gameOverScene.visible = false;

    //Create the player's keyboard controllers
    leftArrow = g.keyboard(37);
    upArrow = g.keyboard(38);
    rightArrow = g.keyboard(39);
    downArrow = g.keyboard(40);
    let playerStep = 5;

    //Assign key `press` methods
    leftArrow.press = () => {
        //Change the player's velocity when the key is pressed
        player.vx = -playerStep;
        player.vy = 0;
    };
    leftArrow.release = () => {
        //If the left arrow has been released, and the right arrow isn't down,
        //and the player isn't moving vertically:
        //Stop the player
        if (!rightArrow.isDown && player.vy === 0) {
            player.vx = 0;
        }
    };
    upArrow.press = () => {
        player.vy = -playerStep;
        player.vx = 0;
    };
    upArrow.release = () => {
        if (!downArrow.isDown && player.vx === 0) {
            player.vy = 0;
        }
    };
    rightArrow.press = () => {
        player.vx = playerStep;
        player.vy = 0;
    };
    rightArrow.release = () => {
        if (!leftArrow.isDown && player.vy === 0) {
            player.vx = 0;
        }
    };
    downArrow.press = () => {
        player.vy = playerStep;
        player.vx = 0;
    };
    downArrow.release = () => {
        if (!upArrow.isDown && player.vx === 0) {
            player.vy = 0;
        }
    };

    //Start the game loop

    g.state = play;
}

function load() {
    //Display the loading progress bar while the game assets load
    g.progressBar.create(g.canvas, g.assets);
    g.progressBar.update();
}

function play() {
    if (!music.playing) music.play();
    //Move the player
    player.x += player.vx;
    player.y += player.vy;

    //Keep the player contained inside the stage's area
    let bounds = {
        x: 32, y: 16,
        width: g.canvas.width - 32,
        height: g.canvas.height - 32
    };
    g.contain(
        player,
        bounds
    );

    //Move the enemies and check for a collision

    //Set `playerHit` to `false` before checking for a collision
    let playerHit = false;

    //Loop through all the enemy sprites
    enemies.forEach(enemy => {
        //Move the enemy
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        //Check the enemy's screen boundaries
        let enemyHitsEdges = g.contain(
            enemy,
            bounds
        );

        //If the enemy hits the top or bottom of the stage, reverse
        //its direction
        if (enemyHitsEdges === "top" || enemyHitsEdges === "bottom") {
            enemy.vy *= -1;
        }

        //Test for a collision. If any of the enemies are touching
        //the player, set `playerHit` to `true`
        if (g.hit(player, enemy)) {
            playerHit = true;
            soundHit.play();
        }
    });

    //If the player is hit...
    if (playerHit) {
        //Make the player semi-transparent
        player.alpha = 0.5;
        //Reduce the width of the health bar's inner rectangle by 1 pixel
        healthBar.inner.width -= 1;
        barMessage.content = "HP " + healthBar.inner.width;
    } else {
        //Make the player fully opaque (non-transparent) if it hasn't been hit
        player.alpha = 1;
    }

    //Check for a collision between the player and the treasure
    if (g.hit(player, treasure)) {
        //If the treasure is touching the player, set it
        //to the player's position with a slight offset
        treasure.x = player.x + 8;
        treasure.y = player.y + 8;
    }

    //Check for the end of the game
    if (healthBar.inner.width < 50) {
        barMessage.fillStyle = "red";
    }
    //Does the player have enough health? If the width of the `innerBar`
    //is less than zero, end the game and display "You lost!"
    if (healthBar.inner.width <= 0) {
        end("You lost!");
    }

    //If the player has brought the treasure to the exit,
    //end the game and display "You won!"
    if (g.hit(treasure, exit)) {
        end("You won!")
    }
}

function end(text) {
    gameScene.visible = false;
    gameOverScene.visible = true;
    message.content = text;
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}
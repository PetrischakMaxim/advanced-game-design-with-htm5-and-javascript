import {game} from "../library/engine.js";


let g = game(512, 256, setup, ["images/animals.json"]);
g.start();

//Scale and center the game
g.scaleToWindow("white");

//Optionally re-scale the canvas if the browser window is changed
window.addEventListener("resize", event => {
    g.scaleToWindow("white");
});

//Give the canvas a black background
g.canvas.style.backgroundColor = "black";

//Declare variables that should be used across functions
let cat, tiger, hedgehog;

function setup() {
    console.log("setup");

    //Make three sprites and set their `draggable`
    //properties to `true`
    cat = g.sprite(g.assets["cat.png"]);
    g.stage.putCenter(cat, -32, -32);
    cat.draggable = true;

    tiger = g.sprite(g.assets["tiger.png"]);
    g.stage.putCenter(tiger);
    tiger.draggable = true;

    hedgehog = g.sprite(g.assets["hedgehog.png"]);
    g.stage.putCenter(hedgehog, 32, 32);
    hedgehog.draggable = true;

    //Optionally set the game state to `play`
    g.state = play;
}

function play() {
    //You don't actually need a `play` state in this example,
    //but if you did, all this code would run in a loop
    console.log("play")
}
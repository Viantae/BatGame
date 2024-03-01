/**@type {HTMLCanvasElement} */

// Challenges : - Adding multiple animation states to a sprite
//              - Resolution adjustments and set size to screen reszie
//              - Adding Effects to the bats from a seperate sprite sheet
//              - Creating the buttons to retry and start the game

// Notes for Improvement : - Lines (126 - 155) or the animationForEach function should not be in constructor
//                         - Sprite animation for 'zoom' and 'fly' Line 207 - 225 could be optimised for better scalability
//                         - Research more into mobile screens and code with mobile users in mind


const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// Additional canvas for hitbox
const collisionCanvas = document.getElementById("collisionCanvas");
const collisionCtx = collisionCanvas.getContext("2d", {
  willReadFrequently: true,
});
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

// Enemy Spawn Rate
let timeToNextBat = 0;
let batsInterval = 1000; // in miliseconds
let lastTime = 0;

// Accuracy Counter
let score = 0;
let accuracy = 1.0;
let hits = 1;
let clicks = 0;

// Enemy multiplier
let dashMultiplier = 2;
let specialMultiplier = 10000;
let speedMultiplier = 2.4;

// Stop Game
let gamePause = true;
let gameOver = false;

// Stores uptime of game
let gameTime = 0;

// Background layers
const Image1 = new Image();
Image1.src = "Background/1.png";
const Image2 = new Image();
Image2.src = "Background/2.png";
const Image3 = new Image();
Image3.src = "Background/3fx.png";
const Image4 = new Image();
Image4.src = "Background/4.png";
const Image5 = new Image();
Image5.src = "Background/5.png";
const Image6 = new Image();
Image6.src = "Background/6fx.png";
const Image7 = new Image();
Image7.src = "Background/7.png";
const Image8 = new Image();
Image8.src = "Background/8fx.png";
const Image9 = new Image();
Image9.src = "Background/9.png";

const animationStatesList = [
  {
    name: "fly",
    frames: 5,
  },
  {
    name: "zoom",
    frames: 7,
  },
];

let batsArray = [];
class Bats {
  constructor() {
    this.image = new Image();
    this.image.src = "Sprites/Bat_Full(Flipped-Brighten).png";
    this.maxspritesheetSize = 256;
    this.maxFramesperRow = 5;
    // In pixels
    this.spriteWidth = 64;
    this.spriteHeight = 64;
    this.sizeMultiplier = (canvas.width*canvas.height) * 0.0000035;
    this.size = Math.random() * this.sizeMultiplier + 2;

    // Sprite on canvas
    this.width = this.spriteWidth * this.size;
    this.height = this.spriteHeight * this.size;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    this.frameX = 0;
    this.frameY = 0;

    // Speed of movement
    this.speedX = Math.random() * speedMultiplier + 1;
    this.speedY = Math.random() * speedMultiplier - 2.5;

    // Frames per second
    this.timeSincelastframe = 0;
    this.frameInterval = Math.floor(Math.random() * 50 + 50); // in miliseconds

    // Hitbox
    this.randomColor = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.hitboxColor = `rgb(${this.randomColor[0]},${this.randomColor[1]},${this.randomColor[2]})`;

    this.delete = false;

    // Animation States
    this.spriteAnimations = [];

    // Method to store animation locations
    animationStatesList.forEach((state) => {
      let frames = {
        loc: [],
      };

      // Keep track of positions (because some sprites are continued below)
      let indexX = 0;
      let positionY = 0;
      let indexY = 0;

      // First frame of bats is not usable
      let i = 0;
      if (state.name === "fly") i++, indexX++;

      // Loop to find location of each sprite based on frames in animationStatesList
      for (i; i < state.frames; i++) {
        let positionX = this.maxspritesheetSize - indexX * this.spriteWidth;
        if (indexX % this.maxFramesperRow == 0) {
          indexY++;
          positionY = indexY * this.spriteHeight;
        }
        if (positionX <= 0) indexX = -1;
        indexX++;

        // Append to spriteAnimations
        frames.loc.push({ x: positionX, y: positionY });
      }
      // Names each animation
      this.spriteAnimations[state.name] = frames;
    });

    // Default State
    this.maxFrames = 1;
    this.frame = this.spriteAnimations["fly"].loc.length - 1;

    // Change State
    this.useDash = false;
    this.spValue = Math.floor(Math.random() * 50);
  }

  update(deltatime) {
    if (this.useDash) {
      this.frameInterval = Math.random() * 200 + 100;
      if (this.frame > 2 && this.frame < 5) {
        effectsArray.push(
          new Effects(
            this.x,
            this.y,
            this.size,
            this.speedX,
            this.width,
            this.height,
            this.timeSincelastframe,
            deltatime
          )
        );
        this.x -= this.speedX * dashMultiplier;
        this.y += this.speedY * dashMultiplier;
      } else {
        this.x -= this.speedX / dashMultiplier;
        this.y += this.speedY / dashMultiplier;
      }
    } else {
      this.x -= this.speedX;
      this.y += this.speedY;
    }

    // If off vertical screen make it bounce
    if (this.y < 0 || this.y > canvas.height - this.height) {
      this.speedY = this.speedY * -1;
    }
    if (this.x > canvas.width || this.y > canvas.height) {
      this.delete = true;
    }

    // If off horizontal screen delete it from the array
    if (this.x < 0 - this.width) this.delete = true;
    this.timeSincelastframe += deltatime;

    // Update frames based on computer performance
    if (this.timeSincelastframe > this.frameInterval) {
      if (!this.useDash) {
        if (this.frame < this.maxFrames)
          this.frame = this.spriteAnimations["fly"].loc.length - 1;
        else this.frame--;

        this.frameX = this.spriteAnimations["fly"].loc[this.frame].x;
        this.frameY = this.spriteAnimations["fly"].loc[this.frame].y;
      } else {
        if (this.frame < this.maxFrames)
          this.frame = this.spriteAnimations["zoom"].loc.length - 1;
        else this.frame--;

        this.frameX = this.spriteAnimations["zoom"].loc[this.frame].x;
        this.frameY = this.spriteAnimations["zoom"].loc[this.frame].y;
        particlesArray.push(
          new Particle(this.x, this.y, this.width, this.hitboxColor)
        );
      }

      this.timeSincelastframe = 0;
    }
    if (this.x < 0 - this.width) gameOver = true;

    if (Math.floor(Math.random() * specialMultiplier) == this.spValue)
      this.useDash = true;
  }

  draw() {
    collisionCtx.fillStyle = this.hitboxColor;
    collisionCtx.fillRect(
      this.x - this.size,
      this.y - this.size,
      this.width,
      this.height
    );

    ctx.drawImage(
      this.image,
      this.frameX,
      this.frameY,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

let explosionArray = [];
class Explosions {
  constructor(x, y, size) {
    this.image = new Image();
    this.image.src = "Effects/PixelXplosion.png";
    this.spriteSize = 64;
    this.size = size;
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.sound = new Audio();
    this.sound.src = "Sound/mixkit-cartoon-blow-impact-2654.wav";
    this.sound.volume = 0.5;
    this.timeSincelastframe = 0;
    this.frameInterval = 40;
    this.delete = false;

    this.angle = Math.random() * 6.2;
  }

  update(deltatime) {
    if (this.frame === 0) this.sound.play();
    this.timeSincelastframe += deltatime;
    if (this.timeSincelastframe > this.frameInterval) {
      this.frame++;
      this.timeSincelastframe = 0;
    }
    if (this.frame > 11) this.delete = true;
  }
  // Rotate explosions
  draw() {
    ctx.save();
    // Rotate around center
    ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
    ctx.rotate(this.angle);
    ctx.drawImage(
      this.image,
      this.frame * this.spriteSize,
      0,
      this.spriteSize,
      this.spriteSize,
      -this.size / 2, // x
      -this.size / 2, // y
      this.size,
      this.size
    );
    ctx.restore();
  }
}

let particlesArray = [];
class Particle {
  constructor(x, y, size, color) {
    this.size = size;
    this.x = x + this.size / 2; // center it
    this.y = y + this.size / 2;
    this.radius = (Math.random() * this.size) / 100;
    this.maxRadius = Math.random() * 12 + 1;

    this.speedX = Math.random() * 2 + 0.5;
    this.color = color;
    this.delete = false;
  }

  update() {
    this.x += this.speedX;
    this.radius += 0.1;
    if (this.radius > this.maxRadius) this.delete = true;
  }
  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

let effectsArray = [];
class Effects {
  constructor(
    x,
    y,
    size,
    speedX,
    width,
    height,
    timeSincelastframe,
    deltatime
  ) {
    this.image = new Image();
    this.image.src = "Effects/Bat_Attack_FX(Flipped).png";
    this.size = size;
    this.spriteSize = 64;
    this.x = x - this.size * 2;
    this.y = y + this.size;
    this.speedX = speedX;
    this.frameInterval = 10;
    this.timeSincelastframe = timeSincelastframe;
    this.maxFrame = 3;
    this.frameX = 0;
    this.width = width;
    this.height = height;
    this.deltatime = deltatime;
    this.delete = false;
  }
  update() {
    this.x -= this.speedX;
    this.timeSincelastframe += this.deltatime;
    if (this.timeSincelastframe > this.frameInterval) {
      this.frameX = this.maxFrame * this.spriteSize;
      if (this.maxFrame > 0) this.maxFrame--;
      else {
        this.maxFrame = 3;
        this.delete = true;
      }
      this.timeSincelastframe = 0;
    }
  }
  draw() {
    ctx.drawImage(
      this.image,
      this.frameX,
      0,
      this.spriteSize,
      this.spriteSize,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

//Class for storing background layer parameters
class Layer {
  constructor(
    image,
    width = canvas.width,
    height = canvas.height,
    x = 0,
    y = 0,
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;
  }

  // Take layer object and draw it on canvas
  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}


drawBackground = () => {
  const first = new Layer(Image1)
  const second = new Layer(Image2)
  const third = new Layer(Image3)
  const fourth = new Layer(Image4)
  const five = new Layer(Image5)
  const six = new Layer(Image6)
  const seven = new Layer(Image7)
  const eight = new Layer(Image8)
  const nine = new Layer(Image9)

  const backgroundObjects = [first,second,third,fourth,five,six,seven,eight,nine]
    backgroundObjects.forEach(obj => {
      obj.draw();
    });
    
}

// Map function to convert the range
function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

drawScore = () => {
  document.getElementById("score").innerHTML = `Score: ${score}`;
};

accuracyCounter = () => {
  accuracy = parseFloat((hits / clicks) * 100).toFixed(2);
  let R = mapRange(accuracy, 100, 0, 0, 255);
  document.getElementById("accuracy").style.color = `rgb(${R}, ${255 - R}, 0)`;
};

function drawAccuracy() {
  accuracyCounter();
  document.getElementById("accuracy").innerHTML = `Accuracy: ${accuracy}%`;
}

function drawgameOver() {
  document.getElementById("gameOver").style.opacity = "1";
  document.getElementById("gameOver").style.zIndex = "1";
  document.getElementById(
    "gOScore"
  ).innerHTML = `You Lost (Sadly), Your Score was: <em>${score}</em> <br>`;
  gamePause = true;
}

animate = (timestamp) => {
  drawBackground();
  if(!gamePause){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    // For performance adjustment based on different computers
    // Timestamp different for each computer
    let deltatime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextBat += deltatime;
    if (batsArray.length < 20){
      if (timeToNextBat > batsInterval) {
        batsArray.push(new Bats());
        timeToNextBat = 0;
        batsArray.sort(function (a, b) {
          return a.width - b.width;
        });
      }
    }
    // [] Array Literal
    // ... Spread operator
    [...batsArray, ...explosionArray, ...effectsArray, ...particlesArray].forEach(
      (obj) => obj.update(deltatime)
    );
    [...batsArray, ...explosionArray, ...effectsArray, ...particlesArray].forEach(
      (obj) => obj.draw()
    );
    // Replace array with objects with delete = false
    batsArray = batsArray.filter((obj) => !obj.delete);
    explosionArray = explosionArray.filter((obj) => !obj.delete);
    particlesArray = particlesArray.filter((obj) => !obj.delete);
    effectsArray = effectsArray.filter((obj) => !obj.delete);
    

    gameTime++;
    increaseDifficulty();
  }
  if (!gameOver) requestAnimationFrame(animate);
  else drawgameOver();
};

createExplosion = (e) => {
  // pos x, pos y, pixel by pixel(1x1)
  // Get color of rectangle drawn on batsArray
  const getpxColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
  // Get rgba value
  const pxColor = getpxColor.data;
  clicks++;
  batsArray.forEach((obj) => {
    if (
      obj.randomColor[0] === pxColor[0] &&
      obj.randomColor[1] === pxColor[1] &&
      obj.randomColor[2] === pxColor[2]
    ) {
      // collision detected
      obj.delete = true;
      score++;
      hits++;
      explosionArray.push(new Explosions(obj.x, obj.y, obj.width));
    }
  });
};

increaseDifficulty = () => {
  // Increase chance of dashes
  if (gameTime % 500 === 0 && specialMultiplier > 3000) {
    specialMultiplier -= 50;
  }
  else if(score % 50 === 0 && specialMultiplier > 5000){
    specialMultiplier -= 1000;
  }

  // Increase bat spawns
  if (gameTime % 100 === 0 && batsInterval < 500) {
    batsInterval -= 0.05;
  } else if (gameTime % 100 === 0) {
    batsInterval -= 4.5;
  }

  // Increase speed of bats
  if (gameTime % 500 === 0 && speedMultiplier < 9) {
    speedMultiplier += 0.5;
  }
};

gameStart = () =>{
  document.getElementById("instruction-section").style.opacity = "0";
  document.getElementById("instruction-section").style.zIndex = "-1";
  document.getElementById("gameOver").style.zIndex = "-1";
  gamePause = false;
  window.addEventListener("click", function (e) {
    if(!gamePause){
      if (!gameOver) {
        createExplosion(e);
        drawScore();
        drawAccuracy();
      }
    }
  });
}

gameReset = () => {
  document.getElementById("gameOver").style.zIndex = "-1";
  batsArray = [];
  explosionArray = [];
  particlesArray = [];
  effectsArray = [];
  score = 0;
  hits = 1;
  accuracy = 1.0;
  clicks = 0
  gameTime = 0;
  gameOver = false;
  gamePause = false
  animate(0);
}

window.addEventListener("resize", function () {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  collisionCanvas.width = innerWidth;
  collisionCanvas.height = innerHeight;
  drawBackground();
});
animate(0);


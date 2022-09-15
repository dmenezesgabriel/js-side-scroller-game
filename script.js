window.addEventListener("load", () => {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = 800;
  canvas.height = 720;
  let score = 0;
  let enemies = [];
  let gameOver = false;

  class InputHandler {
    constructor() {
      this.expectedKeys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
      this.keys = [];
      window.addEventListener("keydown", (event) => {
        if (this.expectedKeys.includes(event.key) && this.keys.indexOf(event.key) === -1) {
          this.keys.push(event.key);
          console.log(this.keys);
        }
      });
      window.addEventListener("keyup", (event) => {
        if (this.expectedKeys.includes(event.key)) {
          this.keys.splice(this.keys.indexOf(event.key), 1);
          console.log(this.keys);
        }
      });
    }
  }

  class Player {
    constructor(gameWidth, gameHeight) {
      this.gameHeight = gameHeight;
      this.gameWidth = gameWidth;
      this.height = 200; // pixels
      this.width = 200; // pixels
      this.x = 0;
      this.y = this.gameHeight - this.height;
      this.image = document.getElementById("playerImage");
      this.frameX = 0;
      this.maxFrame = 8;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.frameY = 0;
      this.speed = 0;
      this.vy = 0;
      this.weight = 1; // Gravity
    }
    draw(context) {
      context.strokeStyle = "white";
      context.strokeRect(this.x, this.y, this.width, this.height);
      context.beginPath();
      context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
      context.stroke();
      // context.fillStyle = "white";
      // context.fillRect(this.x, this.y, this.width, this.height);
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.height,
        this.width,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
    update(input, deltaTime, enemies) {
      // Collision detection
      enemies.forEach((enemy) => {
        const dx = enemy.x + enemy.width / 2 - (this.x + this.width / 2);
        const dy = enemy.y + enemy.width / 2 - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < enemy.width / 2 + this.width / 2) {
          gameOver = true;
        }
      });
      // Sprite animation
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX >= this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }
      // controls
      if (input.keys.indexOf("ArrowRight") > -1) {
        this.speed = 5;
      } else if (input.keys.indexOf("ArrowLeft") > -1) {
        this.speed = -5;
      } else if (input.keys.indexOf("ArrowUp") > -1 && this.onGround()) {
        this.vy -= 30;
      } else {
        this.speed = 0;
      }
      // Horizontal movement
      this.x += this.speed;
      if (this.x < 0) this.x = 0;
      else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;
      // Vertical movement
      this.y += this.vy;
      if (!this.onGround()) {
        this.vy += this.weight;
        this.maxFrame = 5; // jump animation
        this.frameY = 1;
      } else {
        this.vy = 0;
        this.maxFrame = 8;
        this.frameY = 0;
      }
      if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
    }
    onGround() {
      return this.y >= this.gameHeight - this.height;
    }
  }

  class Background {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.image = document.getElementById("backgroundImage");
      this.x = 0;
      this.y = 0;
      this.width = 2400; // pixels
      this.height = 720; // pixels
      this.speed = 5;
    }
    draw(context) {
      context.drawImage(this.image, this.x, this.y, this.width, this.height);
      context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
    }
    update() {
      this.x -= this.speed;
      if (this.x < 0 - this.width) this.x = 0;
    }
  }
  class Enemy {
    constructor(gameWidth, gameHeight) {
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.width = 160;
      this.height = 119;
      this.image = document.getElementById("enemyImage");
      this.x = this.gameWidth;
      this.y = this.gameHeight - this.height;
      this.frameX = 0;
      this.maxFrame = 4;
      this.fps = 20;
      this.frameTimer = 0;
      this.frameInterval = 1000 / this.fps;
      this.speed = 8;
      this.markedForDeletion = false;
    }
    draw(context) {
      context.strokeStyle = "white";
      context.strokeRect(this.x, this.y, this.width, this.height);
      context.beginPath();
      context.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
      context.stroke();
      context.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
    }
    update(deltaTime) {
      if (this.frameTimer > this.frameInterval) {
        if (this.frameX > this.maxFrame) this.frameX = 0;
        else this.frameX++;
        this.frameTimer = 0;
      } else {
        this.frameTimer += deltaTime;
      }
      this.x -= this.speed;
      if (this.x < 0 - this.width) {
        this.markedForDeletion = true;
        score++;
      }
    }
  }

  function handleEnemies(deltaTime) {
    if (enemyTimer > enemyInterval + randomEnemyInterval) {
      enemies.push(new Enemy(canvas.width, canvas.height));
      enemyTimer = 0;
    } else {
      enemyTimer += deltaTime;
    }
    enemies.forEach((enemy) => {
      enemy.draw(ctx);
      enemy.update(deltaTime);
    });

    enemies = enemies.filter((enemy) => !enemy.markedForDeletion);
  }

  function displayStatusText(context) {
    context.filStyle = "black";
    context.font = "40px Helvetica";
    context.fillText("Score: " + score, 20, 50);
    if (gameOver) {
      context.textAlign = "center";
      context.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    }
  }

  const input = new InputHandler();
  const player = new Player(canvas.width, canvas.height);
  const background = new Background(canvas.width, canvas.height);
  let lastTime = 0;
  let enemyTimer = 0;
  let enemyInterval = 1000;
  let randomEnemyInterval = Math.random() * 1000 + 500;

  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.draw(ctx);
    // background.update();
    player.draw(ctx);
    player.update(input, deltaTime, enemies);
    handleEnemies(deltaTime);
    displayStatusText(ctx);
    if (!gameOver) requestAnimationFrame(animate);
  }
  animate(0);
});

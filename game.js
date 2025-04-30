class CosmicDefenderGame {
  constructor(ui) {
    this.ui = ui;
    this.player = { 
      x: this.ui.canvas.width / 2, // Dynamic initial position
      y: this.ui.canvas.height - 50,
      keyboardSpeed: 5, 
      mobileSpeed: 2, 
      radius: 15,
      dx: 0,
      dy: 0
    };
    this.bullets = [];
    this.enemies = [];
    this.score = 0;
    this.gameOver = false;
    this.weaponMode = 'Gun';
    this.bombAmmo = 5;
    this.lastShot = 0;
    this.shootCooldown = 200; // ms
    this.enemySpawnRate = 1000; // ms
    this.lastSpawn = 0;
    this.isMobileInput = false;
    this.autoShoot = true;
    this.isShooting = false;
    this.init();
  }

  init() {
    this.ui.setCallback('onMove', (dx, dy, isMobile) => this.handleMove(dx, dy, isMobile));
    this.ui.setCallback('onAim', (x, y) => this.handleAim(x, y));
    this.ui.setCallback('onShoot', (dist, isActive) => this.handleShoot(dist, isActive));
    this.ui.setCallback('onAction', () => this.toggleWeapon());
    this.ui.setCallback('onRestart', () => this.restart());
    this.ui.setCallback('onResize', (w, h) => this.handleResize(w, h));
    this.loop();
  }

  handleMove(dx, dy, isMobile) {
    if (this.gameOver) return;
    this.isMobileInput = isMobile;
    this.player.dx = dx;
    this.player.dy = dy;
  }

  handleAim(x, y) {
    if (this.gameOver) return;
    this.aimX = x;
    this.aimY = y;
  }

  handleShoot(dist, isActive) {
    if (this.gameOver) return;
    this.isShooting = isActive;
    if (!this.autoShoot || !this.isShooting) return;
    if (Date.now() - this.lastShot < this.shootCooldown) return;
    this.lastShot = Date.now();
    const speedFactor = dist * 5;
    if (this.weaponMode === 'Gun') {
      this.bullets.push({
        x: this.player.x,
        y: this.player.y,
        dx: (this.aimX - this.player.x) / 100 * speedFactor,
        dy: (this.aimY - this.player.y) / 100 * speedFactor,
        radius: 5,
        type: 'gun'
      });
    } else if (this.bombAmmo > 0) {
      this.bullets.push({
        x: this.player.x,
        y: this.player.y,
        dx: (this.aimX - this.player.x) / 200 * speedFactor,
        dy: (this.aimY - this.player.y) / 200 * speedFactor,
        radius: 10,
        type: 'bomb'
      });
      this.bombAmmo--;
    }
  }

  toggleWeapon() {
    if (this.gameOver) return;
    this.weaponMode = this.weaponMode === 'Gun' ? 'Bomb' : 'Gun';
  }

  spawnEnemy() {
    if (Date.now() - this.lastSpawn < this.enemySpawnRate || this.gameOver) return;
    this.lastSpawn = Date.now();
    this.enemies.push({
      x: Math.random() * (this.ui.canvas.width - 20) + 10,
      y: -10,
      radius: 10,
      speed: 1 + this.score / 100
    });
  }

  update() {
    if (this.gameOver) return;

    // Apply constant movement with fixed speed
    const speed = this.isMobileInput ? this.player.mobileSpeed : this.player.keyboardSpeed;
    const magnitude = Math.sqrt(this.player.dx * this.player.dx + this.player.dy * this.player.dy);
    if (magnitude > 0) {
      const directionX = this.player.dx;
      const directionY = this.player.dy;
      this.player.x += directionX * speed;
      this.player.y += directionY * speed;
      this.player.x = Math.max(this.player.radius, Math.min(this.ui.canvas.width - this.player.radius, this.player.x));
      this.player.y = Math.max(this.player.radius, Math.min(this.ui.canvas.height - this.player.radius, this.player.y));
    }

    // Update bullets
    this.bullets = this.bullets.filter(b => {
      b.x += b.dx;
      b.y += b.dy;
      return b.y > -b.radius && b.y < this.ui.canvas.height + b.radius &&
             b.x > -b.radius && b.x < this.ui.canvas.width + b.radius;
    });

    // Update enemies
    this.enemies.forEach(e => {
      e.y += e.speed;
      if (e.y > this.ui.canvas.height) {
        this.enemies = this.enemies.filter(enemy => enemy !== e);
        this.score = Math.max(0, this.score - 5);
      }
    });

    // Collision detection
    this.bullets.forEach(b => {
      this.enemies = this.enemies.filter(e => {
        const dist = Math.sqrt((b.x - e.x) ** 2 + (b.y - e.y) ** 2);
        if (dist < b.radius + e.radius) {
          this.score += b.type === 'gun' ? 10 : 15;
          return false;
        }
        return true;
      });
    });

    // Player-enemy collision
    this.enemies.forEach(e => {
      const dist = Math.sqrt((this.player.x - e.x) ** 2 + (this.player.y - e.y) ** 2);
      if (dist < this.player.radius + e.radius) this.gameOver = true;
    });

    this.spawnEnemy();
  }

  render() {
    const ctx = this.ui.ctx;
    ctx.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

    // Render player
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Render bullets
    this.bullets.forEach(b => {
      ctx.fillStyle = b.type === 'gun' ? 'yellow' : 'red';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render enemies
    ctx.fillStyle = 'purple';
    this.enemies.forEach(e => {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, 10, 30);

    // Render ammo
    ctx.fillText(`${this.weaponMode}: ${this.weaponMode === 'Gun' ? '∞' : this.bombAmmo}`, 10, 50);

    // Game over screen
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.ui.canvas.width / 2, this.ui.canvas.height / 2 - 20);
      ctx.font = '20px Arial';
      ctx.fillText('Tap to Restart', this.ui.canvas.width / 2, this.ui.canvas.height / 2 + 20);
    }
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  restart() {
    if (!this.gameOver) return;
    this.player = { 
      x: this.ui.canvas.width / 2, // Dynamic restart position
      y: this.ui.canvas.height - 50,
      keyboardSpeed: 5, 
      mobileSpeed: 2, 
      radius: 15,
      dx: 0,
      dy: 0
    };
    this.bullets = [];
    this.enemies = [];
    this.score = 0;
    this.gameOver = false;
    this.bombAmmo = 5;
    this.weaponMode = 'Gun';
    this.isMobileInput = false;
    this.isShooting = false;
  }

  handleResize(width, height) {
    this.player.x = width / 2;
    this.player.y = height - 50;
  }
}

const game = new CosmicDefenderGame(ui);
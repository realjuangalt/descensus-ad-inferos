/**
 * CosmicDefenderGame class
 * Handles the game logic, rendering, and game state
 */
class CosmicDefenderGame {
  constructor(gameInterface) {
    this.interface = gameInterface
    this.canvas = this.interface.canvas
    this.ctx = this.interface.ctx

    // Game variables
    this.player = { x: 0, y: 0, size: 20, color: "#4361ee", speed: 5, direction: 0 }
    this.bullets = []
    this.enemies = []
    this.powerups = []
    this.lastShot = 0
    this.score = 0
    this.gameOver = false

    // Weapon system
    this.weaponMode = "gun" // "gun" or "bomb"
    this.bombAmmo = 10
    this.weaponInfo = document.getElementById("weaponInfo")
    this.updateWeaponInfo()

    // FIX: Share player reference with interface
    this.interface.player = this.player

    // Set up interface callbacks
    this.setupInterfaceCallbacks()
  }

  /**
   * Initialize the game
   */
  init() {
    // Set initial player position
    this.resetPlayerPosition()

    // Start game loop
    this.gameLoop()

    // Spawn enemies periodically
    this.enemySpawnInterval = setInterval(() => this.spawnEnemy(), 2000)
  }

  /**
   * Set up interface callbacks
   */
  setupInterfaceCallbacks() {
    // Set callback for movement
    this.interface.onMove = (dx, dy) => {
      this.player.x += dx * this.player.speed
      this.player.y += dy * this.player.speed

      // Keep player within bounds
      this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x))
      this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y))
    }

    // Set callback for aiming
    this.interface.onAim = (x, y) => {
      // Always treat x and y as canvas coordinates
      const dx = x - this.player.x
      const dy = y - this.player.y

      if (dx !== 0 || dy !== 0) {
        this.player.direction = Math.atan2(dy, dx)
      }
    }

    // Set callback for shooting
    this.interface.onShoot = () => {
      const now = Date.now()
      if (now - this.lastShot > 300) {
        // Fire rate limit
        this.fireWeapon()
        this.lastShot = now
      }
    }

    // Set callback for special action (toggle weapon)
    this.interface.onAction = () => {
      this.toggleWeapon()
      // Reset the action button state after handling the action
      setTimeout(() => {
        this.interface.resetAction()
      }, 100)
    }

    // Set callback for restart
    this.interface.onRestart = () => {
      this.restartGame()
    }

    // Set callback for resize
    this.interface.onResize = (width, height) => {
      this.resetPlayerPosition()
    }
  }

  /**
   * Toggle between weapon modes
   */
  toggleWeapon() {
    if (this.weaponMode === "gun") {
      this.weaponMode = "bomb"
    } else {
      this.weaponMode = "gun"
    }
    this.updateWeaponInfo()
  }

  /**
   * Update the weapon info display
   */
  updateWeaponInfo() {
    if (this.weaponMode === "gun") {
      this.weaponInfo.textContent = "GUN: ∞"
    } else {
      this.weaponInfo.textContent = `BOMB: ${this.bombAmmo}`
    }
  }

  /**
   * Fire the current weapon
   */
  fireWeapon() {
    if (this.weaponMode === "gun") {
      this.fireBullet()
    } else if (this.weaponMode === "bomb" && this.bombAmmo > 0) {
      this.fireBomb()
      this.bombAmmo--
      this.updateWeaponInfo()
    }
  }

  /**
   * Reset player position to center of canvas
   */
  resetPlayerPosition() {
    this.player.x = this.canvas.width / 2
    this.player.y = this.canvas.height / 2
  }

  /**
   * Game loop
   */
  gameLoop() {
    this.update()
    this.render()
    requestAnimationFrame(() => this.gameLoop())
  }

  /**
   * Update game state
   */
  update() {
    if (this.gameOver) return

    // Handle keyboard movement
    const movement = this.interface.getMovementInput()
    if (movement.dx !== 0 || movement.dy !== 0) {
      this.player.x += movement.dx * this.player.speed
      this.player.y += movement.dy * this.player.speed

      // Keep player within bounds
      this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x))
      this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y))
    }

    // Handle shooting with consistent fire rate for all input methods
    if (this.interface.isShooting()) {
      const now = Date.now()
      if (now - this.lastShot > 300) {
        // Fire rate limit
        this.fireWeapon()
        this.lastShot = now
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i]
      bullet.x += bullet.speed * Math.cos(bullet.direction)
      bullet.y += bullet.speed * Math.sin(bullet.direction)

      // Check if bullet hit edge of map (for bombs)
      if (
        bullet.type === "bomb" &&
        (bullet.x < 0 || bullet.x > this.canvas.width || bullet.y < 0 || bullet.y > this.canvas.height)
      ) {
        this.createExplosion(bullet.x, bullet.y)
        this.bullets.splice(i, 1)
        continue
      }

      // Remove bullets that go off-screen (for regular bullets)
      if (
        bullet.type === "bullet" &&
        (bullet.x < 0 || bullet.x > this.canvas.width || bullet.y < 0 || bullet.y > this.canvas.height)
      ) {
        this.bullets.splice(i, 1)
        continue
      }

      // Check for collisions with enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        if (i < 0 || i >= this.bullets.length) break // Skip if bullet was removed

        const dx = this.bullets[i].x - this.enemies[j].x
        const dy = this.bullets[i].y - this.enemies[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < this.bullets[i].size + this.enemies[j].size) {
          // For bombs, create explosion and remove the bomb
          if (this.bullets[i].type === "bomb") {
            this.createExplosion(this.bullets[i].x, this.bullets[i].y)
            this.bullets.splice(i, 1)
            break
          } else {
            // For regular bullets, remove both bullet and enemy
            this.bullets.splice(i, 1)

            // Check if enemy drops bomb ammo (10% chance)
            if (Math.random() < 0.1) {
              this.spawnPowerup(this.enemies[j].x, this.enemies[j].y)
            }

            this.enemies.splice(j, 1)
            this.score += 10
            break
          }
        }
      }
    }

    // Update explosions
    if (this.explosions) {
      for (let i = this.explosions.length - 1; i >= 0; i--) {
        const explosion = this.explosions[i]

        if (explosion.growing) {
          explosion.radius += 5
          explosion.alpha -= 0.02

          if (explosion.radius >= explosion.maxRadius) {
            explosion.growing = false
          }
        } else {
          explosion.alpha -= 0.05

          if (explosion.alpha <= 0) {
            this.explosions.splice(i, 1)
            continue
          }
        }

        // Draw explosion animation
        this.ctx.fillStyle = `rgba(255, 204, 0, ${explosion.alpha * 0.5})`
        this.ctx.beginPath()
        this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2)
        this.ctx.fill()

        this.ctx.fillStyle = `rgba(255, 87, 51, ${explosion.alpha * 0.3})`
        this.ctx.beginPath()
        this.ctx.arc(explosion.x, explosion.y, explosion.radius * 0.7, 0, Math.PI * 2)
        this.ctx.fill()
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      // Move enemies toward player
      const dx = this.player.x - this.enemies[i].x
      const dy = this.player.y - this.enemies[i].y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        this.enemies[i].x += (dx / distance) * this.enemies[i].speed
        this.enemies[i].y += (dy / distance) * this.enemies[i].speed
      }

      // Check for collision with player
      if (distance < this.player.size + this.enemies[i].size) {
        this.gameOver = true
        this.interface.setGameOver(true)
      }
    }

    // Update powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i]

      // Check for collision with player
      const dx = this.player.x - powerup.x
      const dy = this.player.y - powerup.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < this.player.size + powerup.size) {
        // Collect powerup
        if (powerup.type === "bombAmmo") {
          this.bombAmmo += 2
          this.updateWeaponInfo()
        }

        this.powerups.splice(i, 1)
      }
    }
  }

  /**
   * Render game
   */
  render() {
    // Clear canvas
    this.ctx.fillStyle = "#111"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw a simple grid for reference
    this.ctx.strokeStyle = "#222"
    this.ctx.lineWidth = 1
    const gridSize = 50

    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.canvas.height)
      this.ctx.stroke()
    }

    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvas.width, y)
      this.ctx.stroke()
    }

    // Draw player
    this.ctx.fillStyle = this.player.color
    this.ctx.beginPath()
    this.ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2)
    this.ctx.fill()

    // Draw player direction indicator
    this.ctx.strokeStyle = "#fff"
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.moveTo(this.player.x, this.player.y)
    this.ctx.lineTo(
      this.player.x + Math.cos(this.player.direction) * this.player.size * 1.5,
      this.player.y + Math.sin(this.player.direction) * this.player.size * 1.5,
    )
    this.ctx.stroke()

    // Draw bullets
    this.bullets.forEach((bullet) => {
      if (bullet.type === "bullet") {
        this.ctx.fillStyle = "#ff5733"
        this.ctx.beginPath()
        this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2)
        this.ctx.fill()
      } else if (bullet.type === "bomb") {
        // Enhanced bomb visuals
        this.ctx.fillStyle = "#ffcc00"
        this.ctx.beginPath()
        this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2)
        this.ctx.fill()

        // Add glow effect
        this.ctx.fillStyle = "rgba(255, 204, 0, 0.3)"
        this.ctx.beginPath()
        this.ctx.arc(bullet.x, bullet.y, bullet.size * 2, 0, Math.PI * 2)
        this.ctx.fill()

        // Add bomb symbol
        this.ctx.fillStyle = "#000"
        this.ctx.font = "10px Arial"
        this.ctx.textAlign = "center"
        this.ctx.textBaseline = "middle"
        this.ctx.fillText("B", bullet.x, bullet.y)
      }
    })

    // Draw enemies
    this.enemies.forEach((enemy) => {
      this.ctx.fillStyle = enemy.color
      this.ctx.beginPath()
      this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2)
      this.ctx.fill()
    })

    // Draw powerups
    this.powerups.forEach((powerup) => {
      this.ctx.fillStyle = "#ffcc00"
      this.ctx.beginPath()
      this.ctx.arc(powerup.x, powerup.y, powerup.size, 0, Math.PI * 2)
      this.ctx.fill()

      // Draw a "B" inside the powerup
      this.ctx.fillStyle = "#000"
      this.ctx.font = "12px Arial"
      this.ctx.textAlign = "center"
      this.ctx.textBaseline = "middle"
      this.ctx.fillText("B", powerup.x, powerup.y)
    })

    // Draw score
    this.ctx.fillStyle = "#fff"
    this.ctx.font = "20px Arial"
    this.ctx.textAlign = "left"
    this.ctx.fillText(`Score: ${this.score}`, 20, 30)

    // Draw weapon info on canvas
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    this.ctx.fillRect(this.canvas.width - 150, 10, 140, 50)
    this.ctx.fillStyle = "#fff"
    this.ctx.font = "16px Arial"
    this.ctx.textAlign = "left"
    this.ctx.fillText(`Weapon: ${this.weaponMode.toUpperCase()}`, this.canvas.width - 140, 30)

    if (this.weaponMode === "gun") {
      this.ctx.fillText(`Ammo: ∞`, this.canvas.width - 140, 50)
    } else {
      // Make bomb ammo count more visible when low
      if (this.bombAmmo <= 3) {
        this.ctx.fillStyle = "#ff5733"
      }
      this.ctx.fillText(`Ammo: ${this.bombAmmo}`, this.canvas.width - 140, 50)
    }

    // Draw game over message
    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      this.ctx.fillStyle = "#fff"
      this.ctx.font = "40px Arial"
      this.ctx.textAlign = "center"
      this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2 - 20)

      this.ctx.font = "24px Arial"
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20)

      this.ctx.font = "18px Arial"
      this.ctx.fillText("Tap to restart", this.canvas.width / 2, this.canvas.height / 2 + 60)
    }
  }

  /**
   * Fire a regular bullet
   */
  fireBullet() {
    this.bullets.push({
      x: this.player.x + Math.cos(this.player.direction) * this.player.size,
      y: this.player.y + Math.sin(this.player.direction) * this.player.size,
      size: 5,
      speed: 10,
      direction: this.player.direction,
      type: "bullet",
    })
  }

  /**
   * Fire a bomb
   */
  fireBomb() {
    this.bullets.push({
      x: this.player.x + Math.cos(this.player.direction) * this.player.size,
      y: this.player.y + Math.sin(this.player.direction) * this.player.size,
      size: 8,
      speed: 7,
      direction: this.player.direction,
      type: "bomb",
    })
  }

  /**
   * Create an explosion at the specified position
   */
  createExplosion(x, y) {
    // Store explosion for animation
    this.explosions = this.explosions || []
    this.explosions.push({
      x,
      y,
      radius: 10,
      maxRadius: 100,
      alpha: 0.8,
      growing: true,
    })

    // Immediate visual effect
    this.ctx.fillStyle = "rgba(255, 204, 0, 0.7)"
    this.ctx.beginPath()
    this.ctx.arc(x, y, 50, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = "rgba(255, 87, 51, 0.5)"
    this.ctx.beginPath()
    this.ctx.arc(x, y, 80, 0, Math.PI * 2)
    this.ctx.fill()

    // Damage enemies within range
    const explosionRange = 100
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const dx = x - this.enemies[i].x
      const dy = y - this.enemies[i].y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < explosionRange) {
        // Check if enemy drops bomb ammo (10% chance)
        if (Math.random() < 0.1) {
          this.spawnPowerup(this.enemies[i].x, this.enemies[i].y)
        }

        this.enemies.splice(i, 1)
        this.score += 15 // More points for bomb kills
      }
    }
  }

  /**
   * Spawn a powerup at the specified position
   */
  spawnPowerup(x, y) {
    this.powerups.push({
      x,
      y,
      size: 10,
      type: "bombAmmo",
    })
  }

  /**
   * Spawn an enemy
   */
  spawnEnemy() {
    if (this.gameOver) return

    // Spawn from outside the canvas
    let x, y
    const side = Math.floor(Math.random() * 4) // 0: top, 1: right, 2: bottom, 3: left

    switch (side) {
      case 0: // top
        x = Math.random() * this.canvas.width
        y = -30
        break
      case 1: // right
        x = this.canvas.width + 30
        y = Math.random() * this.canvas.height
        break
      case 2: // bottom
        x = Math.random() * this.canvas.width
        y = this.canvas.height + 30
        break
      case 3: // left
        x = -30
        y = Math.random() * this.canvas.height
        break
    }

    this.enemies.push({
      x,
      y,
      size: 15,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      speed: 1 + Math.random() * 2,
    })
  }

  /**
   * Restart game
   */
  restartGame() {
    if (this.gameOver) {
      this.resetPlayerPosition()
      this.bullets = []
      this.enemies = []
      this.powerups = []
      this.score = 0
      this.gameOver = false
      this.weaponMode = "gun"
      this.bombAmmo = 10
      this.updateWeaponInfo()
      this.interface.setGameOver(false)
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    clearInterval(this.enemySpawnInterval)
  }
}

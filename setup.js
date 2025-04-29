/**
 * GameInterface class
 * Handles the interface setup, event listeners, and control logic
 */
class GameInterface {
  constructor() {
    // DOM elements
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.moveThumb = document.getElementById("moveThumb")
    this.aimThumb = document.getElementById("aimThumb")
    this.moveJoystickElem = document.getElementById("moveJoystick")
    this.aimJoystickElem = document.getElementById("aimJoystick")
    this.actionButtonElem = document.getElementById("actionButton")
    this.controlsToggle = document.getElementById("controlsToggle")
    this.controlsPanel = document.getElementById("controlsPanel")

    // Control variables
    this.moveJoystick = { active: false, x: 0, y: 0, baseX: 0, baseY: 0 }
    this.aimJoystick = { active: false, x: 0, y: 0, baseX: 0, baseY: 0, shooting: false }
    this.actionButtonPressed = false

    // Keyboard control variables
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      action: false,
    }

    // Mouse control variables
    this.mouse = {
      x: 0,
      y: 0,
      aiming: false,
      shooting: false,
    }

    // Game callback functions (to be set by the game)
    this.onMove = null
    this.onAim = null
    this.onShoot = null
    this.onAction = null
    this.onRestart = null
  }

  /**
   * Initialize the interface
   */
  init() {
    this.resizeCanvas()
    window.addEventListener("resize", () => this.resizeCanvas())

    // Set up joystick positions
    const moveJoystickRect = this.moveJoystickElem.getBoundingClientRect()
    this.moveJoystick.baseX = moveJoystickRect.left + moveJoystickRect.width / 2
    this.moveJoystick.baseY = moveJoystickRect.top + moveJoystickRect.height / 2

    const aimJoystickRect = this.aimJoystickElem.getBoundingClientRect()
    this.aimJoystick.baseX = aimJoystickRect.left + aimJoystickRect.width / 2
    this.aimJoystick.baseY = aimJoystickRect.top + aimJoystickRect.height / 2

    this.setupKeyboardAndMouseControls()
    this.setupTouchControls()
    this.setupControlsInfo()
  }

  /**
   * Resize the canvas to fit the screen
   */
  resizeCanvas() {
    const gameContainer = document.querySelector(".game-container")
    const containerWidth = gameContainer.clientWidth
    const containerHeight = gameContainer.clientHeight

    this.canvas.width = containerWidth - 10
    this.canvas.height = containerHeight - 10

    // Notify the game of canvas resize
    if (this.onResize) {
      this.onResize(this.canvas.width, this.canvas.height)
    }
  }

  /**
   * Set up keyboard and mouse controls
   */
  setupKeyboardAndMouseControls() {
    // Keyboard event listeners
    window.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          this.keys.up = true
          break
        case "s":
        case "arrowdown":
          this.keys.down = true
          break
        case "a":
        case "arrowleft":
          this.keys.left = true
          break
        case "d":
        case "arrowright":
          this.keys.right = true
          break
        case " ":
          this.keys.action = true
          this.actionButtonPressed = true
          this.actionButtonElem.style.transform = "scale(0.95)"
          if (this.onAction) this.onAction()
          break
      }

      // Update move joystick visually when using keyboard
      this.updateKeyboardJoystick()
    })

    window.addEventListener("keyup", (e) => {
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          this.keys.up = false
          break
        case "s":
        case "arrowdown":
          this.keys.down = false
          break
        case "a":
        case "arrowleft":
          this.keys.left = false
          break
        case "d":
        case "arrowright":
          this.keys.right = false
          break
        case " ":
          this.keys.action = false
          this.actionButtonElem.style.transform = "scale(1)"
          break
      }

      // Update move joystick visually when using keyboard
      this.updateKeyboardJoystick()
    })

    // Mouse event listeners for aiming and shooting
    this.canvas.addEventListener("mousemove", (e) => {
      const canvasRect = this.canvas.getBoundingClientRect()
      this.mouse.x = e.clientX - canvasRect.left
      this.mouse.y = e.clientY - canvasRect.top
      this.mouse.aiming = true

      // Update aim joystick visually
      if (!this.aimJoystick.active) {
        this.updateMouseAimJoystick()
      }

      // Always call onAim with the mouse coordinates
      if (this.onAim) {
        this.onAim(this.mouse.x, this.mouse.y)
      }
    })

    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        // Left click
        this.mouse.shooting = true
        if (this.onShoot) this.onShoot()
      } else if (e.button === 2) {
        // Right click
        this.actionButtonPressed = true
        this.actionButtonElem.style.transform = "scale(0.95)"
        if (this.onAction) this.onAction()
      }

      // Restart game if game over
      if (this.onRestart && this.isGameOver) {
        this.onRestart()
      }
    })

    this.canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        // Left click
        this.mouse.shooting = false
      } else if (e.button === 2) {
        // Right click
        this.actionButtonElem.style.transform = "scale(1)"
      }
    })

    // Prevent context menu on right click
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault()
    })

    // Action button click event
    this.actionButtonElem.addEventListener("mousedown", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.actionButtonPressed = true
      this.actionButtonElem.style.transform = "scale(0.95)"
      if (this.onAction) this.onAction()
    })

    this.actionButtonElem.addEventListener("mouseup", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.actionButtonElem.style.transform = "scale(1)"
    })

    // Mouse events for joysticks
    this.moveJoystickElem.addEventListener("mousedown", (e) => {
      e.preventDefault()

      // Get the current position of the joystick base
      const moveJoystickRect = this.moveJoystickElem.getBoundingClientRect()
      this.moveJoystick.baseX = moveJoystickRect.left + moveJoystickRect.width / 2
      this.moveJoystick.baseY = moveJoystickRect.top + moveJoystickRect.height / 2

      this.moveJoystick.active = true
      this.moveJoystick.x = e.clientX
      this.moveJoystick.y = e.clientY
      this.updateJoystickPosition(this.moveThumb, this.moveJoystick)

      document.addEventListener("mousemove", this.handleMouseMoveForMoveJoystick)
      document.addEventListener("mouseup", this.handleMouseUpForMoveJoystick)
    })

    this.aimJoystickElem.addEventListener("mousedown", (e) => {
      // Don't activate joystick if clicking on the action button
      if (e.target === this.actionButtonElem) return

      e.preventDefault()

      // Get the current position of the joystick base
      const aimJoystickRect = this.aimJoystickElem.getBoundingClientRect()
      this.aimJoystick.baseX = aimJoystickRect.left + aimJoystickRect.width / 2
      this.aimJoystick.baseY = aimJoystickRect.top + aimJoystickRect.height / 2

      this.aimJoystick.active = true
      this.aimJoystick.x = e.clientX
      this.aimJoystick.y = e.clientY
      this.updateJoystickPosition(this.aimThumb, this.aimJoystick)

      document.addEventListener("mousemove", this.handleMouseMoveForAimJoystick)
      document.addEventListener("mouseup", this.handleMouseUpForAimJoystick)
    })

    // Bind event handlers to this instance
    this.handleMouseMoveForMoveJoystick = this.handleMouseMoveForMoveJoystick.bind(this)
    this.handleMouseUpForMoveJoystick = this.handleMouseUpForMoveJoystick.bind(this)
    this.handleMouseMoveForAimJoystick = this.handleMouseMoveForAimJoystick.bind(this)
    this.handleMouseUpForAimJoystick = this.handleMouseUpForAimJoystick.bind(this)
  }

  handleMouseMoveForMoveJoystick(e) {
    if (this.moveJoystick.active) {
      this.moveJoystick.x = e.clientX
      this.moveJoystick.y = e.clientY
      this.updateJoystickPosition(this.moveThumb, this.moveJoystick)

      // Calculate movement direction
      const dx = this.moveJoystick.x - this.moveJoystick.baseX
      const dy = this.moveJoystick.y - this.moveJoystick.baseY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxDistance = 40

      if (distance > 0 && this.onMove) {
        const factor = Math.min(distance, maxDistance) / maxDistance * 0.375;
        this.onMove((dx / distance) * factor, (dy / distance) * factor)
      }
    }
  }

  handleMouseUpForMoveJoystick(e) {
    this.moveJoystick.active = false
    this.resetJoystickPosition(this.moveThumb)
    document.removeEventListener("mousemove", this.handleMouseMoveForMoveJoystick)
    document.removeEventListener("mouseup", this.handleMouseUpForMoveJoystick)
  }

  handleMouseMoveForAimJoystick(e) {
    if (this.aimJoystick.active) {
      // Get the current position of the joystick base
      const aimJoystickRect = this.aimJoystickElem.getBoundingClientRect()
      this.aimJoystick.baseX = aimJoystickRect.left + aimJoystickRect.width / 2
      this.aimJoystick.baseY = aimJoystickRect.top + aimJoystickRect.height / 2

      // Update the joystick position to the current mouse position
      this.aimJoystick.x = e.clientX
      this.aimJoystick.y = e.clientY

      // Update the visual position of the joystick thumb
      this.updateJoystickPosition(this.aimThumb, this.aimJoystick)

      // Calculate aim direction
      const dx = this.aimJoystick.x - this.aimJoystick.baseX
      const dy = this.aimJoystick.y - this.aimJoystick.baseY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0 && this.onAim) {
        // Calculate direction in canvas coordinates
        const canvasRect = this.canvas.getBoundingClientRect()
        const playerScreenX = this.player ? this.player.x : this.canvas.width / 2
        const playerScreenY = this.player ? this.player.y : this.canvas.height / 2

        // Use the normalized direction to aim
        this.onAim(
          playerScreenX + (dx / distance) * this.canvas.width * 0.5,
          playerScreenY + (dy / distance) * this.canvas.height * 0.5,
        )

        // Only shoot if the joystick has been moved from center
        if (distance > 5) {
          // Set shooting flag but don't call onShoot directly
          // The game update loop will handle the fire rate
          this.aimJoystick.shooting = true
        }
      }
    }
  }

  handleMouseUpForAimJoystick(e) {
    this.aimJoystick.active = false
    this.aimJoystick.shooting = false
    this.resetJoystickPosition(this.aimThumb)
    document.removeEventListener("mousemove", this.handleMouseMoveForAimJoystick)
    document.removeEventListener("mouseup", this.handleMouseUpForAimJoystick)
  }

  /**
   * Set up touch controls
   */
  setupTouchControls() {
    // Touch event handlers for joysticks
    document.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault()

        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]
          const touchX = touch.clientX
          const touchY = touch.clientY

          // Check if touch is on action button
          const actionButtonRect = this.actionButtonElem.getBoundingClientRect()
          if (
            touchX >= actionButtonRect.left &&
            touchX <= actionButtonRect.right &&
            touchY >= actionButtonRect.top &&
            touchY <= actionButtonRect.bottom
          ) {
            this.actionButtonPressed = true
            this.actionButtonElem.style.transform = "scale(0.95)"
            if (this.onAction) this.onAction()
            continue // Skip other checks if action button was pressed
          }

          // Check if touch is on move joystick
          const moveJoystickRect = this.moveJoystickElem.getBoundingClientRect()
          if (
            touchX >= moveJoystickRect.left &&
            touchX <= moveJoystickRect.right &&
            touchY >= moveJoystickRect.top &&
            touchY <= moveJoystickRect.bottom
          ) {
            this.moveJoystick.active = true
            this.moveJoystick.id = touch.identifier

            // Update base position
            this.moveJoystick.baseX = moveJoystickRect.left + moveJoystickRect.width / 2
            this.moveJoystick.baseY = moveJoystickRect.top + moveJoystickRect.height / 2

            this.moveJoystick.x = touchX
            this.moveJoystick.y = touchY
            this.updateJoystickPosition(this.moveThumb, this.moveJoystick)
          }

          // Check if touch is on aim joystick
          const aimJoystickRect = this.aimJoystickElem.getBoundingClientRect()
          if (
            touchX >= aimJoystickRect.left &&
            touchX <= aimJoystickRect.right &&
            touchY >= aimJoystickRect.top &&
            touchY <= aimJoystickRect.bottom
          ) {
            this.aimJoystick.active = true
            this.aimJoystick.id = touch.identifier

            // Update base position
            this.aimJoystick.baseX = aimJoystickRect.left + aimJoystickRect.width / 2
            this.aimJoystick.baseY = aimJoystickRect.top + aimJoystickRect.height / 2

            this.aimJoystick.x = touchX
            this.aimJoystick.y = touchY
            this.updateJoystickPosition(this.aimThumb, this.aimJoystick)
          }

          // Check if touch is on canvas when game is over (to restart)
          if (this.isGameOver && this.onRestart) {
            const canvasRect = this.canvas.getBoundingClientRect()
            if (
              touchX >= canvasRect.left &&
              touchX <= canvasRect.right &&
              touchY >= canvasRect.top &&
              touchY <= canvasRect.bottom
            ) {
              this.onRestart()
            }
          }
        }
      },
      { passive: false },
    )

    document.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault()

        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]

          // Update move joystick
          if (this.moveJoystick.active && touch.identifier === this.moveJoystick.id) {
            this.moveJoystick.x = touch.clientX
            this.moveJoystick.y = touch.clientY
            this.updateJoystickPosition(this.moveThumb, this.moveJoystick)

            // Calculate movement direction
            const dx = this.moveJoystick.x - this.moveJoystick.baseX
            const dy = this.moveJoystick.y - this.moveJoystick.baseY
            const distance = Math.sqrt(dx * dx + dy * dy)
            const maxDistance = 40

            if (distance > 0 && this.onMove) {
              // Increase movement sensitivity to match keyboard controls
              const factor = (Math.min(distance, maxDistance) / maxDistance) * 1.5
              this.onMove((dx / distance) * factor, (dy / distance) * factor)
            }
          }

          // Update aim joystick
          if (this.aimJoystick.active && touch.identifier === this.aimJoystick.id) {
            this.aimJoystick.x = touch.clientX
            this.aimJoystick.y = touch.clientY
            this.updateJoystickPosition(this.aimThumb, this.aimJoystick)

            // Calculate aim direction
            const dx = this.aimJoystick.x - this.aimJoystick.baseX
            const dy = this.aimJoystick.y - this.aimJoystick.baseY
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance > 0 && this.onAim) {
              // Calculate direction in canvas coordinates
              const canvasRect = this.canvas.getBoundingClientRect()
              const playerScreenX = this.player ? this.player.x : this.canvas.width / 2
              const playerScreenY = this.player ? this.player.y : this.canvas.height / 2

              // Use the normalized direction to aim
              this.onAim(
                playerScreenX + (dx / distance) * this.canvas.width * 0.5,
                playerScreenY + (dy / distance) * this.canvas.height * 0.5,
              )

              // Only shoot if the joystick has been moved from center
              if (distance > 5) {
                // Set shooting flag but don't call onShoot directly
                // The game update loop will handle the fire rate
                this.aimJoystick.shooting = true
              } else {
                this.aimJoystick.shooting = false
              }
            }
          }
        }
      },
      { passive: false },
    )

    document.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault()

        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]

          // Reset move joystick
          if (this.moveJoystick.active && touch.identifier === this.moveJoystick.id) {
            this.moveJoystick.active = false
            this.resetJoystickPosition(this.moveThumb)
          }

          // Reset aim joystick
          if (this.aimJoystick.active && touch.identifier === this.aimJoystick.id) {
            this.aimJoystick.active = false
            this.aimJoystick.shooting = false
            this.resetJoystickPosition(this.aimThumb)
          }
        }

        // Reset action button
        this.actionButtonElem.style.transform = "scale(1)"
      },
      { passive: false },
    )

    // Specific touch handler for action button
    this.actionButtonElem.addEventListener("touchstart", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.actionButtonPressed = true
      this.actionButtonElem.style.transform = "scale(0.95)"
      if (this.onAction) this.onAction()
    })

    this.actionButtonElem.addEventListener("touchend", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.actionButtonElem.style.transform = "scale(1)"
    })
  }

  /**
   * Set up controls info panel
   */
  setupControlsInfo() {
    this.controlsToggle.addEventListener("click", () => {
      if (this.controlsPanel.style.display === "block") {
        this.controlsPanel.style.display = "none"
      } else {
        this.controlsPanel.style.display = "block"
      }
    })
  }

  /**
   * Update joystick position based on keyboard input
   */
  updateKeyboardJoystick() {
    let dx = 0
    let dy = 0

    if (this.keys.up) dy -= 1
    if (this.keys.down) dy += 1
    if (this.keys.left) dx -= 1
    if (this.keys.right) dx += 1

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy)
      dx /= length
      dy /= length
    }

    // Update move joystick visually
    if ((dx !== 0 || dy !== 0) && !this.moveJoystick.active) {
      this.moveJoystick.x = this.moveJoystick.baseX + dx * 40
      this.moveJoystick.y = this.moveJoystick.baseY + dy * 40
      this.updateJoystickPosition(this.moveThumb, this.moveJoystick)

      // Notify game of movement
      if (this.onMove) {
        this.onMove(dx, dy)
      }
    } else if (dx === 0 && dy === 0 && !this.moveJoystick.active) {
      this.resetJoystickPosition(this.moveThumb)
    }
  }

  /**
   * Update aim joystick based on mouse position
   */
  updateMouseAimJoystick() {
    // Use actual player position if available, otherwise use canvas center
    const playerX = this.player ? this.player.x : this.canvas.width / 2
    const playerY = this.player ? this.player.y : this.canvas.height / 2

    const dx = (this.mouse.x - playerX) / 3 // Scale down the movement
    const dy = (this.mouse.y - playerY) / 3
    const maxDistance = 40
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > maxDistance) {
      const factor = maxDistance / distance
      this.aimJoystick.x = this.aimJoystick.baseX + dx * factor
      this.aimJoystick.y = this.aimJoystick.baseY + dy * factor
    } else {
      this.aimJoystick.x = this.aimJoystick.baseX + dx
      this.aimJoystick.y = this.aimJoystick.baseY + dy
    }

    this.updateJoystickPosition(this.aimThumb, this.aimJoystick)
  }

  /**
   * Update joystick thumb position
   */
  updateJoystickPosition(thumbElem, joystick) {
    const dx = joystick.x - joystick.baseX
    const dy = joystick.y - joystick.baseY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = 40 // Max joystick movement

    if (distance <= maxDistance) {
      thumbElem.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
    } else {
      const factor = maxDistance / distance
      const limitedDx = dx * factor
      const limitedDy = dy * factor
      thumbElem.style.transform = `translate(calc(-50% + ${limitedDx}px), calc(-50% + ${limitedDy}px))`

      // Update joystick position to the limited position
      joystick.x = joystick.baseX + limitedDx
      joystick.y = joystick.baseY + limitedDy
    }
  }

  /**
   * Reset joystick thumb position
   */
  resetJoystickPosition(thumbElem) {
    thumbElem.style.transform = "translate(-50%, -50%)"
  }

  /**
   * Set game over state
   */
  setGameOver(isGameOver) {
    this.isGameOver = isGameOver
  }

  /**
   * Get movement input (for keyboard)
   */
  getMovementInput() {
    let dx = 0
    let dy = 0

    if (this.keys.up) dy -= 1
    if (this.keys.down) dy += 1
    if (this.keys.left) dx -= 1
    if (this.keys.right) dx += 1

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy)
      dx /= length
      dy /= length
    }

    return { dx, dy }
  }

  /**
   * Get aim input (for mouse)
   */
  getAimInput() {
    return { x: this.mouse.x, y: this.mouse.y }
  }

  /**
   * Check if shooting
   */
  isShooting() {
    return this.mouse.shooting || this.aimJoystick.shooting
  }

  /**
   * Check if action button is pressed
   */
  isActionPressed() {
    return this.actionButtonPressed
  }

  /**
   * Reset action button
   */
  resetAction() {
    this.actionButtonPressed = false
  }
}

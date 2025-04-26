game.js
console.log('game.js loaded successfully');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const healthBar = document.getElementById('healthBar');
const manaBar = document.getElementById('manaBar');
const killCountDisplay = document.getElementById('killCount');
const gameOverScreen = document.getElementById('gameOver');
const aimToggleButton = document.getElementById('aimToggle');

const CHUNK_SIZE = 400;
const VISIBLE_RANGE = 400;
const FIREBALL_FADE_RANGE = VISIBLE_RANGE * 1.5;
const DESPAWN_RANGE = VISIBLE_RANGE * 3;
const MINIMUM_DISTANCE = 64;

let scaleX = 1;
let scaleY = 1;

function updateCanvasScaling() {
  const rect = canvas.getBoundingClientRect();
  scaleX = canvas.width / rect.width;
  scaleY = canvas.height / rect.height;
}

window.addEventListener('resize', updateCanvasScaling);
updateCanvasScaling();

const gameState = {
  player: {
    worldX: 0,
    worldY: 0,
    screenX: canvas.width / 2 - 32,
    screenY: canvas.height / 2 - 32,
    size: 64,
    speed: 2.5,
    health: 10,
    maxHealth: 10,
    mana: 20,
    maxMana: 20,
    lastShot: 0,
    lastMelee: 0,
    direction: 'down',
    lastLavaDamage: 0,
    isHellish: false
  },
  camera: {
    x: 0,
    y: 0
  },
  enemies: [],
  obstacles: [],
  chunks: new Map(),
  waveCount: 1,
  killCount: 0,
  isGameStarted: false,
  isInDialogue: false,
  isIntroductionActive: true,
  playerBullets: [],
  enemyBullets: [],
  isFiring: false,
  isMeleeAttacking: false,
  meleeAttackStart: 0,
  useAutoAim: false,
  mouseX: 0,
  mouseY: 0,
  hasFired: false,
  keys: {},
  lastTime: performance.now(),
  mapTile: { width: 32, height: 32, color: '#8B0000' },
  sprites: {
    jesusUp: { image: new Image(), loaded: false },
    jesusDown: { image: new Image(), loaded: false },
    jesusLeft: { image: new Image(), loaded: false },
    jesusRight: { image: new Image(), loaded: false },
    satanUp: { image: new Image(), loaded: false },
    satanDown: { image: new Image(), loaded: false },
    satanLeft: { image: new Image(), loaded: false },
    satanRight: { image: new Image(), loaded: false },
    fireball: { image: new Image(), loaded: false },
    rock: { image: new Image(), loaded: false },
    lava: { image: new Image(), loaded: false }
  },
  spritesLoaded: 0
};

aimToggleButton.addEventListener('click', () => {
  gameState.useAutoAim = !gameState.useAutoAim;
  aimToggleButton.textContent = gameState.useAutoAim ? 'Auto Aim' : 'Mouse Aim';
  console.log('Aim mode toggled to:', gameState.useAutoAim ? 'Auto Aim' : 'Mouse Aim');
});

function findNearestEnemy() {
  let nearestEnemy = null;
  let minDistance = Infinity;

  gameState.enemies.forEach(enemy => {
    if (enemy.health <= 0) return;
    const dx = (gameState.player.worldX + gameState.player.size / 2) - (enemy.worldX + enemy.size / 2);
    const dy = (gameState.player.worldY + gameState.player.size / 2) - (enemy.worldY + enemy.size / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < minDistance) {
      minDistance = distance;
      nearestEnemy = enemy;
    }
  });

  return { enemy: nearestEnemy, distance: minDistance };
}

function getChunkKey(x, y) {
  const chunkX = Math.floor(x / CHUNK_SIZE);
  const chunkY = Math.floor(y / CHUNK_SIZE);
  return `${chunkX},${chunkY}`;
}

function generateChunk(chunkX, chunkY) {
  const chunkKey = `${chunkX},${chunkY}`;
  if (gameState.chunks.has(chunkKey)) return;

  const chunk = {
    obstacles: [],
    enemies: []
  };

  const numRocks = Math.floor(Math.random() * 3) + 1;
  const numLavaPits = Math.floor(Math.random() * 2) + 1;

  for (let i = 0; i < numRocks; i++) {
    const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    const y = chunkY * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    if (!isTooCloseToCharacters(x, y)) {
      chunk.obstacles.push({
        type: 'rock',
        x: x,
        y: y,
        radius: 32,
        health: 5,
        hitEffect: 0
      });
    }
  }

  for (let i = 0; i < numLavaPits; i++) {
    const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    const y = chunkY * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    if (!isTooCloseToCharacters(x, y)) {
      chunk.obstacles.push({
        type: 'lava',
        x: x,
        y: y,
        radius: 32
      });
    }
  }

  if (!gameState.isIntroductionActive) {
    const numEnemies = Math.floor(Math.random() * gameState.waveCount) + 1;
    for (let i = 0; i < numEnemies; i++) {
      const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
      const y = chunkY * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
      if (!isTooCloseToCharacters(x, y)) {
        chunk.enemies.push({
          worldX: x,
          worldY: y,
          size: 64,
          health: 2,
          speed: 1,
          lastAttack: 0,
          hostile: true,
          direction: 'down',
          hitEffect: 0,
          isHellish: true,
          id: `enemy_${i}` // Unique ID for potential future dialogues
        });
      }
    }
  }

  gameState.chunks.set(chunkKey, chunk);
  gameState.obstacles.push(...chunk.obstacles);
  gameState.enemies.push(...chunk.enemies);
}

function updateChunks() {
  const playerChunkX = Math.floor(gameState.player.worldX / CHUNK_SIZE);
  const playerChunkY = Math.floor(gameState.player.worldY / CHUNK_SIZE);

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const chunkX = playerChunkX + dx;
      const chunkY = playerChunkY + dy;
      generateChunk(chunkX, chunkY);
    }
  }

  const playerX = gameState.player.worldX;
  const playerY = gameState.player.worldY;

  const chunksToRemove = [];
  gameState.chunks.forEach((chunk, key) => {
    const [chunkX, chunkY] = key.split(',').map(Number);
    const chunkCenterX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
    const chunkCenterY = chunkY * CHUNK_SIZE + CHUNK_SIZE / 2;
    const dx = playerX - chunkCenterX;
    const dy = playerY - chunkCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > DESPAWN_RANGE) {
      chunksToRemove.push(key);
      chunk.obstacles.forEach(obstacle => {
        gameState.obstacles = gameState.obstacles.filter(obs => obs !== obstacle);
      });
      chunk.enemies.forEach(enemy => {
        gameState.enemies = gameState.enemies.filter(en => en !== enemy);
      });
    }
  });
  chunksToRemove.forEach(key => gameState.chunks.delete(key));

  gameState.enemies = gameState.enemies.filter((enemy, index) => {
    if (gameState.isIntroductionActive && index === 0) return true;
    const dx = playerX - (enemy.worldX + enemy.size / 2);
    const dy = playerY - (enemy.worldY + enemy.size / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= DESPAWN_RANGE;
  });

  gameState.obstacles = gameState.obstacles.filter(obstacle => {
    const dx = playerX - obstacle.x;
    const dy = playerY - obstacle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= DESPAWN_RANGE;
  });

  gameState.playerBullets = gameState.playerBullets.filter(bullet => {
    const dx = playerX - bullet.worldX;
    const dy = playerY - bullet.worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= DESPAWN_RANGE;
  });

  gameState.enemyBullets = gameState.enemyBullets.filter(bullet => {
    const dx = playerX - bullet.worldX;
    const dy = playerY - bullet.worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= DESPAWN_RANGE;
  });
}

function isTooCloseToCharacters(x, y) {
  const minDistance = 100;
  const playerDistance = Math.sqrt((x - (gameState.player.worldX + gameState.player.size / 2)) ** 2 + (y - (gameState.player.worldY + gameState.player.size / 2)) ** 2);
  if (playerDistance < minDistance) return true;

  for (let enemy of gameState.enemies) {
    const enemyDistance = Math.sqrt((x - (enemy.worldX + enemy.size / 2)) ** 2 + (y - (enemy.worldY + enemy.size / 2)) ** 2);
    if (enemyDistance < minDistance) return true;
  }

  for (let obstacle of gameState.obstacles) {
    const obstacleDistance = Math.sqrt((x - obstacle.x) ** 2 + (y - obstacle.y) ** 2);
    if (obstacleDistance < minDistance) return true;
  }

  return false;
}

function checkCollision(entity, obstacles, newX, newY) {
  for (let obstacle of obstacles) {
    if (obstacle.type !== 'rock') continue;

    const entityCenterX = newX + entity.size / 2;
    const entityCenterY = newY + entity.size / 2;
    const obstacleCenterX = obstacle.x;
    const obstacleCenterY = obstacle.y;

    const dx = entityCenterX - obstacleCenterX;
    const dy = entityCenterY - obstacleCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = (entity.size / 2) + obstacle.radius;

    if (distance < minDistance) {
      const overlap = minDistance - distance;
      const angle = Math.atan2(dy, dx);
      const pushX = overlap * Math.cos(angle);
      const pushY = overlap * Math.sin(angle);

      return {
        obstacle: obstacle,
        pushX: pushX,
        pushY: pushY,
        distance: distance,
        minDistance: minDistance
      };
    }
  }
  return null;
}

function checkLavaCollision(entity, obstacles) {
  for (let obstacle of obstacles) {
    if (obstacle.type === 'lava') {
      const entityCenterX = entity.worldX + entity.size / 2;
      const entityCenterY = entity.worldY + entity.size / 2;
      const obstacleCenterX = obstacle.x;
      const obstacleCenterY = obstacle.y;

      const dx = entityCenterX - obstacleCenterX;
      const dy = entityCenterY - obstacleCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (entity.size / 2) + obstacle.radius;

      if (distance < minDistance) {
        return obstacle;
      }
    }
  }
  return null;
}

function checkObstacleCollision(bullet, obstacles) {
  for (let obstacle of obstacles) {
    if (obstacle.type === 'rock') {
      const bulletCenterX = bullet.worldX;
      const bulletCenterY = bullet.worldY;
      const obstacleCenterX = obstacle.x;
      const obstacleCenterY = obstacle.y;

      const dx = bulletCenterX - obstacleCenterX;
      const dy = bulletCenterY - obstacleCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (bullet.size / 2) + obstacle.radius;

      if (distance < minDistance) {
        obstacle.health--;
        obstacle.hitEffect = 100;
        if (obstacle.health <= 0) {
          gameState.obstacles = gameState.obstacles.filter(obs => obs !== obstacle);
        }
        return true;
      }
    }
  }
  return false;
}

function updateBars() {
  healthBar.style.height = `${(gameState.player.health / gameState.player.maxHealth) * 100}%`;
  manaBar.style.height = `${(gameState.player.mana / gameState.player.maxMana) * 100}%`;
}

function tryFireSpell(timestamp) {
  if (gameState.player.mana >= 1 && (gameState.isFiring || gameState.hasFired) && timestamp - gameState.player.lastShot >= 100) {
    let dx, dy, distance;
    if (gameState.useAutoAim) {
      const nearest = findNearestEnemy();
      if (!nearest.enemy) return;
      dx = (nearest.enemy.worldX + nearest.enemy.size / 2) - (gameState.player.worldX + gameState.player.size / 2);
      dy = (nearest.enemy.worldY + nearest.enemy.size / 2) - (gameState.player.worldY + gameState.player.size / 2);
      distance = Math.sqrt(dx * dx + dy * dy);
    } else {
      const mouseWorldX = gameState.mouseX + gameState.camera.x;
      const mouseWorldY = gameState.mouseY + gameState.camera.y;
      dx = mouseWorldX - (gameState.player.worldX + gameState.player.size / 2);
      dy = mouseWorldY - (gameState.player.worldY + gameState.player.size / 2);
      distance = Math.sqrt(dx * dx + dy * dy);
    }

    console.log('Firing spell:', { isFiring: gameState.isFiring, hasFired: gameState.hasFired, mana: gameState.player.mana, lastShot: timestamp - gameState.player.lastShot, useAutoAim: gameState.useAutoAim });
    const speed = 7;
    gameState.playerBullets.push({
      worldX: gameState.player.worldX + gameState.player.size / 2,
      worldY: gameState.player.worldY + gameState.player.size / 2,
      dx: (dx / distance) * speed,
      dy: (dy / distance) * speed,
      size: 10
    });
    gameState.player.mana--;
    gameState.player.lastShot = timestamp;
    gameState.hasFired = false;
    updateBars();
  } else if ((gameState.isFiring || gameState.hasFired) && gameState.player.mana < 1) {
    tryMeleeAttack(timestamp);
  }
}

function tryMeleeAttack(timestamp) {
  if (timestamp - gameState.player.lastMelee < 500) return;
  console.log('Performing melee attack:', { lastMelee: timestamp - gameState.player.lastMelee });

  gameState.isMeleeAttacking = true;
  gameState.meleeAttackStart = timestamp;
  gameState.player.lastMelee = timestamp;

  let dx, dy, targetDirection;
  if (gameState.useAutoAim) {
    const nearest = findNearestEnemy();
    if (!nearest.enemy || nearest.distance > 32) return;
    dx = (nearest.enemy.worldX + nearest.enemy.size / 2) - (gameState.player.worldX + gameState.player.size / 2);
    dy = (nearest.enemy.worldY + nearest.enemy.size / 2) - (gameState.player.worldY + gameState.player.size / 2);
    const angle = Math.atan2(dy, dx);
    if (Math.abs(dx) > Math.abs(dy)) {
      targetDirection = dx > 0 ? 'right' : 'left';
    } else {
      targetDirection = dy > 0 ? 'down' : 'up';
    }
  } else {
    const mouseWorldX = gameState.mouseX + gameState.camera.x;
    const mouseWorldY = gameState.mouseY + gameState.camera.y;
    dx = mouseWorldX - (gameState.player.worldX + gameState.player.size / 2);
    dy = mouseWorldY - (gameState.player.worldY + gameState.player.size / 2);
    const angle = Math.atan2(dy, dx);
    if (Math.abs(dx) > Math.abs(dy)) {
      targetDirection = dx > 0 ? 'right' : 'left';
    } else {
      targetDirection = dy > 0 ? 'down' : 'up';
    }
  }

  gameState.player.direction = targetDirection;

  gameState.enemies = gameState.enemies.filter(enemy => {
    const dx = (gameState.player.worldX + gameState.player.size / 2) - (enemy.worldX + enemy.size / 2);
    const dy = (gameState.player.worldY + gameState.player.size / 2) - (enemy.worldY + enemy.size / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= 32) {
      enemy.health--;
      enemy.hitEffect = 100;
      if (!enemy.hostile) {
        if (gameState.isInDialogue) {
          endDialogue();
        } else {
          enemy.hostile = true;
          enemy.speed = 1;
          gameState.isGameStarted = true;
          gameState.isIntroductionActive = false;
        }
      }
      if (enemy.health <= 0) {
        gameState.killCount++;
        gameState.player.mana = Math.min(gameState.player.mana + 5, gameState.player.maxMana);
        killCountDisplay.textContent = `${gameState.killCount}`;
        updateBars();
        if (gameState.waveCount === 1 && gameState.enemies.indexOf(enemy) === 0) {
          gameState.isGameStarted = true;
          gameState.isIntroductionActive = false;
        }
        return false;
      }
      return true;
    }
    return true;
  });

  gameState.hasFired = false;
}

function checkDialogue() {
  if (!gameState.isIntroductionActive || gameState.enemies.length === 0 || gameState.isInDialogue) return;
  const distance = Math.sqrt((gameState.player.worldX - gameState.enemies[0].worldX) ** 2 + (gameState.player.worldY - gameState.enemies[0].worldY) ** 2);
  if (distance < 200 && gameState.enemies[0].health > 0) {
    gameState.isInDialogue = true;
    loadDialogue('level1', 'satan');
  }
}

function updateCamera() {
  gameState.camera.x = gameState.player.worldX - canvas.width / 2 + gameState.player.size / 2;
  gameState.camera.y = gameState.player.worldY - canvas.height / 2 + gameState.player.size / 2;
}

function updatePlayerMovement(delta) {
  let newWorldX = gameState.player.worldX;
  let newWorldY = gameState.player.worldY;

  if (gameState.keys['w']) {
    newWorldY -= gameState.player.speed * delta;
    gameState.player.direction = 'up';
  }
  if (gameState.keys['s']) {
    newWorldY += gameState.player.speed * delta;
    gameState.player.direction = 'down';
  }
  if (gameState.keys['a']) {
    newWorldX -= gameState.player.speed * delta;
    gameState.player.direction = 'left';
  }
  if (gameState.keys['d']) {
    newWorldX += gameState.player.speed * delta;
    gameState.player.direction = 'right';
  }

  const collision = checkCollision(gameState.player, gameState.obstacles, newWorldX, newWorldY);
  if (collision) {
    const { pushX, pushY, distance, minDistance } = collision;
    const overlap = minDistance - distance;
    if (overlap > 0) {
      newWorldX += pushX;
      newWorldY += pushY;
    }
  }

  gameState.player.worldX = newWorldX;
  gameState.player.worldY = newWorldY;

  updateChunks();

  const lavaCollision = checkLavaCollision(gameState.player, gameState.obstacles);
  if (lavaCollision && !gameState.player.isHellish) {
    const currentTime = performance.now();
    if (currentTime - gameState.player.lastLavaDamage >= 1000) {
      gameState.player.health--;
      gameState.player.lastLavaDamage = currentTime;
      updateBars();
    }
  }
}

function updateEnemies(delta, timestamp) {
  gameState.enemies.forEach((enemy, index) => {
    if (enemy.health <= 0) return;

    const dx = gameState.player.worldX - enemy.worldX;
    const dy = gameState.player.worldY - enemy.worldY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (gameState.isIntroductionActive && index !== 0) return;

    if (gameState.isIntroductionActive && index === 0 && !enemy.hostile) {
      if (distance > MINIMUM_DISTANCE) {
        let newWorldX = enemy.worldX + (dx / distance) * enemy.speed * delta;
        let newWorldY = enemy.worldY + (dy / distance) * enemy.speed * delta;

        const collision = checkCollision(enemy, gameState.obstacles, newWorldX, newWorldY);
        if (collision) {
          const { pushX, pushY, distance, minDistance } = collision;
          const overlap = minDistance - distance;
          if (overlap > 0) {
            newWorldX += pushX;
            newWorldY += pushY;
          }
        }

        enemy.worldX = newWorldX;
        enemy.worldY = newWorldY;

        const angle = Math.atan2(dy, dx);
        if (Math.abs(dx) > Math.abs(dy)) {
          enemy.direction = dx > 0 ? 'right' : 'left';
        } else {
          enemy.direction = dy > 0 ? 'down' : 'up';
        }
      }
    } else {
      if (distance > 1 && (gameState.waveCount === 1 || enemy.hostile)) {
        let newWorldX = enemy.worldX + (dx / distance) * enemy.speed * delta;
        let newWorldY = enemy.worldY + (dy / distance) * enemy.speed * delta;

        const collision = checkCollision(enemy, gameState.obstacles, newWorldX, newWorldY);
        if (collision) {
          const { pushX, pushY, distance, minDistance } = collision;
          const overlap = minDistance - distance;
          if (overlap > 0) {
            newWorldX += pushX;
            newWorldY += pushY;
          }
        }

        enemy.worldX = newWorldX;
        enemy.worldY = newWorldY;

        const angle = Math.atan2(dy, dx);
        if (Math.abs(dx) > Math.abs(dy)) {
          enemy.direction = dx > 0 ? 'right' : 'left';
        } else {
          enemy.direction = dy > 0 ? 'down' : 'up';
        }
      }
    }

    const screenX = enemy.worldX - gameState.camera.x;
    const screenY = enemy.worldY - gameState.camera.y;
    const isVisible = screenX >= 0 && screenX <= canvas.width && screenY >= 0 && screenY <= canvas.height;

    if (enemy.hostile && isVisible && timestamp - enemy.lastAttack > 2000) {
      const angle = Math.atan2(dy, dx);
      const spread = Math.PI / 4;
      for (let i = -2; i <= 2; i++) {
        const fireballAngle = angle + (i * spread / 4);
        const speed = 3;
        gameState.enemyBullets.push({
          worldX: enemy.worldX + enemy.size / 2,
          worldY: enemy.worldY + enemy.size / 2,
          startX: enemy.worldX + enemy.size / 2,
          startY: enemy.worldY + enemy.size / 2,
          dx: Math.cos(fireballAngle) * speed,
          dy: Math.sin(fireballAngle) * speed,
          size: 20
        });
      }
      enemy.lastAttack = timestamp;
    }

    if (enemy.hitEffect > 0) {
      enemy.hitEffect -= delta * 16.67;
      if (enemy.hitEffect < 0) enemy.hitEffect = 0;
    }

    const lavaCollision = checkLavaCollision(enemy, gameState.obstacles);
    if (lavaCollision && !enemy.isHellish) {
      const currentTime = performance.now();
      if (currentTime - enemy.lastLavaDamage >= 1000) {
        enemy.health--;
        enemy.lastLavaDamage = currentTime;
      }
    }
  });
}

function updatePlayerBullets(delta) {
  gameState.playerBullets = gameState.playerBullets.filter(bullet => {
    bullet.worldX += bullet.dx * delta;
    bullet.worldY += bullet.dy * delta;
    let hitEnemy = false;
    let hitObstacle = checkObstacleCollision(bullet, gameState.obstacles);

    if (hitObstacle) return false;

    gameState.enemies.forEach(enemy => {
      if (enemy.health > 0 &&
          bullet.worldX > enemy.worldX && bullet.worldX < enemy.worldX + enemy.size &&
          bullet.worldY > enemy.worldY && bullet.worldY < enemy.worldY + enemy.size) {
        enemy.health--;
        enemy.hitEffect = 100;
        if (!enemy.hostile) {
          if (gameState.isInDialogue) {
            endDialogue();
          } else {
            enemy.hostile = true;
            enemy.speed = 1;
            gameState.isGameStarted = true;
            gameState.isIntroductionActive = false;
          }
        }
        if (enemy.health <= 0) {
          gameState.killCount++;
          gameState.player.mana = Math.min(gameState.player.mana + 3, gameState.player.maxMana);
          if (Math.random() < 0.25) {
            gameState.player.health = Math.min(gameState.player.health + 2, gameState.player.maxHealth);
          }
          killCountDisplay.textContent = `${gameState.killCount}`;
          updateBars();
        }
        hitEnemy = true;
      }
    });

    if (hitEnemy) return false;
    return true;
  });
}

function updateEnemyBullets(delta) {
  gameState.enemyBullets = gameState.enemyBullets.filter(bullet => {
    bullet.worldX += bullet.dx * delta;
    bullet.worldY += bullet.dy * delta;
    let hitPlayer = false;
    let hitObstacle = checkObstacleCollision(bullet, gameState.obstacles);

    if (hitObstacle) return false;

    const dx = bullet.worldX - bullet.startX;
    const dy = bullet.worldY - bullet.startY;
    const distanceTraveled = Math.sqrt(dx * dx + dy * dy);
    if (distanceTraveled > FIREBALL_FADE_RANGE) return false;

    if (bullet.worldX > gameState.player.worldX && bullet.worldX < gameState.player.worldX + gameState.player.size &&
        bullet.worldY > gameState.player.worldY && bullet.worldY < gameState.player.worldY + gameState.player.size) {
      gameState.player.health--;
      updateBars();
      hitPlayer = true;
    }

    if (hitPlayer) return false;
    return true;
  });
}

function renderGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateCamera();

  const startX = Math.floor(gameState.camera.x / gameState.mapTile.width) * gameState.mapTile.width;
  const startY = Math.floor(gameState.camera.y / gameState.mapTile.height) * gameState.mapTile.height;
  for (let y = startY; y < gameState.camera.y + canvas.height + gameState.mapTile.height; y += gameState.mapTile.height) {
    for (let x = startX; x < gameState.camera.x + canvas.width + gameState.mapTile.width; x += gameState.mapTile.width) {
      const screenX = x - gameState.camera.x;
      const screenY = y - gameState.camera.y;
      ctx.fillStyle = gameState.mapTile.color || '#8B0000';
      ctx.fillRect(screenX, screenY, gameState.mapTile.width, gameState.mapTile.height);
      ctx.strokeStyle = '#FF4500';
      ctx.strokeRect(screenX, screenY, gameState.mapTile.width, gameState.mapTile.height);
    }
  }

  gameState.obstacles.forEach(obstacle => {
    if (obstacle.type !== 'lava') return;
    const screenX = obstacle.x - gameState.camera.x;
    const screenY = obstacle.y - gameState.camera.y;
    if (screenX + obstacle.radius < 0 || screenX - obstacle.radius > canvas.width ||
        screenY + obstacle.radius < 0 || screenY - obstacle.radius > canvas.height) {
      return;
    }

    if (gameState.sprites.lava.loaded && gameState.sprites.lava.image.complete && gameState.sprites.lava.image.naturalWidth !== 0) {
      ctx.drawImage(gameState.sprites.lava.image, screenX - obstacle.radius, screenY - obstacle.radius, obstacle.radius * 2, obstacle.radius * 2);
    } else {
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.arc(screenX, screenY, obstacle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFA500';
      ctx.beginPath();
      ctx.arc(screenX, screenY, obstacle.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (obstacle.hitEffect > 0) {
      obstacle.hitEffect -= 16.67;
      if (obstacle.hitEffect < 0) obstacle.hitEffect = 0;
    }
  });

  gameState.obstacles.forEach(obstacle => {
    if (obstacle.type !== 'rock') return;
    const screenX = obstacle.x - gameState.camera.x;
    const screenY = obstacle.y - gameState.camera.y;
    if (screenX + obstacle.radius < 0 || screenX - obstacle.radius > canvas.width ||
        screenY + obstacle.radius < 0 || screenY - obstacle.radius > canvas.height) {
      return;
    }

    if (gameState.sprites.rock.loaded && gameState.sprites.rock.image.complete && gameState.sprites.rock.image.naturalWidth !== 0) {
      ctx.drawImage(gameState.sprites.rock.image, screenX - obstacle.radius, screenY - obstacle.radius, obstacle.radius * 2, obstacle.radius * 2);
      if (obstacle.hitEffect > 0) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(screenX, screenY, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    } else {
      ctx.fillStyle = '#808080';
      ctx.beginPath();
      ctx.arc(screenX, screenY, obstacle.radius, 0, Math.PI * 2);
      ctx.fill();
      if (obstacle.hitEffect > 0) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(screenX, screenY, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(obstacle.health, screenX, screenY + 6);

    if (obstacle.hitEffect > 0) {
      obstacle.hitEffect -= 16.67;
      if (obstacle.hitEffect < 0) obstacle.hitEffect = 0;
    }
  });

  gameState.enemies.forEach(enemy => {
    if (enemy.health <= 0) return;
    const screenX = enemy.worldX - gameState.camera.x;
    const screenY = enemy.worldY - gameState.camera.y;
    if (screenX + enemy.size < 0 || screenX > canvas.width ||
        screenY + enemy.size < 0 || screenY > canvas.height) {
      return;
    }

    let enemySprite;
    let enemySpriteLoaded;
    switch (enemy.direction) {
      case 'up':
        enemySprite = gameState.sprites.satanUp.image;
        enemySpriteLoaded = gameState.sprites.satanUp.loaded;
        break;
      case 'down':
        enemySprite = gameState.sprites.satanDown.image;
        enemySpriteLoaded = gameState.sprites.satanDown.loaded;
        break;
      case 'left':
        enemySprite = gameState.sprites.satanLeft.image;
        enemySpriteLoaded = gameState.sprites.satanLeft.loaded;
        break;
      case 'right':
        enemySprite = gameState.sprites.satanRight.image;
        enemySpriteLoaded = gameState.sprites.satanRight.loaded;
        break;
      default:
        enemySprite = gameState.sprites.satanDown.image;
        enemySpriteLoaded = gameState.sprites.satanDown.loaded;
    }
    if (enemySpriteLoaded && enemySprite.complete && enemySprite.naturalWidth !== 0) {
      ctx.drawImage(enemySprite, screenX, screenY, enemy.size, enemy.size);
      if (enemy.hitEffect > 0) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(screenX + enemy.size / 2, screenY + enemy.size / 2, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    } else {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(screenX, screenY, enemy.size, enemy.size);
      ctx.fillStyle = 'black';
      ctx.fillRect(screenX + 5, screenY - 5, 5, 5);
      ctx.fillRect(screenX + 20, screenY - 5, 5, 5);
      if (enemy.hitEffect > 0) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(screenX + enemy.size / 2, screenY + enemy.size / 2, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }
  });

  let playerSprite;
  let playerSpriteLoaded;
  switch (gameState.player.direction) {
    case 'up':
      playerSprite = gameState.sprites.jesusUp.image;
      playerSpriteLoaded = gameState.sprites.jesusUp.loaded;
      break;
    case 'down':
      playerSprite = gameState.sprites.jesusDown.image;
      playerSpriteLoaded = gameState.sprites.jesusDown.loaded;
      break;
    case 'left':
      playerSprite = gameState.sprites.jesusLeft.image;
      playerSpriteLoaded = gameState.sprites.jesusLeft.loaded;
      break;
    case 'right':
      playerSprite = gameState.sprites.jesusRight.image;
      playerSpriteLoaded = gameState.sprites.jesusRight.loaded;
      break;
    default:
      playerSprite = gameState.sprites.jesusDown.image;
      playerSpriteLoaded = gameState.sprites.jesusDown.loaded;
  }
  if (playerSpriteLoaded && playerSprite.complete && playerSprite.naturalWidth !== 0) {
    ctx.drawImage(playerSprite, gameState.player.screenX, gameState.player.screenY, gameState.player.size, gameState.player.size);
  } else {
    ctx.fillStyle = 'white';
    ctx.fillRect(gameState.player.screenX, gameState.player.screenY, gameState.player.size, gameState.player.size);
  }

  if (gameState.isMeleeAttacking) {
    const meleeDuration = 200;
    if (performance.now() - gameState.meleeAttackStart < meleeDuration) {
      ctx.fillStyle = '#8B4513';
      switch (gameState.player.direction) {
        case 'up':
          ctx.fillRect(gameState.player.screenX + gameState.player.size / 4, gameState.player.screenY - 20, gameState.player.size / 2, 20);
          break;
        case 'down':
          ctx.fillRect(gameState.player.screenX + gameState.player.size / 4, gameState.player.screenY + gameState.player.size, gameState.player.size / 2, 20);
          break;
        case 'left':
          ctx.fillRect(gameState.player.screenX - 20, gameState.player.screenY + gameState.player.size / 4, 20, gameState.player.size / 2);
          break;
        case 'right':
          ctx.fillRect(gameState.player.screenX + gameState.player.size, gameState.player.screenY + gameState.player.size / 4, 20, gameState.player.size / 2);
          break;
      }
    } else {
      gameState.isMeleeAttacking = false;
    }
  }

  gameState.playerBullets.forEach(bullet => {
    const screenX = bullet.worldX - gameState.camera.x;
    const screenY = bullet.worldY - gameState.camera.y;
    if (screenX + bullet.size < 0 || screenX > canvas.width ||
        screenY + bullet.size < 0 || screenY > canvas.height) {
      return;
    }
    ctx.fillStyle = 'white';
    ctx.fillRect(screenX - bullet.size / 2, screenY - bullet.size / 2, bullet.size, bullet.size);
  });

  gameState.enemyBullets.forEach(bullet => {
    const screenX = bullet.worldX - gameState.camera.x;
    const screenY = bullet.worldY - gameState.camera.y;
    if (screenX + bullet.size < 0 || screenX > canvas.width ||
        screenY + bullet.size < 0 || screenY > canvas.height) {
      return;
    }
    if (gameState.sprites.fireball.loaded && gameState.sprites.fireball.image.complete && gameState.sprites.fireball.image.naturalWidth !== 0) {
      ctx.drawImage(gameState.sprites.fireball.image, screenX - bullet.size / 2, screenY - bullet.size / 2, bullet.size, bullet.size);
    } else {
      ctx.fillStyle = '#FFA500';
      ctx.fillRect(screenX - bullet.size / 2, screenY - bullet.size / 2, bullet.size, bullet.size);
    }
  });
}

function gameLoop(timestamp) {
  if (!gameState.isGameRunning) {
    aimToggleButton.style.display = 'none';
    return;
  } else {
    aimToggleButton.style.display = 'block';
  }

  const delta = (timestamp - gameState.lastTime) / 16.67;
  gameState.lastTime = timestamp;

  if (gameState.player.health <= 0) {
    gameOverScreen.classList.remove('hidden');
    gameState.isGameRunning = false;
    return;
  }

  updatePlayerMovement(delta);
  tryFireSpell(timestamp);
  updateEnemies(delta, timestamp);
  updatePlayerBullets(delta);
  updateEnemyBullets(delta);

  if (gameState.isGameStarted && gameState.enemies.every(enemy => enemy.health <= 0)) {
    gameState.waveCount = Math.min(gameState.waveCount + 1, 10);
  }

  if (!gameState.isInDialogue) checkDialogue();

  renderGame();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  initializeGameState();
  gameState.isGameRunning = true;
  requestAnimationFrame(gameLoop);
}

loadSprites();
setupEventListeners();
initializeGameState();
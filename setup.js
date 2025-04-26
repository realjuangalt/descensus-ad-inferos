var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};

function filledCell(cell) {
  return cell !== '' && cell != null;
}

function loadFileData(filename) {
  if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
    try {
      var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
      var firstSheetName = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[firstSheetName];
      var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
      var filteredData = jsonData.filter(row => row.some(filledCell));
      var headerRowIndex = filteredData.findIndex((row, index) =>
        row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
      );
      if (headerRowIndex === -1 || headerRowIndex > 25) {
        headerRowIndex = 0;
      }
      var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
      csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
      return csv;
    } catch (e) {
      console.error(e);
      return "";
    }
  }
  return gk_fileData[filename] || "";
}

function loadSprites() {
  const spritePaths = {
    jesusUp: 'images/jesus-up.png',
    jesusDown: 'images/jesus-down.png',
    jesusLeft: 'images/jesus-left.png',
    jesusRight: 'images/jesus-right.png',
    satanUp: 'images/satan-up.png',
    satanDown: 'images/satan-down.png',
    satanLeft: 'images/satan-left.png',
    satanRight: 'images/satan-right.png',
    fireball: 'images/center-fireball.png',
    rock: 'images/rock.png',
    lava: 'images/lava.png'
  };

  const fallbackPaths = {
    jesusUp: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/jesus-up.png',
    jesusDown: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/jesus-down.png',
    jesusLeft: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/jesus-left.png',
    jesusRight: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/jesus-right.png',
    satanUp: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/satan-up.png',
    satanDown: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/satan-down.png',
    satanLeft: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/satan-left.png',
    satanRight: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/satan-right.png',
    fireball: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/center-fireball.png',
    rock: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/rock.png',
    lava: 'https://raw.githubusercontent.com/realjuangalt/descensus-ad-inferos/main/images/lava.png'
  };

  Object.keys(gameState.sprites).forEach(spriteKey => {
    const sprite = gameState.sprites[spriteKey];
    sprite.image.onerror = () => {
      console.log(`Failed to load local sprite ${spritePaths[spriteKey]}, falling back to remote URL.`);
      sprite.image.src = fallbackPaths[spriteKey];
    };
    sprite.image.onload = () => {
      sprite.loaded = true;
      gameState.spritesLoaded++;
      checkAllSpritesLoaded();
    };
    sprite.image.src = spritePaths[spriteKey];
  });

  setTimeout(() => {
    if (gameState.spritesLoaded < Object.keys(gameState.sprites).length) {
      console.log('Sprite loading timeout, starting game loop with fallbacks.');
      checkAllSpritesLoaded();
    }
  }, 5000);
}

function checkAllSpritesLoaded() {
  if (gameState.spritesLoaded >= Object.keys(gameState.sprites).length || performance.now() > gameState.lastTime + 5000) {
    console.log('Starting game loop.');
    if (typeof gameLoop === 'function') {
      requestAnimationFrame(gameLoop);
    } else {
      console.error('gameLoop is not defined. Ensure game.js is loaded correctly.');
    }
  }
}

function setupEventListeners() {
  if (canvas) {
    console.log('Attaching mouse event listeners to canvas');
    canvas.addEventListener('mousedown', (e) => {
      console.log('Mouse down detected on canvas');
      gameState.isFiring = true;
      const rect = canvas.getBoundingClientRect();
      gameState.mouseX = (e.clientX - rect.left) * scaleX;
      gameState.mouseY = (e.clientY - rect.top) * scaleY;
    });
    canvas.addEventListener('mouseup', () => {
      console.log('Mouse up detected on canvas');
      gameState.isFiring = false;
    });
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      gameState.mouseX = (e.clientX - rect.left) * scaleX;
      gameState.mouseY = (e.clientY - rect.top) * scaleY;
    });
    canvas.addEventListener('click', (e) => {
      console.log('Click detected on canvas');
      gameState.hasFired = true;
      const rect = canvas.getBoundingClientRect();
      gameState.mouseX = (e.clientX - rect.left) * scaleX;
      gameState.mouseY = (e.clientY - rect.top) * scaleY;
    });
  } else {
    console.error('Canvas element not found');
  }

  document.addEventListener('keydown', (e) => {
    gameState.keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'w') gameState.player.direction = 'up';
    if (e.key.toLowerCase() === 's') gameState.player.direction = 'down';
    if (e.key.toLowerCase() === 'a') gameState.player.direction = 'left';
    if (e.key.toLowerCase() === 'd') gameState.player.direction = 'right';
  });
  document.addEventListener('keyup', (e) => {
    gameState.keys[e.key.toLowerCase()] = false;
  });

  // Add keyboard navigation for dialogue
  document.addEventListener('keydown', (e) => {
    if (gameState.isInDialogue) {
      const buttons = document.getElementById('dialogue').querySelectorAll('button');
      if (buttons.length === 0) return;

      let focusedButton = document.activeElement;
      let index = Array.from(buttons).indexOf(focusedButton);

      if (e.key === 'ArrowDown') {
        index = (index + 1) % buttons.length;
        buttons[index].focus();
      } else if (e.key === 'ArrowUp') {
        index = (index - 1 + buttons.length) % buttons.length;
        buttons[index].focus();
      } else if (e.key === 'Enter' && index >= 0) {
        buttons[index].click();
      }
    }
  });
}

function initializeGameState() {
  gameState.player.worldX = 0;
  gameState.player.worldY = 0;
  gameState.player.screenX = canvas.width / 2 - 32;
  gameState.player.screenY = canvas.height / 2 - 32;
  gameState.player.health = 10;
  gameState.player.maxHealth = 10;
  gameState.player.mana = 20;
  gameState.player.maxMana = 20;
  gameState.player.lastShot = 0;
  gameState.player.lastMelee = 0;
  gameState.player.direction = 'down';
  gameState.player.lastLavaDamage = 0;
  gameState.player.isHellish = false;

  gameState.enemies = [];
  gameState.obstacles = [];
  gameState.chunks = new Map();
  gameState.waveCount = 1;
  gameState.killCount = 0;
  gameState.isGameStarted = false;
  gameState.isInDialogue = false;
  gameState.isIntroductionActive = true;
  gameState.playerBullets = [];
  gameState.enemyBullets = [];
  gameState.isFiring = false;
  gameState.isMeleeAttacking = false;
  gameState.meleeAttackStart = 0;
  gameState.useAutoAim = false;
  gameState.hasFired = false;
  gameOverScreen.classList.add('hidden');
  gameState.isGameRunning = true;
  updateBars();
  killCountDisplay.textContent = `${gameState.killCount}`;

  gameState.enemies.push({
    worldX: gameState.player.worldX + 300,
    worldY: gameState.player.worldY - 300,
    size: 64,
    health: 2,
    speed: 0.5,
    lastAttack: 0,
    hostile: false,
    direction: 'down',
    hitEffect: 0,
    isHellish: true,
    id: 'satan' // Added NPC ID for dialogue
  });

  updateChunks();
}
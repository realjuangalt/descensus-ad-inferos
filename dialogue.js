let currentDialogue = null;
let dialogueStage = 0;
let useModernLanguage = false; // Toggle for dialogue language style

function loadDialogue(level, npcId) {
  fetch(`dialogues/${level}/${npcId}.json`)
    .then(response => response.json())
    .then(data => {
      currentDialogue = data;
      dialogueStage = 0;
      advanceDialogue();
    })
    .catch(error => console.error('Error loading dialogue:', error));
}

function advanceDialogue() {
  if (!currentDialogue || dialogueStage >= currentDialogue.length) {
    endDialogue();
    return;
  }

  const stage = currentDialogue[dialogueStage];
  const dialogueText = useModernLanguage ? stage.text.modern : stage.text.old;
  document.getElementById('npcDialogueText').textContent = dialogueText;
  document.getElementById('dialogueText').textContent = stage.prompt || 'Choose your response:';
  document.getElementById('dialogue').innerHTML = stage.options.map(option => 
    `<button onclick="chooseOption('${option.response}')" class="w-full fiery-button text-gray-200 py-2 px-4 rounded font-bold text-sm shadow-md hover:bg-red-700">${option.response}</button>`
  ).join('');
  document.getElementById('dialogue').querySelector('button').focus();
  dialogueStage++;
}

function chooseOption(response) {
  console.log('Player chose:', response);
  advanceDialogue();
}

function endDialogue() {
  gameState.isInDialogue = false;
  currentDialogue = null;
  dialogueStage = 0;
  document.getElementById('npcDialogueText').textContent = 'Satan prepares for battle...';
  document.getElementById('dialogueText').textContent = '';
  document.getElementById('dialogue').innerHTML = '';
  canvas.focus();
  console.log('Canvas focused after ending dialogue');

  // Transition to combat
  if (gameState.enemies.length > 0) {
    gameState.enemies[0].hostile = true;
    gameState.enemies[0].speed = 1;
    gameState.isGameStarted = true;
    gameState.isIntroductionActive = false;
  }
}
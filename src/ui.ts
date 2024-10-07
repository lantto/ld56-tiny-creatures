import { State } from "./types";
type StateUpdateFunction = (updates: Partial<State>) => void;
let updateState: StateUpdateFunction;
export function initUI(initialState: State, stateUpdateFn: StateUpdateFunction): void {
    updateState = stateUpdateFn;
    createUIControls(initialState);
    addZoomControls(initialState.zoomLevel);
    addSpawnProgressAndEntityCount();
    addResourceDepletionBar(); 
    addAnimationStyles(); 
    addStageDisplay(); 
    addLevelUpCard(); 
}
function createUIControls(state: State): void {
    const controlsDiv = createControlsContainer();
    addRadiusControls(controlsDiv, state);
    addSpeedControls(controlsDiv, state);
    addClearButton(controlsDiv);
    addCollisionToggle(controlsDiv, state);
    document.body.appendChild(controlsDiv);
}
function addRadiusControls(container: HTMLDivElement, state: State): void {
    const radiusLabel = document.createElement('label');
    radiusLabel.textContent = 'Entity Radius: ';
    const radiusSlider = document.createElement('input');
    radiusSlider.id = 'radiusSlider';
    radiusSlider.type = 'range';
    radiusSlider.min = '1';
    radiusSlider.max = '19';
    radiusSlider.value = state.entityRadius.toString();
    radiusSlider.oninput = (e) => {
        updateState({ entityRadius: parseFloat((e.target as HTMLInputElement).value) });
    };
    container.appendChild(radiusLabel);
    container.appendChild(radiusSlider);
    container.appendChild(document.createElement('br'));
    const randomRadiusLabel = document.createElement('label');
    randomRadiusLabel.textContent = 'Random Radius: ';
    const randomRadiusCheckbox = document.createElement('input');
    randomRadiusCheckbox.id = 'randomRadiusCheckbox';
    randomRadiusCheckbox.type = 'checkbox';
    randomRadiusCheckbox.checked = state.isRandomRadius;
    randomRadiusCheckbox.onchange = (e) => {
        updateState({ isRandomRadius: (e.target as HTMLInputElement).checked });
    };
    container.appendChild(randomRadiusLabel);
    container.appendChild(randomRadiusCheckbox);
    container.appendChild(document.createElement('br'));
}
function addSpeedControls(container: HTMLDivElement, state: State): void {
    const baseSpeedLabel = document.createElement('label');
    baseSpeedLabel.textContent = 'Base Speed: ';
    const baseSpeedSlider = document.createElement('input');
    baseSpeedSlider.id = 'baseSpeedSlider';
    baseSpeedSlider.type = 'range';
    baseSpeedSlider.min = '0.05';
    baseSpeedSlider.max = '4.0';
    baseSpeedSlider.step = '0.05';
    baseSpeedSlider.value = state.baseSpeed.toString();
    baseSpeedSlider.oninput = (e) => {
        updateState({ baseSpeed: parseFloat((e.target as HTMLInputElement).value) });
    };
    container.appendChild(baseSpeedLabel);
    container.appendChild(baseSpeedSlider);
    container.appendChild(document.createElement('br'));
    const randomBaseSpeedLabel = document.createElement('label');
    randomBaseSpeedLabel.textContent = 'Random Base Speed: ';
    const randomBaseSpeedCheckbox = document.createElement('input');
    randomBaseSpeedCheckbox.id = 'randomBaseSpeedCheckbox';
    randomBaseSpeedCheckbox.type = 'checkbox';
    randomBaseSpeedCheckbox.checked = state.isRandomBaseSpeed;
    randomBaseSpeedCheckbox.onchange = (e) => {
        updateState({ isRandomBaseSpeed: (e.target as HTMLInputElement).checked });
    };
    container.appendChild(randomBaseSpeedLabel);
    container.appendChild(randomBaseSpeedCheckbox);
    container.appendChild(document.createElement('br'));
}
function addClearButton(container: HTMLDivElement): void {
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Entities';
    clearButton.onclick = () => {
        updateState({ entities: [] });
    };
    container.appendChild(clearButton);
}
function addCollisionToggle(container: HTMLDivElement, state: State): void {
    const collisionButton = document.createElement('button');
    collisionButton.textContent = state.isCollisionEnabled ? 'Disable Collision' : 'Enable Collision';
    collisionButton.onclick = () => {
        updateState({ isCollisionEnabled: !state.isCollisionEnabled });
        collisionButton.textContent = state.isCollisionEnabled ? 'Disable Collision' : 'Enable Collision';
    };
    container.appendChild(collisionButton);
    container.appendChild(document.createElement('br'));
}
function addZoomControls(initialZoom: number): void {
    const zoomControlsDiv = createZoomControlsContainer();
    const zoomInButton = createButton('Zoom In', () => updateState({ zoomLevel: initialZoom + 0.1 }));
    const zoomOutButton = createButton('Zoom Out', () => updateState({ zoomLevel: initialZoom - 0.1 }));
    const resetZoomButton = createButton('Reset Zoom', () => updateState({ zoomLevel: 1 }));
    zoomControlsDiv.appendChild(zoomInButton);
    zoomControlsDiv.appendChild(zoomOutButton);
    zoomControlsDiv.appendChild(resetZoomButton);
    document.body.appendChild(zoomControlsDiv);
}
function createControlsContainer(): HTMLDivElement {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.position = 'fixed';
    controlsDiv.style.bottom = '10px';
    controlsDiv.style.left = '50%';
    controlsDiv.style.transform = 'translateX(-50%)';
    controlsDiv.style.color = 'white';
    controlsDiv.style.fontFamily = 'Arial, sans-serif';
    controlsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    controlsDiv.style.padding = '10px';
    controlsDiv.style.borderRadius = '5px';
    controlsDiv.style.display = 'none';
    return controlsDiv;
}
function createZoomControlsContainer(): HTMLDivElement {
    const zoomControlsDiv = document.createElement('div');
    zoomControlsDiv.style.position = 'fixed';
    zoomControlsDiv.style.top = '10px';
    zoomControlsDiv.style.right = '10px';
    zoomControlsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    zoomControlsDiv.style.padding = '10px';
    zoomControlsDiv.style.borderRadius = '5px';
    zoomControlsDiv.style.display = 'none';
    return zoomControlsDiv;
}
function createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.onclick = onClick;
    return button;
}
function addSpawnProgressAndEntityCount(): void {
    const uiContainer = document.createElement('div');
    uiContainer.id = 'uiContainer';
    uiContainer.style.position = 'fixed';
    uiContainer.style.top = '0';
    uiContainer.style.left = '0';
    uiContainer.style.width = '100%';
    uiContainer.style.color = 'white';
    uiContainer.style.fontFamily = 'Arial, sans-serif';
    uiContainer.style.fontSize = '24px';
    uiContainer.style.textAlign = 'center';
    const progressBarContainer = document.createElement('div');
    progressBarContainer.style.width = '100%';
    progressBarContainer.style.height = '10px';
    progressBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    progressBarContainer.style.borderRadius = '5px';
    progressBarContainer.style.overflow = 'hidden';
    const progressBar = document.createElement('div');
    progressBar.id = 'spawnProgressBar';
    progressBar.style.width = '100%';
    progressBar.style.height = '100%';
    progressBar.style.position = 'relative';
    progressBar.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.2)';
    const gradientBar = document.createElement('div');
    gradientBar.id = 'spawnProgressGradient';
    gradientBar.style.position = 'absolute';
    gradientBar.style.left = '0';
    gradientBar.style.top = '0';
    gradientBar.style.height = '100%';
    gradientBar.style.width = '0%';
    progressBar.appendChild(gradientBar);
    progressBarContainer.appendChild(progressBar);
    const infoContainer = document.createElement('div');
    infoContainer.style.display = 'flex';
    infoContainer.style.justifyContent = 'space-between';
    infoContainer.style.padding = '5px 20px';
    const levelDiv = document.createElement('div');
    levelDiv.id = 'levelCount';
    levelDiv.style.textAlign = 'left';
    levelDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    const entityCountContainer = document.createElement('div');
    entityCountContainer.style.display = 'flex';
    entityCountContainer.style.flexDirection = 'column'; 
    entityCountContainer.style.alignItems = 'center'; 
    entityCountContainer.style.justifyContent = 'center'; 
    const entityLabel = document.createElement('span');
    entityLabel.textContent = 'Creatures'; 
    entityLabel.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    const entityCountDiv = document.createElement('span');
    entityCountDiv.id = 'entityCount';
    entityCountDiv.style.color = '#00FF00'; 
    entityCountDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    entityCountDiv.style.fontSize = '28px'; 
    entityCountContainer.appendChild(entityLabel);
    entityCountContainer.appendChild(entityCountDiv);
    infoContainer.appendChild(levelDiv);
    infoContainer.appendChild(entityCountContainer);
    uiContainer.appendChild(progressBarContainer);
    uiContainer.appendChild(infoContainer);
    document.body.appendChild(uiContainer);
}
export function updateSpawnProgress(progress: number, startColor: number[], endColor: number[]): void {
    const gradientBar = document.getElementById('spawnProgressGradient');
    if (gradientBar) {
        gradientBar.style.width = `${progress * 100}%`;
        const gradient = `linear-gradient(90deg, rgba(${startColor.join(',')},0.0) 0%, rgba(${endColor.join(',')},0.8) 100%)`; 
        gradientBar.style.background = gradient;
    }
}
export function updateRadiusSlider(value: number): void {
    const slider = document.getElementById('radiusSlider') as HTMLInputElement;
    if (slider) {
        slider.value = value.toString();
    }
}
export function updateRandomRadiusCheckbox(checked: boolean): void {
    const checkbox = document.getElementById('randomRadiusCheckbox') as HTMLInputElement;
    if (checkbox) {
        checkbox.checked = checked;
    }
}
let previousCount: number | null = null;
let currentLevel = 0;
export function updateEntityCount(count: number): void {
    const entityCountDiv = document.getElementById('entityCount');
    if (entityCountDiv) {
        entityCountDiv.textContent = `${count}`;
        if (previousCount !== count) {
            entityCountDiv.classList.remove('pulse-animation');
            void entityCountDiv.offsetWidth; 
            entityCountDiv.classList.add('pulse-animation');
            previousCount = count;
        }
    }
}
export function updateLevel(level: number): void {
    const levelDiv = document.getElementById('levelCount');
    if (levelDiv) {
        if (level !== currentLevel) {
            levelDiv.textContent = `Level: ${level}`;
            currentLevel = level;
        }
    }
}
function addAnimationStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(2); }
            100% { transform: scale(1); }
        }
        .pulse-animation {
            animation: pulse 0.3s ease-in-out;
        }
    `;
    document.head.appendChild(style);
}
function addResourceDepletionBar(): void {
    const depletionBarContainer = document.createElement('div');
    depletionBarContainer.id = 'depletionBarContainer';
    depletionBarContainer.style.position = 'fixed';
    depletionBarContainer.style.bottom = '0'; 
    depletionBarContainer.style.left = '0';
    depletionBarContainer.style.width = '100%'; 
    depletionBarContainer.style.height = '10px'; 
    depletionBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'; 
    depletionBarContainer.style.borderRadius = '5px'; 
    depletionBarContainer.style.overflow = 'hidden'; 
    const depletionBar = document.createElement('div');
    depletionBar.id = 'depletionBar';
    depletionBar.style.width = '100%';
    depletionBar.style.height = '100%';
    depletionBar.style.position = 'relative';
    depletionBar.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.2)'; 
    const gradientBar = document.createElement('div');
    gradientBar.id = 'depletionGradient';
    gradientBar.style.position = 'absolute';
    gradientBar.style.left = '0';
    gradientBar.style.top = '0';
    gradientBar.style.height = '100%';
    gradientBar.style.width = '10%';
    depletionBar.appendChild(gradientBar);
    depletionBarContainer.appendChild(depletionBar);
    document.body.appendChild(depletionBarContainer);
}
export function updateResourceDepletionBar(progress: number, startColor: number[], endColor: number[]): void {
    const gradientBar = document.getElementById('depletionGradient');
    if (gradientBar) {
        gradientBar.style.width = `${progress * 100}%`;
        const gradient = `linear-gradient(90deg, rgba(${startColor.join(',')},0.0) 0%, rgba(${endColor.join(',')},0.8) 100%)`; 
        gradientBar.style.background = gradient;
    }
}
export function addStageDisplay(): void {
  const stageContainer = document.createElement('div');
  stageContainer.id = 'stageContainer';
  stageContainer.style.position = 'fixed';
  stageContainer.style.bottom = '20px'; 
  stageContainer.style.left = '0';
  stageContainer.style.width = '100%';
  stageContainer.style.display = 'flex';
  stageContainer.style.justifyContent = 'space-between';
  stageContainer.style.padding = '0 20px';
  stageContainer.style.color = 'white';
  stageContainer.style.fontFamily = 'Arial, sans-serif';
  stageContainer.style.fontSize = '16px';
  const currentStageDiv = document.createElement('div');
  currentStageDiv.id = 'currentStage';
  const nextStageDiv = document.createElement('div');
  nextStageDiv.id = 'nextStage';
  stageContainer.appendChild(currentStageDiv);
  stageContainer.appendChild(nextStageDiv);
  document.body.appendChild(stageContainer);
}
export function updateStageDisplay(stage: number, progress: number): void {
  const currentStageDiv = document.getElementById('currentStage');
  const nextStageDiv = document.getElementById('nextStage');
  if (currentStageDiv && nextStageDiv) {
    currentStageDiv.textContent = `Stage: ${stage}`;
    nextStageDiv.textContent = `Next stage: ${(progress * 100).toFixed(2)}%`;
  }
}
function addLevelUpCard(): void {
  const levelUpCard = document.createElement('div');
  levelUpCard.id = 'levelUpCard';
  levelUpCard.style.position = 'fixed';
  levelUpCard.style.top = '25%'; 
  levelUpCard.style.left = '50%';
  levelUpCard.style.transform = 'translate(-50%, -50%)';
  levelUpCard.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  levelUpCard.style.color = 'white';
  levelUpCard.style.padding = '20px';
  levelUpCard.style.borderRadius = '10px';
  levelUpCard.style.textAlign = 'center';
  levelUpCard.style.fontSize = '24px';
  levelUpCard.style.opacity = '0';
  levelUpCard.style.transition = 'opacity 0.5s ease-in-out';
  levelUpCard.style.zIndex = '1000';
  levelUpCard.style.display = 'none';
  document.body.appendChild(levelUpCard);
}
let activeAutoHideTimeout: number | null = null;
export function showStageProgressionCard(stage: number, oldSpeed: number, newSpeed: number, oldRadius: number, newRadius: number, oldEntityCount: number, newEntityCount: number): void {
  const stageProgressionCard = document.getElementById('levelUpCard');
  if (stageProgressionCard) {
    if (activeAutoHideTimeout !== null) {
      clearTimeout(activeAutoHideTimeout);
    }
    stageProgressionCard.innerHTML = `
      <h2>Stage ${stage} Reached!</h2>
      <p>Speed: ${oldSpeed.toFixed(2)} → ${newSpeed.toFixed(2)}</p>
      <p>Starting creatures: ${oldEntityCount} → ${newEntityCount}</p>
      <p>Variation: ${oldRadius.toFixed(2)} → ${newRadius.toFixed(2)}</p>
    `;
    stageProgressionCard.style.display = 'block';
    stageProgressionCard.style.transform = 'translate(-50%, -50%) scale(0.5)';
    stageProgressionCard.style.opacity = '0';
    setTimeout(() => {
      stageProgressionCard.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      stageProgressionCard.style.transform = 'translate(-50%, -50%) scale(1.1)';
      stageProgressionCard.style.opacity = '1';
    }, 50);
    setTimeout(() => {
      stageProgressionCard.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 300);
    const dismissCard = () => {
      stageProgressionCard.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in';
      stageProgressionCard.style.transform = 'translate(-50%, -50%) scale(0.5)';
      stageProgressionCard.style.opacity = '0';
      setTimeout(() => {
        stageProgressionCard.style.display = 'none';
        stageProgressionCard.removeEventListener('click', dismissCard);
      }, 300);
      if (activeAutoHideTimeout !== null) {
        clearTimeout(activeAutoHideTimeout);
        activeAutoHideTimeout = null;
      }
    };
    stageProgressionCard.removeEventListener('click', dismissCard);
    stageProgressionCard.addEventListener('click', dismissCard);
    activeAutoHideTimeout = window.setTimeout(dismissCard, 10000);
  }
}
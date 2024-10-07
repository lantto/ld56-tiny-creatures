
import './style.css'
import { Resource, State } from './types';
import { vsSource, fsSource } from './shaders';
import { initShaderProgram, initBuffers, drawScene, resizeCanvasToDisplaySize } from './webgl-utils';
import { initUI, updateRadiusSlider, updateRandomRadiusCheckbox, updateEntityCount, updateResourceDepletionBar, updateSpawnProgress, updateLevel, updateStageDisplay } from './ui';
import { initInputHandlers } from './input-handlers';
import { INITIAL_SPAWN_COST, updateEntities, updateEntityTexture } from './entities';
import { initializeEntities } from './entities';
const TEXTURE_SCALE = 0.25; 
let state: State = {
    entityRadius: 4,
    isRandomRadius: true,
    baseSpeed: 2.0,
    isRandomBaseSpeed: true,
    isCollisionEnabled: true,
    zoomLevel: 1,
    rallyPoint: { x: 0, y: 0 }, 
    isSpawning: false,
    entities: [],
    rallyPointColor: [0, 255, 0], 
    mouseState: { isDown: false, x: 0, y: 0 }, 
    rallyPointFadeTime: performance.now(),
    resources: [], 
    resourceCache: new Map<string, Resource>(), 
    resourceCtx: null,
    credits: 0,
    score: 0,
    currentResources: 0,
    totalResources: 0,
    isResourcesDepleting: false,
    globalSpeedMultiplier: 1,
    resourceMultiplier: 1, 
    entityStartColor: [0, 0, 255], 
    entityEndColor: [0, 255, 0], 
    resourceStartColor: [0, 0, 0],
    resourceEndColor: [0, 0, 255],
    isSpeedBasedAlpha: false,
    nextSpawnCost: INITIAL_SPAWN_COST,
    level: 1, 
    stage: 1, 
    initialEntityCount: 20,
};
main();
function main(): void {
  const canvas = document.getElementById('glCanvas') as HTMLCanvasElement;
  const gl = canvas.getContext('webgl')!;
  if (!gl) {
      alert('WebGL not supported!');
      return;
  }
  const entityTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, entityTexture);
  gl.texImage2D(
      gl.TEXTURE_2D,
      0,              
      gl.RGBA,        
      gl.canvas.width,
      gl.canvas.height,
      0,              
      gl.RGBA,        
      gl.UNSIGNED_BYTE, 
      null            
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement, gl, entityTexture);
  window.addEventListener('resize', () => resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement, gl, entityTexture));
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource)!;
  const programInfo = {
      program: shaderProgram,
      attribLocations: {
          aPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
      },
      uniformLocations: {
          uEntityTexture: gl.getUniformLocation(shaderProgram, 'uEntityTexture'),
          uTextureSize: gl.getUniformLocation(shaderProgram, 'uTextureSize'),
          uCanvasSize: gl.getUniformLocation(shaderProgram, 'uCanvasSize'),
          uTime: gl.getUniformLocation(shaderProgram, 'uTime'),
          uRallyPoint: gl.getUniformLocation(shaderProgram, 'uRallyPoint'),
          uRallyPointFadeTime: gl.getUniformLocation(shaderProgram, 'uRallyPointFadeTime'), 
      },
  };
  const buffers = initBuffers(gl);
  initInputHandlers(canvas, state, (updates) => {
      Object.assign(state, updates);
      if ('zoomLevel' in updates) {
          setZoom(state.zoomLevel);
      }
  });
  initUI(state, (updates) => {
      Object.assign(state, updates);
      if ('zoomLevel' in updates) {
          setZoom(state.zoomLevel);
      }
  });
  const resourceCanvas = document.getElementById('resourceCanvas') as HTMLCanvasElement;
  const resourceCtx = resourceCanvas.getContext('2d')!;
  resourceCanvas.width = canvas.width;
  resourceCanvas.height = canvas.height;
  resourceCanvas.style.width = `${canvas.width}px`;
  resourceCanvas.style.height = `${canvas.height}px`;
  state.resourceCtx = resourceCtx;
  initializeEntities(gl, state);
  state.rallyPoint = {
      x: canvas.width / 2,
      y: canvas.height / 2
  };
  const targetFPS = 60;
  const frameInterval = 1000 / targetFPS;
  let lastFrameTime = 0;
  function render(currentTime: number) {
    const deltaTime = currentTime - lastFrameTime;
    if ((deltaTime + 2) >= frameInterval) {
      lastFrameTime = currentTime;
      updateEntities(gl, state);
      updateEntityTexture(gl, entityTexture, TEXTURE_SCALE, state);
      drawScene(gl, programInfo, buffers, entityTexture, state);
      updateRadiusSlider(state.entityRadius);
      updateRandomRadiusCheckbox(state.isRandomRadius);
      updateEntityCount(state.entities.length);
      updateLevel(state.level);
      const resourceDepletionProgress = Math.min(1, (state.totalResources - state.currentResources) / (state.totalResources / 2));
      updateResourceDepletionBar(resourceDepletionProgress, state.resourceStartColor, state.resourceEndColor);
      const spawnProgress = state.credits / state.nextSpawnCost;
      updateSpawnProgress(spawnProgress, state.entityStartColor, state.entityEndColor);
      updateStageDisplay(state.stage, resourceDepletionProgress);
    } else {
        console.log(deltaTime, (deltaTime - 1) >= frameInterval);
      console.log('skipping frame');
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
function setZoom(newZoom: number): void {
  state.zoomLevel = Math.max(0.1, Math.min(5, newZoom)); 
  const canvas = document.getElementById('glCanvas') as HTMLCanvasElement;
  canvas.style.transform = `scale(${state.zoomLevel})`;
  canvas.style.transformOrigin = 'center center';
}
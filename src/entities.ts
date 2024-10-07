import { Entity, State } from './types';
import { QuadTree } from './utils/QuadTree';
import { Rectangle } from './utils/Rectangle';
import { 
    drawResources, 
    createResources, 
    createResourceCache, 
    GRID_SIZE, 
    createStartFormationResources 
} from './resources';
import { updateSpawnProgress, updateEntityCount, showStageProgressionCard } from './ui';
import { getRandomColor } from './utils';
const DEPLETION_RESET_TIME = 5000; 
const INITIAL_MOVEMENT_DURATION = 2000; 
export const INITIAL_SPAWN_COST = 250;
const FOOD_TYPES = {
    SCARCE: 1,
    ABUNDANT: 2
};
let spawnTimeout: number | null = null;
let depletionTimeout: number | null = null;
let isSpawningCancelled = false;
function spawnInitialEntities(gl: WebGLRenderingContext, state: State, skipSequence: boolean = false): void {
    const centerX = gl.canvas.width / 2;
    const centerY = gl.canvas.height / 2;
    if (skipSequence) {
        for (let i = 0; i < state.initialEntityCount; i++) {
            const newEntity = createEntity(centerX, centerY, {
                ...state,
                entityRadius: 4
            });
            assignInitialRandomMovement(newEntity, gl.canvas.width, gl.canvas.height);
            state.entities.push(newEntity);
        }
    } else {
        let spawnIndex = 0;
        function spawnNextEntity() {
            if (spawnIndex < state.initialEntityCount) {
                const newEntity = createEntity(centerX, centerY, state);
                assignInitialRandomMovement(newEntity, gl.canvas.width, gl.canvas.height);
                state.entities.push(newEntity);
                spawnIndex++;
                setTimeout(spawnNextEntity, 100); 
            }
        }
        spawnNextEntity();
    }
}
export function initializeEntities(gl: WebGLRenderingContext, state: State): void {
    state.entities = []; 
    spawnInitialEntities(gl, state, false); 
    state.resources = createResources(gl.canvas.width, gl.canvas.height, state.stage, state.resourceCache, state.resourceStartColor, state.resourceEndColor);
    state.resourceCache = createResourceCache(state.resources);
    state.currentResources = state.totalResources = state.resources.reduce((sum, resource) => sum + resource.health, 0);
    const formationResources = createStartFormationResources(gl.canvas.width, gl.canvas.height, state.resourceEndColor);
    formationResources.forEach(resource => {
        state.resources.push(resource);
        state.resourceCache.set(`${resource.x},${resource.y}`, resource);
    });
    state.currentResources = 3000;
    state.totalResources = 3000;
    if (state.resourceCtx) {
        const resourceCanvas = state.resourceCtx.canvas;
        resourceCanvas.width = gl.canvas.width / GRID_SIZE;
        resourceCanvas.height = gl.canvas.height / GRID_SIZE;
        drawResources(state.resources, state.resourceCtx, resourceCanvas.width, resourceCanvas.height);
        state.resourceCtx.setTransform(1, 0, 0, 1, 0, 0); 
    }
}
export function createEntity(x: number, y: number, state: State): Entity {
    const entityBaseSpeed = state.isRandomBaseSpeed 
        ? Math.random() * (state.baseSpeed - 0.2) + 0.2 
        : state.baseSpeed;
    const entityRadius = state.isRandomRadius 
        ? Math.random() * state.entityRadius + 1 
        : state.entityRadius;
    return {
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        vx: 0,
        vy: 0,
        radius: entityRadius,
        speed: 0,
        baseSpeed: entityBaseSpeed,
        lastHitTime: 0
    };
}
function assignInitialRandomMovement(entity: Entity, canvasWidth: number, canvasHeight: number): void {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = 80;
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.sqrt(Math.random()) * radius;
    const randomX = centerX + distance * Math.cos(angle);
    const randomY = centerY + distance * Math.sin(angle);
    entity.overrideTarget = { x: randomX, y: randomY };
    entity.overrideEndTime = performance.now() + INITIAL_MOVEMENT_DURATION;
}
export function updateEntities(gl: WebGLRenderingContext, state: State): void {
    if (state.credits >= state.nextSpawnCost) {
        state.level += 1;
        const creditsToSpend = state.credits - (state.credits % state.nextSpawnCost);
        state.credits -= creditsToSpend;
        spawnGroupOfEntities(gl, state, creditsToSpend);
        state.nextSpawnCost *= 2; 
    }
    if (state.isSpawning) {
        const numNewEntities = 5;
        for (let i = 0; i < numNewEntities; i++) {
            state.entities.push(createEntity(state.mouseState.x, state.mouseState.y, state));
        }
    }
    const boundary = new Rectangle(0, 0, gl.canvas.width, gl.canvas.height);
    const quadTree = new QuadTree(boundary, 4);
    for (let entity of state.entities) {
        quadTree.insert(entity);
    }
    for (let i = 0; i < state.entities.length; i++) {
        let entity = state.entities[i];
        const currentTime = performance.now();
        if (entity.overrideEndTime && currentTime < entity.overrideEndTime) {
            const dx = entity.overrideTarget!.x - entity.x;
            const dy = entity.overrideTarget!.y - entity.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 1) {
                const speed = 0.1 * entity.baseSpeed * state.globalSpeedMultiplier;
                entity.vx += (dx / distance) * speed;
                entity.vy += (dy / distance) * speed;
            }
        } else {
            const dx = state.rallyPoint.x - entity.x;
            const dy = state.rallyPoint.y - entity.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 1) {
                const speed = 0.1 * entity.baseSpeed * state.globalSpeedMultiplier;
                entity.vx += (dx / distance) * speed;
                entity.vy += (dy / distance) * speed;
            }
        }
        entity.x += entity.vx;
        entity.y += entity.vy;
        entity.speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
        entity.vx *= 0.95;
        entity.vy *= 0.95;
        const resourceX = Math.floor(entity.x / GRID_SIZE);
        const resourceY = Math.floor(entity.y / GRID_SIZE);
        const resourceKey = `${resourceX},${resourceY}`;
        const cooldownPeriod = 1; 
        if (state.resourceCache.has(resourceKey)) {
            const resource = state.resourceCache.get(resourceKey)!;
            const resourceCenterX = (resourceX + 0.5) * GRID_SIZE;
            const resourceCenterY = (resourceY + 0.5) * GRID_SIZE;
            const dx = entity.x - resourceCenterX;
            const dy = entity.y - resourceCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / distance;
            const ny = dy / distance;
            const bounceStrength = 5; 
            entity.vx += nx * bounceStrength;
            entity.vy += ny * bounceStrength;
            const minDistance = entity.radius + 4; 
            if (distance < minDistance) {
                entity.x = resourceCenterX + nx * minDistance;
                entity.y = resourceCenterY + ny * minDistance;
            }
            if (currentTime - entity.lastHitTime > cooldownPeriod) {
                resource.health -= 1;
            } else {
                entity.lastHitTime = currentTime;
                return;
            }
            entity.lastHitTime = currentTime;
            if (state.resourceCtx) {
                state.resourceCtx.clearRect(resourceX, resourceY, 1, 1);
            }
            state.credits += 1; 
            state.score += 1; 
            state.currentResources -= 1;
            if (resource.health <= 0) {
                state.resourceCache.delete(resourceKey);
                state.resources = state.resources.filter(r => !(r.x === resourceX && r.y === resourceY));
            } else {
                if (state.resourceCtx) {
                    const alpha = resource.health / resource.maxHealth;  
                    state.resourceCtx.fillStyle = `rgba(${resource.color[0]}, ${resource.color[1]}, ${resource.color[2]}, ${alpha})`;
                    state.resourceCtx.fillRect(resourceX, resourceY, 1, 1);
                }
            }
        }
        if (state.isCollisionEnabled) {
            const range = new Rectangle(
                entity.x - entity.radius * 2,
                entity.y - entity.radius * 2,
                entity.radius * 4,
                entity.radius * 4
            );
            const nearbyEntities = quadTree.query(range);
            for (let other of nearbyEntities) {
                if (other === entity) continue;
                let cdx = other.x - entity.x;
                let cdy = other.y - entity.y;
                let distanceSquared = cdx * cdx + cdy * cdy;
                let minDistance = entity.radius + other.radius;
                if (distanceSquared < minDistance * minDistance) {
                    let distance = Math.sqrt(distanceSquared);
                    let nx = cdx / distance;
                    let ny = cdy / distance;
                    let relativeVelocityX = other.vx - entity.vx;
                    let relativeVelocityY = other.vy - entity.vy;
                    let speed = relativeVelocityX * nx + relativeVelocityY * ny;
                    if (speed < 0) {
                        let impulse = 2 * speed / (2); 
                        entity.vx += impulse * nx;
                        entity.vy += impulse * ny;
                        other.vx -= impulse * nx;
                        other.vy -= impulse * ny;
                        let overlap = minDistance - distance;
                        let separationX = overlap * nx / 2;
                        let separationY = overlap * ny / 2;
                        entity.x -= separationX;
                        entity.y -= separationY;
                        other.x += separationX;
                        other.y += separationY;
                    }
                }
            }
        }
    }
    if (state.entities.length > 1000) {
    }
    const spawnProgress = state.credits / state.nextSpawnCost;
    updateSpawnProgress(spawnProgress, state.entityStartColor, state.entityEndColor);
    updateEntityCount(state.entities.length);
    if (state.currentResources < state.totalResources / 2 && !state.isResourcesDepleting) {
        Object.assign(state, {
            isResourcesDepleting: true,
            isCollisionEnabled: false,
            rallyPoint: { x: gl.canvas.width / 2, y: gl.canvas.height / 2 },
            globalSpeedMultiplier: 10 
        });
        depletionTimeout = setTimeout(() => resetGameState(gl, state), DEPLETION_RESET_TIME);
    }
}
export function updateEntityTexture(gl: WebGLRenderingContext, texture: WebGLTexture, textureScale: number, state: State): void {
    const textureWidth = Math.ceil(gl.canvas.width * textureScale);
    const textureHeight = Math.ceil(gl.canvas.height * textureScale);
    const data = new Uint8Array(textureWidth * textureHeight * 4);
    data.fill(0);
    for (let entity of state.entities) {
        const {x, y, speed } = entity;
        const roundedX = Math.round(x * textureScale);
        const roundedY = Math.round(y * textureScale);
        if (roundedX >= 0 && roundedX < textureWidth && roundedY >= 0 && roundedY < textureHeight) {
            const flippedY = textureHeight - 1 - roundedY;
            const index = (flippedY * textureWidth + roundedX) * 4;
            const maxSpeed = 4;
            const normalizedSpeed = Math.min(speed / maxSpeed, 1); 
            const r = Math.floor(state.entityStartColor[0] + (state.entityEndColor[0] - state.entityStartColor[0]) * normalizedSpeed);
            const g = Math.floor(state.entityStartColor[1] + (state.entityEndColor[1] - state.entityStartColor[1]) * normalizedSpeed);
            const b = Math.floor(state.entityStartColor[2] + (state.entityEndColor[2] - state.entityStartColor[2]) * normalizedSpeed);
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = state.isSpeedBasedAlpha ? Math.floor(255 * normalizedSpeed) : 255;
        }
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,              
        gl.RGBA,        
        textureWidth,
        textureHeight,
        0,              
        gl.RGBA,        
        gl.UNSIGNED_BYTE,
        data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}
function spawnGroupOfEntities(gl: WebGLRenderingContext, state: State, creditsToSpend: number): void {
    isSpawningCancelled = false;
    const groupConfig = {
        radius: Math.random() < 0.5 ? 4 : Math.random() * state.entityRadius + 1,
        baseSpeed: Math.random() * (state.baseSpeed - 0.2) + 0.2,
        isRandomRadius: Math.random() < 0.5,
        isRandomBaseSpeed: Math.random() < 0.5
    };
    const spawnSide = Math.floor(Math.random() * 4); 
    const spawnDistance = 50 + Math.random() * 100; 
    const spawnX = spawnSide % 2 === 0 ? Math.random() * gl.canvas.width : (spawnSide === 1 ? gl.canvas.width + spawnDistance : -spawnDistance);
    const spawnY = spawnSide % 2 === 1 ? Math.random() * gl.canvas.height : (spawnSide === 0 ? -spawnDistance : gl.canvas.height + spawnDistance);
    const entitiesToSpawn = Math.floor(creditsToSpend / 50);
    let entitiesSpawned = 0;
    function spawnEntity() {
        if (isSpawningCancelled) {
            console.log("Entity spawning cancelled");
            return;
        }
        if (entitiesSpawned < entitiesToSpawn) {
            const newEntity = createEntity(spawnX, spawnY, {
                ...state,
                entityRadius: groupConfig.radius,
                baseSpeed: groupConfig.baseSpeed,
                isRandomRadius: groupConfig.isRandomRadius,
                isRandomBaseSpeed: groupConfig.isRandomBaseSpeed
            });
            state.entities.push(newEntity);
            entitiesSpawned++;
            const spawnInterval = 10 + Math.random() * 40; 
            setTimeout(spawnEntity, spawnInterval);
        }
    }
    spawnEntity();
}
export function cleanupEntitySpawning(): void {
    if (spawnTimeout) {
        clearTimeout(spawnTimeout);
        spawnTimeout = null;
    }
    if (depletionTimeout) {
        clearTimeout(depletionTimeout);
        depletionTimeout = null;
    }
}
function resetGameState(gl: WebGLRenderingContext, state: State): void {
    isSpawningCancelled = true;
    const oldSpeed = state.baseSpeed;
    const oldRadius = state.entityRadius;
    const oldEntityCount = state.initialEntityCount;
    state.initialEntityCount += 20;
    state.entities = [];
    spawnInitialEntities(gl, state, true);
    state.entityStartColor = getRandomColor();
    state.entityEndColor = [0, 255, 0];
    state.resourceStartColor = [0, 0, 0]; 
    state.resourceEndColor = [
        [0,
        0,
        255], 
        [0, 128, 255], 
        [0, 191, 255], 
        [65, 105, 225], 
        [30, 144, 255], 
        [0, 0, 139], 
    ][Math.floor(Math.random() * 6)] as [number, number, number];
    state.stage = state.stage + 1; 
    const foodType = state.stage % 3 === 1 ? FOOD_TYPES.ABUNDANT : FOOD_TYPES.SCARCE;
    const maxHealth = foodType === FOOD_TYPES.SCARCE ? 50 : 5;
    const newResources = createResources(gl.canvas.width, gl.canvas.height, state.stage, state.resourceCache, state.resourceStartColor, state.resourceEndColor, foodType, maxHealth);
    state.resources = [...state.resources, ...newResources];
    state.resourceCache = createResourceCache(state.resources);
    state.totalResources = state.resources.reduce((sum, resource) => sum + resource.health, 0);
    state.entityRadius *= 1.2; 
    state.baseSpeed *= 1.1; 
    Object.assign(state, {
        isResourcesDepleting: false,
        isCollisionEnabled: true,
        globalSpeedMultiplier: 1,
        currentResources: state.totalResources, 
        resourceMultiplier: state.resourceMultiplier * 2, 
        credits: 0, 
        level: 1,
        entityStartColor: state.entityStartColor,
        entityEndColor: state.entityEndColor,
        isSpeedBasedAlpha: Math.random() < 0.25, 
        rallyPointFadeTime: performance.now()
    });
    state.nextSpawnCost = INITIAL_SPAWN_COST;
    if (state.resourceCtx) {
        drawResources(state.resources, state.resourceCtx, state.resourceCtx.canvas.width, state.resourceCtx.canvas.height);
    }
    showStageProgressionCard(state.stage, oldSpeed, state.baseSpeed, oldRadius, state.entityRadius, oldEntityCount, state.initialEntityCount);
}
export function addResetGameStateCommand(gl: WebGLRenderingContext, state: State): void {
    (window as any).resetGameState = () => {
        console.log("Manually resetting game state...");
        resetGameState(gl, state);
    };
    console.log("Global command 'resetGameState()' added. Run it in the console to manually reset the game state.");
}
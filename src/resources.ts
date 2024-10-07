import { Resource } from "./types";
import { createNoise2D } from 'simplex-noise';
const START_FORMATION = [
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [0, 0, 0, 1, 1, 0, 0, 1, 1, 1],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
];
export const GRID_SIZE = 8;
export const FOOD_TYPES = {
    SCARCE: 1,
    ABUNDANT: 2
};
function getGradientColor(t: number, startColor: [number, number, number], endColor: [number, number, number]): [number, number, number] {
    return [
        Math.round(startColor[0] + (endColor[0] - startColor[0]) * t),
        Math.round(startColor[1] + (endColor[1] - startColor[1]) * t),
        Math.round(startColor[2] + (endColor[2] - startColor[2]) * t)
    ];
}
function aggressiveCurve(t: number, aggressiveness: number = 2): number {
    return Math.pow(t, aggressiveness);
}
export function createResources(
    width: number,
    height: number,
    stage: number,
    resourceCache: Map<string, Resource>,
    startColor?: [number, number, number],
    endColor?: [number, number, number],
    foodType: number = FOOD_TYPES.ABUNDANT,
    maxHealth: number = 5
): Resource[] {
    const resources: Resource[] = [];
    const gridWidth = Math.floor(width / GRID_SIZE);
    const gridHeight = Math.floor(height / GRID_SIZE);
    const noise2D = createNoise2D();
    const scale = 0.02;
    const centerX = gridWidth / 2;
    const centerY = gridHeight / 2;
    const emptyRadius = 20;
    const borderMargin = 10;
    const resourceCount = foodType === FOOD_TYPES.SCARCE ? 200 * stage : 2000 * stage;
    const candidates: [number, number, number][] = [];
    let minNoise = Infinity;
    let maxNoise = -Infinity;
    for (let x = borderMargin; x < gridWidth - borderMargin; x++) {
        for (let y = borderMargin; y < gridHeight - borderMargin; y++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared > emptyRadius * emptyRadius) {
                const noiseValue = noise2D(x * scale, y * scale);
                candidates.push([x, y, noiseValue]);
                minNoise = Math.min(minNoise, noiseValue);
                maxNoise = Math.max(maxNoise, noiseValue);
            }
        }
    }
    candidates.forEach(candidate => {
        candidate[2] = (candidate[2] - minNoise) / (maxNoise - minNoise);
    });
    candidates.sort((a, b) => b[2] - a[2]);
    const selectedCandidates = candidates.slice(0, resourceCount);
    const stageScalingFactor = Math.log2(stage + 1);
    for (const [x, y, normalizedNoise] of selectedCandidates) {
        if (resourceCache.has(`${x},${y}`)) {
            continue;
        }
        const colorT = aggressiveCurve(normalizedNoise, 100 * stageScalingFactor);
        const gradientStart = startColor || [0, 0, 128];  
        const gradientEnd = endColor || [200, 200, 200];  
        let color = getGradientColor(colorT, gradientEnd, gradientStart);
        color = color.map(channel => Math.round(channel * 0.7)) as [number, number, number];
        color = color.map(channel => {
            const randomOffset = Math.floor(Math.random() * 7) - 3; 
            return Math.max(0, Math.min(255, channel + randomOffset));
        }) as [number, number, number];
        resources.push({
            x: x,
            y: y,
            health: maxHealth,
            maxHealth: maxHealth,  
            color: color
        });
    }
    return resources;
}
export function createResourceCache(resources: Resource[]): Map<string, Resource> {
    const cache = new Map<string, Resource>();
    for (const resource of resources) {
        cache.set(`${resource.x},${resource.y}`, resource);
    }
    return cache;
}
export function drawResources(resources: Resource[], ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);
    for (const resource of resources) {
        const alpha = resource.health / resource.maxHealth;  
        ctx.fillStyle = `rgba(${resource.color[0]}, ${resource.color[1]}, ${resource.color[2]}, ${alpha})`;
        ctx.fillRect(resource.x, resource.y, 1, 1);
    }
}
export function createStartFormationResources(
    canvasWidth: number,
    canvasHeight: number,
    resourceEndColor: [number, number, number]
): Resource[] {
    const formationResources: Resource[] = [];
    const centerX = Math.floor(canvasWidth / (2 * GRID_SIZE));
    const centerY = Math.floor(canvasHeight / (2 * GRID_SIZE) * 0.5);
    const formationWidth = START_FORMATION[0].length;
    const formationHeight = START_FORMATION.length;
    const startX = centerX - Math.floor(formationWidth / 2);
    const startY = centerY - Math.floor(formationHeight / 2);
    for (let y = 0; y < formationHeight; y++) {
        for (let x = 0; x < formationWidth; x++) {
            if (START_FORMATION[y][x] === 1) {
                const resource: Resource = {
                    x: startX + x,
                    y: startY + y,
                    health: 50,
                    maxHealth: 50,
                    color: resourceEndColor
                };
                formationResources.push(resource);
            }
        }
    }
    return formationResources;
}

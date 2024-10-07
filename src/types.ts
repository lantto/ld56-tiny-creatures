export interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  baseSpeed: number;
  lastHitTime: number;
  overrideTarget?: { x: number, y: number };
  overrideEndTime?: number;
}
export interface Resource {
  x: number;
  y: number;
  health: number;
  maxHealth: number;  
  color: [number, number, number];
}
export interface State {
  entityRadius: number;
  isRandomRadius: boolean;
  baseSpeed: number;
  isRandomBaseSpeed: boolean;
  isCollisionEnabled: boolean;
  zoomLevel: number;
  rallyPoint: { x: number; y: number };
  isSpawning: boolean;
  entities: Entity[];
  rallyPointColor: number[];
  mouseState: { isDown: boolean; x: number; y: number };
  rallyPointFadeTime: number;
  resources: Resource[];
  resourceCache: Map<string, Resource>;
  resourceCtx: CanvasRenderingContext2D | null;
  credits: number;
  score: number;
  currentResources: number;
  totalResources: number;
  isResourcesDepleting: boolean;
  globalSpeedMultiplier: number;
  resourceMultiplier: number;
  entityStartColor: [number, number, number]; 
  entityEndColor: [number, number, number]; 
  resourceStartColor: [number, number, number]; 
  resourceEndColor: [number, number, number]; 
  isSpeedBasedAlpha: boolean;
  nextSpawnCost: number;
  level: number;
  stage: number; 
  initialEntityCount: number;
}

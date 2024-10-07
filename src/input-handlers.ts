import { State } from './types';
export function initInputHandlers(canvas: HTMLCanvasElement, state: State, updateState: (updates: Partial<State>) => void): void {
    canvas.addEventListener('mousedown', (event) => handleStart(event, state, updateState));
    canvas.addEventListener('mousemove', (event) => handleMove(event, state, updateState));
    canvas.addEventListener('mouseup', () => handleEnd(state, updateState));
    canvas.addEventListener('mouseleave', () => handleEnd(state, updateState));
    canvas.addEventListener('touchstart', (event) => handleStart(event, state, updateState));
    canvas.addEventListener('touchmove', (event) => handleMove(event, state, updateState));
    canvas.addEventListener('touchend', () => handleEnd(state, updateState));
    canvas.addEventListener('touchcancel', () => handleEnd(state, updateState));
}
function handleStart(event: MouseEvent | TouchEvent, state: State, updateState: (updates: Partial<State>) => void): void {
    event.preventDefault();
    updateMousePosition(event, state, updateState);
    updateState({ mouseState: { ...state.mouseState, isDown: true } });
    if (!state.isResourcesDepleting) {
        updateRallyPoint(state, updateState);
    }
}
function handleMove(event: MouseEvent | TouchEvent, state: State, updateState: (updates: Partial<State>) => void): void {
    event.preventDefault();
    updateMousePosition(event, state, updateState);
    if (state.mouseState.isDown && !state.isResourcesDepleting) {
        updateRallyPoint(state, updateState);
    }
}
function handleEnd(state: State, updateState: (updates: Partial<State>) => void): void {
    if (state.mouseState.isDown) {
        updateState({
            mouseState: { ...state.mouseState, isDown: false },
            rallyPointFadeTime: performance.now()
        });
    }
}
function updateMousePosition(event: MouseEvent | TouchEvent, state: State, updateState: (updates: Partial<State>) => void): void {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    let x, y;
    if (event instanceof MouseEvent) {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    } else {
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
    }
    updateState({ mouseState: { ...state.mouseState, x, y } });
}
function updateRallyPoint(state: State, updateState: (updates: Partial<State>) => void): void {
    updateState({ rallyPoint: { x: state.mouseState.x, y: state.mouseState.y }, rallyPointFadeTime: performance.now() });
}

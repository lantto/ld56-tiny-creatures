import { State } from "./types";
export function initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | null {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram!, vertexShader!);
    gl.attachShader(shaderProgram!, fragmentShader!);
    gl.linkProgram(shaderProgram!);
    if (!gl.getProgramParameter(shaderProgram!, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram!));
        return null;
    }
    return shaderProgram;
}
function loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    gl.shaderSource(shader!, source);
    gl.compileShader(shader!);
    if (!gl.getShaderParameter(shader!, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader!));
        gl.deleteShader(shader!);
        return null;
    }
    return shader;
}
export function initBuffers(gl: WebGLRenderingContext): { position: WebGLBuffer } {
    const positions = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
    ]);
    const positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    return {
        position: positionBuffer,
    };
}
export function drawScene(gl: WebGLRenderingContext, programInfo: any, buffers: { position: WebGLBuffer }, texture: WebGLTexture, state: State): void {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(programInfo.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.enableVertexAttribArray(programInfo.attribLocations.aPosition);
    gl.vertexAttribPointer(
        programInfo.attribLocations.aPosition,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.uEntityTexture, 0);
    gl.uniform2f(programInfo.uniformLocations.uTextureSize, 
                 Math.ceil(gl.canvas.width * TEXTURE_SCALE), 
                 Math.ceil(gl.canvas.height * TEXTURE_SCALE));
    gl.uniform2f(programInfo.uniformLocations.uCanvasSize, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(programInfo.uniformLocations.uTime, performance.now() / 1000.0);
    gl.uniform2f(programInfo.uniformLocations.uRallyPoint, state.rallyPoint.x, state.rallyPoint.y);
    gl.uniform1f(programInfo.uniformLocations.uRallyPointFadeTime, state.rallyPointFadeTime / 1000.0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, gl: WebGLRenderingContext, entityTexture: WebGLTexture): void {
    const displayWidth  = window.innerWidth;
    const displayHeight = window.innerHeight;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
        gl.bindTexture(gl.TEXTURE_2D, entityTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            canvas.width,
            canvas.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
    }
}
const TEXTURE_SCALE = 0.25;

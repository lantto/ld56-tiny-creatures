export const vsSource = `
  attribute vec4 aPosition;
  void main() {
      gl_Position = aPosition;
  }
`;
export const fsSource = `
  precision highp float;
  uniform sampler2D uEntityTexture;
  uniform vec2 uTextureSize;
  uniform vec2 uCanvasSize;
  uniform float uTime;
  uniform vec2 uRallyPoint;
  uniform float uRallyPointFadeTime;
  vec4 createGlow(vec2 uv) {
      vec4 glowColor = vec4(0.0);
      float intensity = 0.0;
      float glow = 5.0;
      for (float x = -5.0; x <= 5.0; x += 1.0) {
          for (float y = -5.0; y <= 5.0; y += 1.0) {
              if (abs(x) + abs(y) > 7.0) continue;
              vec2 offset = vec2(x, y) / uTextureSize;
              vec4 sampleColor = texture2D(uEntityTexture, uv + offset);
              glowColor += sampleColor;
              intensity += sampleColor.a;
          }
      }
      intensity = intensity / (glow * glow);
      glowColor = glowColor / (glow * glow);
      return vec4(glowColor.rgb, intensity);
  }
  float createRallyPointEffect(vec2 uv, vec2 rallyPoint, float time, float fadeTime) {
      vec2 rallyPointUV = rallyPoint / uCanvasSize;
      rallyPointUV.y = 1.0 - rallyPointUV.y;  
      float aspectRatio = uCanvasSize.x / uCanvasSize.y;
      vec2 adjustedUV = uv;
      adjustedUV.x *= aspectRatio;
      vec2 adjustedRallyPointUV = rallyPointUV;
      adjustedRallyPointUV.x *= aspectRatio;
      vec2 toPixel = adjustedUV - adjustedRallyPointUV;
      float dist = length(toPixel) / aspectRatio;
      float pulse = sin(time * 3.0) * 0.5 + 0.5;
      float circle = smoothstep(0.05 + pulse * 0.03, 0.0, dist);
      float waves = sin(dist * 30.0 - time * 5.0) * 0.5 + 0.5;
      waves *= smoothstep(0.2, 0.0, dist);
      float fadeOutDuration = 5.0;
      float fadeOutStart = fadeTime;
      float fadeOutEnd = fadeOutStart + fadeOutDuration;
      float fadeFactor = 1.0 - clamp((time - fadeOutStart) / fadeOutDuration, 0.0, 1.0);
      return (circle + waves * 0.3) * fadeFactor;
  }
  void main() {
      vec2 texCoord = gl_FragCoord.xy / uCanvasSize;
      vec4 entity = texture2D(uEntityTexture, texCoord);
      vec4 glow = createGlow(texCoord);
      float pulse = (sin(uTime * 2.0) + 1.0) * 0.5;
      glow *= mix(0.5, 1.5, pulse);
      float rallyEffect = createRallyPointEffect(texCoord, uRallyPoint, uTime, uRallyPointFadeTime);
      vec3 bgColor = vec3(0.0, 0.0, 0.0);  
      vec3 rallyColor = vec3(0.1, 0.1, 0.2) * rallyEffect;
      if (entity.a > 0.0) {
          gl_FragColor = mix(vec4(bgColor + rallyColor, 1.0), entity, entity.a);
      } else if (glow.a > 0.0) {
          gl_FragColor = mix(vec4(bgColor + rallyColor, 1.0), glow, glow.a);
      } else {
          gl_FragColor = vec4(bgColor + rallyColor, 1.0);
      }
  }
`;

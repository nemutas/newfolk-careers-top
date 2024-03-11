#version 300 es
precision highp float;

in vec2 vUv;
in vec2 vScreenUv;
out vec4 outColor;

uniform sampler2D uCurrent;
uniform sampler2D uNext;
uniform float uAspect;
uniform float uProgress;
uniform float uTime;
uniform vec3 uBgColor;
uniform vec2 uResolution;
uniform float uStartProgress;

void main() {
  vec2 uv = vUv;
  vec2 res = uResolution;

  // loop effect
  float transition = tanh(uProgress * 1.5);
  vec2 auv = (uv - 0.5) * vec2(uAspect, 1.0) + 0.5;
  float th = step(distance(auv, vec2(0.5)), transition);
  vec2 dir = auv - vec2(0.5);
  float range = 0.3;
  float power = smoothstep(transition * (1.0 + range) - range, transition * (1.0 + range), distance(auv, vec2(0.5)));


  // start effect
  vec2 screenAspect = res / min(res.x, res.y);
  transition = tanh(uStartProgress * 1.5) * 1.3;
  auv = vScreenUv * screenAspect;
  float sth = step(distance(auv, vec2(0.5) * screenAspect), transition * 1.1);
  vec2 sdir = auv - vec2(0.5);
  range = 0.3;
  float spower = smoothstep(transition * (1.0 + range) - range, transition * (1.0 + range), distance(auv, vec2(0.5) * screenAspect));

  uv.x += uTime * 0.2;
  // vec4 current = texture(uCurrent, uv);
  vec4 current = texture(uCurrent, uv - sdir * spower);
  vec4 next = texture(uNext, uv - dir * power);

  vec4 blend = mix(current, next, th);
  vec3 col = mix(uBgColor, blend.rgb, blend.a);

  outColor = vec4(col, sth);
}
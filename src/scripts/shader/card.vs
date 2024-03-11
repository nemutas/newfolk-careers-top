#version 300 es

in vec3 position;
in vec3 normal;
in vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform float uPositionRadius;

out vec2 vUv;
out vec2 vScreenUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  pos.xz = normalize(pos.xz) * uPositionRadius;
  vec4 mvpPos = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);

  vec3 p = mvpPos.xyz / mvpPos.w;
  float d = length(p);  
  vec4 mvPos = viewMatrix * modelMatrix * vec4(pos, 1.0);
  mvPos.x += p.x * d * d * 0.05;
  mvPos.z -= 0.1;
  gl_Position = projectionMatrix * mvPos;

  vScreenUv = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
}
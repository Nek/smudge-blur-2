#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_diffuse;
uniform float u_aspect;

in vec2 v_texCoord;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  vec2 textCoord = v_texCoord;
  textCoord.x *= u_aspect;
  vec2 diffuseSize = vec2(textureSize(u_diffuse, 0));
  float diffuseAspect = diffuseSize.y / diffuseSize.x;
  textCoord.x *= diffuseAspect;
  textCoord.x -= (1.0 - u_aspect * diffuseAspect) / 2.0;
  vec4 diffuseColor = texture(u_diffuse, textCoord);
  outColor = diffuseColor;
}
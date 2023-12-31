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
  vec2 texCoord = v_texCoord;
  texCoord.x -= .5;
  texCoord.x *= u_aspect / 2.;
  texCoord.x += .5;
  vec4 diffuseColor = texture(u_diffuse, texCoord);
  outColor = diffuseColor;
}
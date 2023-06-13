#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_diffuse;
in vec2 v_texCoord;
 
// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {
  vec4 diffuseColor = texture(u_diffuse, v_texCoord);
  // diffuseColor.r = v_texCoord.r;
  // diffuseColor.g = v_texCoord.g;
  // diffuseColor.b = 0.;
  // diffuseColor.a = 1.;
  outColor = diffuseColor;
}
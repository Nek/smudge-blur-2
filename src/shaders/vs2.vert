#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec2 a_texcoord;

out vec2 v_texCoord;

// all shaders have a main function
void main() {
  v_texCoord = a_texcoord;
  gl_Position = a_position;
}
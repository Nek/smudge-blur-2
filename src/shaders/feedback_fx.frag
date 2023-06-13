#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_feedback;
uniform sampler2D u_image;
uniform sampler2D u_displacement;

uniform float u_aspect;

uniform float scale;// = 0.001;
uniform vec2 zoom;//1.01

#define TWO_PI = 6.28318531;

in vec2 v_texCoord;
 
// we need to declare an output for the fragment shader
out vec4 outColor;

vec2 toCartesian(vec4 displacementMap) {
  float angle = displacementMap.x * 6.28318531;
  float distance = (1. - (displacementMap.y * .09 + .01)) * scale;
	float x = distance * cos(angle);
  float y = distance * sin(angle);
	return vec2(x, y);
}

#include uv_scale.glsl
 
void main() {
  vec2 textCoord = v_texCoord;
  textCoord.x *= u_aspect;
  vec2 feedbackSize = vec2(textureSize(u_feedback, 0));
  float feedbackAspect = feedbackSize.y / feedbackSize.x;
  textCoord.x *= feedbackAspect;
  textCoord.x -= (1.0 - u_aspect * feedbackAspect) / 2.0;
  vec4 diffuseColor = texture(u_feedback, textCoord);
  outColor = diffuseColor;

//   vec2 p = v_texCoord;
//   p = uvScale(p, zoom);
//   vec4 colorOrig = texture(u_image, p);
//   // vec4 displacement = (texture2D(displacementMap, p) + vec4(texOffset, 0.0, 0.0)) * vec4(amp, 1.0, 1.0);
//   vec2 displace =  p + toCartesian(texture(u_displacement, uv.xy));//p + displacement.rg;
//   vec4 colorDisplaced = texture2D(u_feedback, displace);
//   outColor = mix(colorOrig, colorDisplaced, .98);//texture2D(displacementMap, p);;
}
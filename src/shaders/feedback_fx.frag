#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_feedback;
uniform sampler2D u_image;

uniform float u_scale;// = 0.001;
uniform vec2 u_zoom;//1.01

#define TWO_PI = 6.28318531;

in vec2 v_texCoord;
 
// we need to declare an output for the fragment shader
out vec4 outColor;

vec2 toCartesian(vec4 displacementMap, float scale) {
  float angle = displacementMap.x * 6.28318531;
  float distance = (1. - (displacementMap.y * .09 + .01)) * scale;
	float x = distance * cos(angle);
  float y = distance * sin(angle);
	return vec2(x, y);
}

uniform vec2 u_noise_scale;
uniform float u_time;

#include lygia/generative/curl.glsl
#include uv_scale.glsl

vec4 displacement(vec2 uv, float time, vec2 noise_scale) {
    vec2 st = uv.xy * noise_scale;

    vec3 color = vec3(0.0);

    color = curl(vec3(st, cos(time) * 0.5 + 0.5));
    color *= 0.5;
    color += .5;

    return vec4(color,1.0);
}

void main() {
  vec2 texCoord = v_texCoord;

  vec4 diffuseColor = texture(u_image, v_texCoord);
  vec4 displacementColor = displacement(texCoord, u_time, u_noise_scale);
  vec2 displacementCoord = uvScale(v_texCoord, u_zoom) + toCartesian(displacementColor, u_scale);
  vec4 colorDisplaced = texture(u_feedback, displacementCoord);
  outColor = mix(diffuseColor, colorDisplaced, 0.965);;
}
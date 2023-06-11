import { Component, createEffect, onMount } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import createRAF from "@solid-primitives/raf";
import * as twgl from "twgl.js";
import vs from "./shaders/vs.vert?raw";
import fs from "./shaders/fs.frag?raw";

import uvGridUrl from "./assets/uvgrid.jpg";

console.log(uvGridUrl);

const App: Component = () => {
  let canvasEl: HTMLCanvasElement | undefined;
  let videoEl: HTMLVideoElement | undefined;

  onMount(() => {
    if (canvasEl !== undefined) {

      twgl.setDefaults({attribPrefix: "a_"});
      const m4 = twgl.m4;

      const gl = canvasEl.getContext("webgl2");
      if (gl === null) {
        throw new Error("WebGL 2.0 is not supported");
      }    

      const arrays: twgl.Arrays = {
        position: {
          type: gl.FLOAT,
          normalize: false,
          numComponents: 2,
          data: [
            -1, -1,
            -1, 1,
            1, 1,
            -1, -1,
            1, 1,
            1, -1,
        ]},
        texcoord: {
          type: gl.FLOAT,
          normalize: false,
          numComponents: 2,
          attrib: "a_texcoord",
          data: [
            0, 0,
            0, -1,
            -1, -1,
            0, 0,
            -1, -1,
            -1, 0,
        ]},
      };

      const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

      const camera = m4.identity();
      const view = m4.identity();

      function render(time: number) {
        if (gl === null) return;
        if (videoEl?.readyState === undefined || videoEl?.readyState < 2) return;
        twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const texture = twgl.createTexture(gl, {
          src: videoEl,
        });
        const uniforms = {
          u_diffuse: texture,
          u_viewInverse: camera,
          u_world: m4.identity(),
          u_worldInverseTranspose: m4.identity(),
          u_worldViewProjection: m4.identity(),
          u_aspect: gl.canvas.width / gl.canvas.height,
          // time: time * 0.001,
          // resolution: [gl.canvas.width, gl.canvas.height],
        };
    
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo);
        // gl.drawArrays(gl.TRIANGLES, 0, 3)
        // raf(render);
      }

      const [_, start] = createRAF(
        render
      );

      start();
    }
  });

  async function startCam() {
    if (!videoEl) return;

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        frameRate: 60,
        width: 1920,
        height: 1080,
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

    videoEl.srcObject = mediaStream;
    videoEl.onloadedmetadata = () => {
      if (!videoEl) return;
      videoEl.play();
    };
  }

  return (
    <div class={styles.App} onclick={startCam}>
      <video
        crossorigin="anonymous"
        style={{
          position: "absolute",
          "z-index": -1,
          display: "none",
        }}
        width={1920}
        height={1080}
        controls={false}
        autoplay={true}
        muted={true}
        ref={videoEl}
      />
      <canvas width={1920} height={1080} ref={canvasEl}></canvas>
    </div>
  );
};

export default App;

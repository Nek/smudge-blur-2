import { Component, onMount } from 'solid-js';

import styles from './App.module.css';
import createRAF from "@solid-primitives/raf";
import * as twgl from "twgl.js";
import vs from "./shaders/vs.vert?raw";
import vs2 from "./shaders/vs2.vert?raw";
import fs from "./shaders/fs.frag?raw";
import fs2 from "./shaders/fs2.frag?raw";
import uvGridUrl from "./assets/uvgrid.jpg";

const App: Component = () => {
  let canvasEl: HTMLCanvasElement | undefined;
  let videoEl: HTMLVideoElement | undefined;

  onMount(() => {
    if (canvasEl !== undefined) {

      twgl.setDefaults({attribPrefix: "a_"});

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
          data: [
            0, 0,
            0, -1,
            -1, -1,
            0, 0,
            -1, -1,
            -1, 0,
        ]},
      };

      const arrays2: twgl.Arrays = {
        position: {
          type: gl.FLOAT,
          normalize: false,
          numComponents: 2,
          attrib: "a_position",
          data: [
            -1, -1,
            -1, 1,
            1, 1,
            -1, -1,
            1, 1,
            1, -1,
          ]
        },
        texcoord: {
          type: gl.FLOAT,
          normalize: false,
          numComponents: 2,
          attrib: "a_texcoord",
          data:
            [
              0, 1,
              0, 0,
              1, 0,
              0, 1,
              1, 0,
              1, 1,
            ]
        },
      };

      const bufferInfo1 = twgl.createBufferInfoFromArrays(gl, arrays);
      const bufferInfo2 = twgl.createBufferInfoFromArrays(gl, arrays2);


      const videoFb = twgl.createFramebufferInfo(gl, undefined, 1920, 1080);

      const programInfo1 = twgl.createProgramInfo(gl, [vs, fs]);
      const programInfo2 = twgl.createProgramInfo(gl, [vs2, fs2]);

      const videoTexture = twgl.createTexture(gl, {flipY: 1});

      function render(time: number) {
        if (gl === null) return;
        if (videoEl?.readyState === undefined || videoEl?.readyState < 2) return;

        twgl.bindFramebufferInfo(gl, videoFb);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        twgl.setTextureFromElement(gl, videoTexture, videoEl, {width: 1920, height: 1080});

        const uniforms = {
          u_diffuse: videoTexture,
          u_aspect: gl.canvas.width / gl.canvas.height,
          u_time: time * 0.001,
        };
    
        gl.useProgram(programInfo1.program);
        twgl.setBuffersAndAttributes(gl, programInfo1, bufferInfo1);
        twgl.setUniforms(programInfo1, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo1);

        twgl.bindFramebufferInfo(gl, null);

        twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const uniforms2 = {
          u_diffuse: videoFb.attachments[0],
        };
    
        gl.useProgram(programInfo2.program);
        twgl.setBuffersAndAttributes(gl, programInfo2, bufferInfo2);
        twgl.setUniforms(programInfo2, uniforms2);
        twgl.drawBufferInfo(gl, bufferInfo2);
        
        // twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // gl.clearColor(0, 0, 0, 0);
        // gl.clear(gl.COLOR_BUFFER_BIT);

        // const uniforms = {
        //   u_diffuse: fbTexture,
        // };

        // gl.useProgram(programInfo2.program);
        // twgl.setBuffersAndAttributes(gl, programInfo2, bufferInfo2);
        // twgl.setUniforms(programInfo2, uniforms);
        // twgl.drawBufferInfo(gl, bufferInfo2);
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

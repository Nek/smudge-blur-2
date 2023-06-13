import { Component, onMount } from 'solid-js';

import styles from './App.module.css';
import createRAF from "@solid-primitives/raf";
import * as twgl from "twgl.js";
import basicVs from "./shaders/basic.vert?raw";
import textureCenteredFs from "./shaders/texture_centered.frag?raw";
import textureBasicFs from "./shaders/texture_basic.frag?raw";

const App: Component = () => {
  let canvasEl: HTMLCanvasElement | undefined;
  let videoEl: HTMLVideoElement | undefined;

  onMount(() => {
    if (canvasEl !== undefined) {
      twgl.setDefaults({ attribPrefix: "a_" });

      const gl = canvasEl.getContext("webgl2");
      if (gl === null) {
        throw new Error("WebGL 2.0 is not supported");
      }

      const quadWithCorrectedUvArrays: twgl.Arrays = {
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
          ]
        },
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
          ]
        },
      };

      const quadArrays: twgl.Arrays = {
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
          ]
        },
        texcoord: {
          type: gl.FLOAT,
          normalize: false,
          numComponents: 2,
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

      const drawTexturedQuadCenteredBufferInfo = twgl.createBufferInfoFromArrays(gl, quadWithCorrectedUvArrays);
      const drawTexturedQuadBufferInfo = twgl.createBufferInfoFromArrays(gl, quadArrays);

      const videoFramebufferInfo = twgl.createFramebufferInfo(gl, undefined, 1920, 1080);

      const drawTexturedQuadCenteredProgramInfo = twgl.createProgramInfo(gl, [basicVs, textureCenteredFs]);
      const drawTexturedQuadProgramInfo = twgl.createProgramInfo(gl, [basicVs, textureBasicFs]);

      const videoTexture = twgl.createTexture(gl, { flipY: 1 });

      function render(time: number) {
        if (gl === null) return;
        if (videoEl?.readyState === undefined || videoEl?.readyState < 2) return;

        /* Draw to framebuffer */
        twgl.bindFramebufferInfo(gl, videoFramebufferInfo);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        twgl.setTextureFromElement(gl, videoTexture, videoEl, { width: 1920, height: 1080 });

        const drawTexturedQuadCenteredUniforms = {
          u_diffuse: videoTexture,
          u_aspect: gl.canvas.width / gl.canvas.height,
          u_time: time * 0.001,
        };

        gl.useProgram(drawTexturedQuadCenteredProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, drawTexturedQuadCenteredProgramInfo, drawTexturedQuadCenteredBufferInfo);
        twgl.setUniforms(drawTexturedQuadCenteredProgramInfo, drawTexturedQuadCenteredUniforms);
        twgl.drawBufferInfo(gl, drawTexturedQuadCenteredBufferInfo);

        /* Draw to canvas */
        twgl.bindFramebufferInfo(gl, null);

        twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const drawTexturedQuadUniforms = {
          u_diffuse: videoFramebufferInfo.attachments[0],
        };

        gl.useProgram(drawTexturedQuadProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, drawTexturedQuadProgramInfo, drawTexturedQuadBufferInfo);
        twgl.setUniforms(drawTexturedQuadProgramInfo, drawTexturedQuadUniforms);
        twgl.drawBufferInfo(gl, drawTexturedQuadBufferInfo);
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

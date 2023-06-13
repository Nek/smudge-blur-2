import { Component, onMount } from 'solid-js';

import styles from './App.module.css';
import createRAF from "@solid-primitives/raf";
import * as twgl from "twgl.js";
import basicVs from "./shaders/basic.vert";
import textureCenteredFs from "./shaders/texture_quad_centered.frag";
import textureBasicFs from "./shaders/texture_quad_basic.frag";
import feedbackFxFs from "./shaders/feedback_fx.frag";

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

      const flippedUvQuad: twgl.Arrays = {
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
            0, 1,
            1, 1,
            0, 0,
            1, 1,
            1, 0,
          ]
        },
      };

      const uvQuad: twgl.Arrays = {
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
              1, 1,
              1, 0,
              0, 0,
              1, 1,
              0, 0,
              0, 1,
            ]
        },
      };

      const drawTexturedQuadBasicBufferInfo = twgl.createBufferInfoFromArrays(gl, uvQuad);
      const drawTexturedQuadBasicProgramInfo = twgl.createProgramInfo(gl, [basicVs, textureBasicFs]);

      const drawTexturedQuadCenteredBufferInfo = twgl.createBufferInfoFromArrays(gl, flippedUvQuad);
      const drawTexturedQuadCenteredProgramInfo = twgl.createProgramInfo(gl, [basicVs, textureCenteredFs]);

      const drawFxBufferInfo = twgl.createBufferInfoFromArrays(gl, uvQuad);
      const drawFxProgramInfo = twgl.createProgramInfo(gl, [basicVs, feedbackFxFs]);

      const videoFramebufferInfo = twgl.createFramebufferInfo(gl, undefined, window.innerWidth, window.innerHeight);
      const videoTexture = twgl.createTexture(gl);

      const feedbackFramebufferInfo = twgl.createFramebufferInfo(gl, undefined, window.innerWidth, window.innerHeight);

      function drawTextureCentered(gl: WebGLRenderingContext | WebGL2RenderingContext, texture: WebGLTexture) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const drawTexturedQuadBasicUniforms = {
          u_diffuse: texture,
        };

        gl.useProgram(drawTexturedQuadBasicProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, drawTexturedQuadBasicProgramInfo, drawTexturedQuadBasicBufferInfo);
        twgl.setUniforms(drawTexturedQuadBasicProgramInfo, drawTexturedQuadBasicUniforms);
        twgl.drawBufferInfo(gl, drawTexturedQuadBasicBufferInfo);
      }

      function drawTextureFlipped(gl: WebGLRenderingContext | WebGL2RenderingContext, texture: WebGLTexture | WebGLRenderbuffer) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const drawTexturedQuadCenteredUniforms = {
          u_diffuse: texture,
          u_aspect: gl.canvas.width / gl.canvas.height,
        };

        gl.useProgram(drawTexturedQuadCenteredProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, drawTexturedQuadCenteredProgramInfo, drawTexturedQuadCenteredBufferInfo);
        twgl.setUniforms(drawTexturedQuadCenteredProgramInfo, drawTexturedQuadCenteredUniforms);
        twgl.drawBufferInfo(gl, drawTexturedQuadCenteredBufferInfo);
      }

      function drawFeedbackFx(gl: WebGLRenderingContext | WebGL2RenderingContext, feedback: WebGLTexture | WebGLRenderbuffer, texture: WebGLTexture | WebGLRenderbuffer, time: number) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const drawFxUniforms = {
          u_feedback: feedback,
          u_image: texture,
          u_scale: 0.001,
          u_zoom: [1.001, 1.001],
          u_noise_scale: [1.75,1.75],
          u_time: time * 0.0003,
        };

        gl.useProgram(drawFxProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, drawFxProgramInfo, drawFxBufferInfo);
        twgl.setUniforms(drawFxProgramInfo, drawFxUniforms);
        twgl.drawBufferInfo(gl, drawTexturedQuadCenteredBufferInfo);
      }

      function render(time: number) {
        if (gl === null) return;
        if (videoEl?.readyState === undefined || videoEl?.readyState < 2) return;

        if (twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement)) {
          twgl.resizeFramebufferInfo(gl, feedbackFramebufferInfo);
          twgl.resizeFramebufferInfo(gl, videoFramebufferInfo);
        }

        /* Read webcam texture */
        twgl.setTextureFromElement(gl, videoTexture, videoEl, { width: 1920, height: 1080 });

        twgl.bindFramebufferInfo(gl, videoFramebufferInfo);
        drawFeedbackFx(gl, feedbackFramebufferInfo.attachments[0], videoTexture, time);

        twgl.bindFramebufferInfo(gl, feedbackFramebufferInfo);
        drawTextureCentered(gl, videoFramebufferInfo.attachments[0]);

        twgl.bindFramebufferInfo(gl, null);
        drawTextureFlipped(gl, videoFramebufferInfo.attachments[0]);
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
      <canvas width={1920} height={1080} ref={canvasEl} ondblclick={() => canvasEl!.requestFullscreen()}></canvas>
    </div>
  );
};

export default App;

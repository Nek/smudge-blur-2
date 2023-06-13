import { Component, onMount } from 'solid-js';

import styles from './App.module.css';
import createRAF from "@solid-primitives/raf";
import * as twgl from "twgl.js";
import basicVs from "./shaders/basic.vert";
import textureCenteredFs from "./shaders/texture_centered.frag";
import textureBasicFs from "./shaders/texture_basic.frag";
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
            0, 1,
            1, 1,
            0, 0,
            1, 1,
            1, 0,
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
              1, 1,
              1, 0,
              0, 0,
              1, 1,
              0, 0,
              0, 1,
            ]
        },
      };

      const drawTexturedQuadCenteredBufferInfo = twgl.createBufferInfoFromArrays(gl, quadArrays);
      const drawTexturedQuadCenteredProgramInfo = twgl.createProgramInfo(gl, [basicVs, textureBasicFs]);

      const drawTexturedQuadBufferInfo = twgl.createBufferInfoFromArrays(gl, quadWithCorrectedUvArrays);
      const drawTexturedQuadProgramInfo = twgl.createProgramInfo(gl, [basicVs, textureCenteredFs]);

      const drawFxBufferInfo = twgl.createBufferInfoFromArrays(gl, quadArrays);
      const drawFxProgramInfo = twgl.createProgramInfo(gl, [basicVs, feedbackFxFs]);

      const videoFramebufferInfo = twgl.createFramebufferInfo(gl, undefined, 1920, 1080);
      const videoTexture = twgl.createTexture(gl);

      const feedbackFramebufferInfo = twgl.createFramebufferInfo(gl, undefined, 1920, 1080);

      function drawTextureCentered(gl: WebGLRenderingContext | WebGL2RenderingContext, texture: WebGLTexture) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const drawTexturedQuadCenteredUniforms = {
          u_diffuse: texture,
          u_aspect: gl.canvas.width / gl.canvas.height,
          u_resolution: [gl.canvas.width, gl.canvas.height],
        };

        gl.useProgram(drawTexturedQuadCenteredProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, drawTexturedQuadCenteredProgramInfo, drawTexturedQuadCenteredBufferInfo);
        twgl.setUniforms(drawTexturedQuadCenteredProgramInfo, drawTexturedQuadCenteredUniforms);
        twgl.drawBufferInfo(gl, drawTexturedQuadCenteredBufferInfo);
      }

      function drawTextureFlipped(gl: WebGLRenderingContext | WebGL2RenderingContext, texture: WebGLTexture | WebGLRenderbuffer) {

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const drawTexturedQuadUniforms = {
          u_diffuse: texture,
          u_aspect: gl.canvas.width / gl.canvas.height,
        };

        gl.useProgram(drawTexturedQuadProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, drawTexturedQuadProgramInfo, drawTexturedQuadBufferInfo);
        twgl.setUniforms(drawTexturedQuadProgramInfo, drawTexturedQuadUniforms);
        twgl.drawBufferInfo(gl, drawTexturedQuadBufferInfo);
      }

      function drawFeedbackFx(gl: WebGLRenderingContext | WebGL2RenderingContext, feedback: WebGLTexture | WebGLRenderbuffer, texture: WebGLTexture | WebGLRenderbuffer, time: number) {

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const drawFxUniforms = {
          u_feedback: feedback,
          u_image: texture,
          u_aspect: gl.canvas.height / gl.canvas.width,
          u_scale: 0.003,
          u_zoom: [1.01, 1.01],
          u_noise_scale: [1.75,1.75],
          u_time: time * 0.0003,
        };

        gl.useProgram(drawFxProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, drawFxProgramInfo, drawFxBufferInfo);
        twgl.setUniforms(drawFxProgramInfo, drawFxUniforms);
        twgl.drawBufferInfo(gl, drawTexturedQuadBufferInfo);
      }

      function render(time: number) {
        if (gl === null) return;
        if (videoEl?.readyState === undefined || videoEl?.readyState < 2) return;

        // twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

        if (twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement)) {
          console.log('resize');
          // resize the attachments
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

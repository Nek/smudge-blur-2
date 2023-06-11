import { Component, createEffect, onMount } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';
import createRAF from "@solid-primitives/raf";
import * as twgl from "twgl.js";
import vs from "./shaders/vs.vert?raw";
import fs from "./shaders/fs.frag?raw";

const App: Component = () => {
  let canvas: HTMLCanvasElement | undefined;

  onMount(() => {
    if (canvas !== undefined) {
      const gl = canvas.getContext("webgl2");
      if (gl === null) {
        throw new Error("WebGL 2.0 is not supported");
      }
      

      const arrays: twgl.Arrays = {
        position: {
          type: gl.FLOAT,
          normalize: false,
          numComponents: 2,
          attrib: "a_position",
          data: [
            0, 0,
            0, 0.5,
            0.7, 0,
        ]},
      };

      const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

      function render(time: number) {
        if (gl === null) return;
        twgl.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        const uniforms = {
          // time: time * 0.001,
          // resolution: [gl.canvas.width, gl.canvas.height],
        };
    
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        // twgl.setUniforms(programInfo, uniforms);
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

  return (
    <div class={styles.App}>
      <canvas width={1920} height={1080} ref={canvas}></canvas>
    </div>
  );
};

export default App;

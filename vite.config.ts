import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [glsl(), solidPlugin()],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});

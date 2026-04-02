import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/win98maze/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
          if (
            id.includes("/src/game/MazeGame.jsx") ||
            id.includes("/src/render/") ||
            id.includes("/src/world/")
          ) {
            return "maze-runtime";
          }
        },
      },
    },
  },
})

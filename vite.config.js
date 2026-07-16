import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        opcao1: resolve(__dirname, "opcao-1/index.html"),
        imersaoV1: resolve(__dirname, "imersao-empresa-com-claude-v1/index.html"),
        rotinaAntiCaos: resolve(__dirname, "rotina-anti-caos/index.html"),
      },
    },
  },
});

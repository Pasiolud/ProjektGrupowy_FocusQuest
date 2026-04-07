import { defineConfig } from 'vite'

export default defineConfig({
  envDir: '../', // Szukaj pliku .env w c:\FocusQuest\ zamiast w folderze web/
  server: {
    port: 5173
  }
})

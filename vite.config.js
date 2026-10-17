import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `npm run dev`       -> http://localhost:5173 (desktop, or Quest via `adb reverse`)
// `npm run dev:quest` -> https://<your-LAN-IP>:5173 (Quest over Wi-Fi, self-signed cert)
export default defineConfig(({ command, mode }) => ({
  // GitHub Pages serves the site from /<repo-name>/
  base: command === 'build' ? '/Girlhoocode_2026Fall/' : '/',
  plugins: mode === 'quest' ? [basicSsl()] : [],
}));

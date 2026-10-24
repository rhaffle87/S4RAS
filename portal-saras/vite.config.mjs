import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.REACT_APP_BACKEND_API_URL': JSON.stringify(env.REACT_APP_BACKEND_API_URL || ''),
      'process.env.REACT_APP_DEPLOY_TOKEN': JSON.stringify(env.REACT_APP_DEPLOY_TOKEN || ''),
    },
    build: {
      outDir: 'build'
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.js'],
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}']
    }
  };
});


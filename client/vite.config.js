import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ command, mode }) => {
  if (mode === 'test') {
    return {
      plugins: [react()],
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.js'],
      },
    }
  }
  // HTTPS encendido por defecto (necesario para entrar desde el celular en la red local:
  // micro y lector QR requieren contexto seguro). Se puede apagar con VITE_DEV_HTTPS=false.
  const useHttps = process.env.VITE_DEV_HTTPS !== 'false'

  return {
    plugins: [
      react(),
      tailwindcss(),
      command === 'serve' && useHttps && basicSsl()
    ].filter(Boolean),

    server: {
      host: true,
      https: useHttps,
    }
  }
})

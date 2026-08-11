import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  define: {
    'import.meta.env.VITE_COGNITO_DOMAIN': JSON.stringify(
      process.env[`COGNITO_DOMAIN_${process.env.AWS_BRANCH || 'STAGING'}`] || process.env.VITE_COGNITO_DOMAIN
    ),
    'import.meta.env.VITE_COGNITO_CLIENT_ID': JSON.stringify(
      process.env[`COGNITO_CLIENT_ID_${process.env.AWS_BRANCH || 'STAGING'}`] || process.env.VITE_COGNITO_CLIENT_ID
    ),
    'import.meta.env.VITE_REDIRECT_URI': JSON.stringify(
      process.env[`REDIRECT_URI_${process.env.AWS_BRANCH || 'STAGING'}`] || process.env.VITE_REDIRECT_URI
    ),
    'import.meta.env.VITE_COGNITO_SCOPE': JSON.stringify(
      process.env.COGNITO_SCOPE || process.env.VITE_COGNITO_SCOPE
    ),
  },
})

import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import packageJson from "./package.json"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/NexusClassWeb/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      '__APP_VERSION__': JSON.stringify(packageJson.version),
      '__API_GEMINI_KEY__': JSON.stringify(env.VITE_GEMINI_KEY),
      '__URL_SUPABASE__': JSON.stringify(env.VITE_SUPABASE_URL),
      '__KEY_SUPABASE__': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      '__BASE_URL__': JSON.stringify(env.BASE_URL || '/NexusClassWeb/')
    },
  }
})
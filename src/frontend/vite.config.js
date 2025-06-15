import path from "path"
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],
    server: {
        port: process.env.PORT,
        strictPort: true,
        host: true,
        allowedHosts: ['frontend'],
        origin: `http://0.0.0.0:${process.env.PORT}`,
        watch: {
            usePolling: true,
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
        preserveSymlinks: true
    },
    define: {
        'process.env': JSON.stringify(process.env),
        '__dirname': JSON.stringify(__dirname)
    }
})
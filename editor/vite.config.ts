import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '')

    const backend = env.VITE_BACKEND_URL
    return {
        port: Number(env.VITE_PORT),
        plugins: [vue()],
        resolve: {alias: {'@': '/src'}},
        server: {
            proxy: {
                '/sessions': {
                    target: backend,
                    changeOrigin: true,
                    secure: false,
                    rewrite: p => p,
                },
            },
        },
    }
})

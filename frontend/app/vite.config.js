import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
    build: {
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
            format: {
                comments: false,
            },
        },
    },
    plugins: [
        viteSingleFile({ removeViteModuleLoader: true }),
    ]
});

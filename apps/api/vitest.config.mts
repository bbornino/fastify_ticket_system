import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {tsconfigPaths: true,},
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        env: {
            DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5438/ticket_system',
            JWT_SECRET: 'test-secret-for-vitest-runs',
        },
    },
});
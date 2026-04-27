import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 390,
    viewportHeight: 844,
    defaultCommandTimeout: 12000,
    requestTimeout: 15000,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(_on, _config) {},
  },
})

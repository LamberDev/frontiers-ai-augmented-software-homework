import { createApp } from 'vue'
import App from './App.vue'
import { router } from './providers/router'
import './styles/main.css'

export function createPeerReviewApp() {
  const app = createApp(App)
  app.use(router)
  return app
}

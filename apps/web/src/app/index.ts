import { createApp } from 'vue'
import '@fontsource/nunito-sans/400.css'
import '@fontsource/nunito-sans/600.css'
import '@fontsource/nunito-sans/700.css'
import App from './App.vue'
import { router } from './providers/router'
import { vuetify } from './providers/vuetify'
import './styles/main.css'

export function createPeerReviewApp() {
  const app = createApp(App)
  app.use(router)
  app.use(vuetify)
  return app
}

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { authService } from './services/authService'

const app = createApp(App)
app.use(router)

// Initialize Supabase Auth Session
authService.initialize().finally(() => {
  app.mount('#app')
})

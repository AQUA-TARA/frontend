<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'

const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)

const loading = ref(false)
const errorMessage = ref('')

const handleSignIn = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Email dan kata sandi wajib diisi.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const result = await authService.login(email.value, password.value)
    // Otomatis redirect berdasarkan authoritative role (bukan pilihan pengguna)
    router.push(result.redirectPath)
  } catch (err) {
    console.error('Login error:', err)
    errorMessage.value = err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-900 flex justify-center w-full">
    <!-- Mobile Frame container matching UI-USER reference style -->
    <div class="w-full max-w-md min-h-screen flex flex-col bg-gradient-to-b from-[#f8fafc] via-[#eff6ff] to-[#93c5fd] text-slate-900 font-sans shadow-2xl relative px-7 pt-4 pb-12 overflow-y-auto">
      
      <!-- Top Status Bar (9:41, Signal, Wifi, Battery) -->
      <div class="flex items-center justify-between text-xs font-semibold text-slate-900 mb-6 shrink-0">
        <span>9:41</span>
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-3.5" viewBox="0 0 20 16" fill="currentColor">
            <rect x="1" y="10" width="3" height="6" rx="1" />
            <rect x="6" y="7" width="3" height="9" rx="1" />
            <rect x="11" y="4" width="3" height="12" rx="1" />
            <rect x="16" y="1" width="3" height="15" rx="1" />
          </svg>
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/>
          </svg>
          <div class="w-5 h-2.5 border border-slate-900 rounded-xs p-0.5 flex items-center">
            <div class="h-full w-full bg-slate-900 rounded-2xs"></div>
          </div>
        </div>
      </div>

      <!-- Back to Home -->
      <button 
        type="button" 
        @click="router.push('/')" 
        class="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 mb-8 self-start cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to home</span>
      </button>

      <!-- Page Title -->
      <h1 class="text-2xl font-bold text-center text-slate-900 mb-8 tracking-tight">
        Sign In
      </h1>

      <!-- Unified Login Form -->
      <form @submit.prevent="handleSignIn" class="space-y-4">
        
        <!-- Error Alert -->
        <div v-if="errorMessage" class="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {{ errorMessage }}
        </div>

        <!-- Email Address -->
        <div>
          <label class="block text-xs font-medium text-slate-800 mb-1.5">Email Address</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="name@company.com"
            class="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00669e] focus:border-[#00669e] transition shadow-2xs"
          />
        </div>

        <!-- Password with Eye Toggle -->
        <div>
          <label class="block text-xs font-medium text-slate-800 mb-1.5">Password</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="••••••"
              class="w-full px-3.5 py-2.5 pr-10 text-xs bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00669e] focus:border-[#00669e] transition shadow-2xs"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <svg v-if="showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="flex items-center justify-between text-[11px] pt-1">
          <label class="flex items-center gap-2 cursor-pointer text-slate-700">
            <input 
              v-model="rememberMe" 
              type="checkbox" 
              class="w-3.5 h-3.5 rounded-xs border-slate-300 text-[#00669e] focus:ring-0 cursor-pointer"
            />
            <span>Remember me</span>
          </label>
          <RouterLink to="/forgot-password" class="text-slate-700 hover:text-slate-900 font-medium">
            Forgot Password
          </RouterLink>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full mt-4 py-2.5 px-4 rounded-md bg-[#00669e] hover:bg-[#005584] active:scale-[0.99] text-white text-xs font-semibold shadow-sm transition flex items-center justify-center cursor-pointer disabled:opacity-60"
        >
          <span v-if="!loading">Sign In</span>
          <span v-else class="flex items-center gap-2">
            <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Memproses...
          </span>
        </button>

      </form>

      <!-- Pink/Peach Divider Line matching Login Page.png -->
      <div class="my-10 h-[1.5px] bg-[#fbcfe8]/60 w-full"></div>

      <!-- Social Logins Placeholder matching reference -->
      <div class="space-y-3">
        <p class="text-center text-[11px] text-slate-600 font-medium">Or continue with</p>
        
        <button
          type="button"
          class="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-white/80 rounded-full text-xs font-medium text-slate-800 shadow-sm flex items-center justify-center gap-3 transition cursor-pointer"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.68-5.17 3.68-9.09z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.26 21.3 7.37 24 12 24z"/>
            <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.27C.46 8.24 0 10.06 0 12s.46 3.76 1.27 5.38l4-3.09z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.27 6.62l4 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
          </svg>
          <span>Sign up with Google</span>
        </button>

        <button
          type="button"
          class="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-white/80 rounded-full text-xs font-medium text-slate-800 shadow-sm flex items-center justify-center gap-3 transition cursor-pointer"
        >
          <svg class="w-4 h-4 fill-black" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.59-7.79-11.71-14.25-6.68-10.46-11.85-22.11-15.5-34.96-3.64-12.85-5.47-24.97-5.47-36.35 0-14.15 3.48-26.04 10.45-35.67 6.96-9.63 15.68-14.54 26.15-14.75 4.9 0 10.15 1.25 15.75 3.75 5.61 2.5 9.4 3.8 11.37 3.9 1.63 0 5.66-1.35 12.09-4.05 6.43-2.7 12.18-3.9 17.25-3.6 13.62.65 24.38 5.76 32.27 15.34-11.88 7.18-17.7 16.89-17.47 29.13.24 9.69 3.91 17.78 11.01 24.27 7.1 6.49 15.54 10.22 25.32 11.19-2.29 6.86-5.12 14.26-8.51 22.2zM119.22 31.84c0-7.73 2.77-14.87 8.32-21.43 5.55-6.55 12.35-10.41 20.4-11.58.22 1.09.33 2.07.33 2.94 0 7.62-2.94 14.97-8.82 22.06-5.88 7.08-12.88 11.04-21 11.89-.23-1.31-.23-2.6-.23-3.88z"/>
          </svg>
          <span>Sign up with Apple</span>
        </button>
      </div>

      <!-- Footer switch to Register -->
      <div class="mt-8 text-center text-xs text-slate-700">
        <span>Not a member? </span>
        <RouterLink to="/register" class="font-bold text-[#00669e] hover:underline cursor-pointer">
          Sign up
        </RouterLink>
      </div>

    </div>
  </div>
</template>

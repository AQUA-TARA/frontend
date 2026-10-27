<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services/authService'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const loading = ref(false)

const handleSignIn = async () => {
  errorMessage.value = ''
  if (!email.value || !password.value) {
    errorMessage.value = 'Email dan kata sandi wajib diisi.'
    return
  }

  loading.value = true
  try {
    const result = await authService.login(email.value, password.value)
    
    // Check if there is a target redirect query param
    const redirectQuery = route.query.redirect
    if (redirectQuery) {
      router.push(redirectQuery)
    } else {
      router.push(result.redirectPath)
    }
  } catch (err) {
    errorMessage.value = err.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white via-white to-[#60a5fa]/40 flex flex-col items-center justify-between px-6 pt-12 pb-8 font-sans select-none">
    <div class="w-full max-w-sm">
      <!-- Back to home -->
      <button
        type="button"
        @click="goBack"
        class="flex items-center space-x-1.5 text-xs text-gray-800 hover:text-black mb-8 font-medium cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to home</span>
      </button>

      <!-- Title -->
      <h1 class="text-2xl font-bold text-center text-gray-900 tracking-tight mb-8">Sign In</h1>

      <!-- Error Alert -->
      <div 
        v-if="errorMessage" 
        class="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-xs font-medium"
      >
        {{ errorMessage }}
      </div>

      <!-- Unified Sign In Form -->
      <form @submit.prevent="handleSignIn" class="space-y-4">
        <!-- Email Address -->
        <div>
          <label class="block text-xs font-medium text-gray-800 mb-1.5">Email Address</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="name@company.com"
            class="w-full rounded-lg border border-gray-400/80 bg-white px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00669e] shadow-xs"
          />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-xs font-medium text-gray-800 mb-1.5">Password</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="******"
              class="w-full rounded-lg border border-gray-400/80 bg-white px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00669e] shadow-xs pr-10"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember me & Forgot Password -->
        <div class="flex items-center justify-between pt-1">
          <label class="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
            <input
              v-model="rememberMe"
              type="checkbox"
              class="w-3.5 h-3.5 rounded border-gray-300 text-[#00669e] focus:ring-0"
            />
            <span>Remember me</span>
          </label>
          <button
            type="button"
            @click="router.push('/forgot-password')"
            class="text-xs text-gray-800 hover:text-[#00669e] font-medium"
          >
            Forgot Password
          </button>
        </div>

        <!-- Sign In Button (Blue pill) -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full mt-4 py-3 rounded-lg bg-[#00669e] hover:bg-[#005584] active:scale-95 text-white text-xs font-semibold shadow transition disabled:opacity-50"
        >
          {{ loading ? 'Memverifikasi...' : 'Sign In' }}
        </button>
      </form>

      <!-- Rose Divider Line -->
      <div class="my-10 border-t border-rose-300"></div>

      <!-- Social Login -->
      <div class="space-y-3">
        <p class="text-center text-xs text-gray-700 mb-2">Or continue with</p>

        <!-- Google button -->
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center space-x-2 shadow-xs transition"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span class="text-xs font-medium text-gray-800">Sign up with Google</span>
        </button>

        <!-- Apple button -->
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center space-x-2 shadow-xs transition"
        >
          <svg class="w-4 h-4 fill-black" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.98-6.19-9.56-10.93-20.08-14.23-31.56-3.3-11.48-4.96-22.13-4.96-31.95 0-14.54 3.73-26.4 11.2-35.58 7.46-9.18 16.79-13.88 27.97-14.1 4.57 0 9.77 1.25 15.6 3.76 5.82 2.51 9.71 3.82 11.68 3.92 1.52-.11 5.61-1.47 12.28-4.08 6.66-2.61 11.96-3.77 15.89-3.48 12.61.98 22.56 5.82 29.83 14.51-11.19 6.83-16.68 16.27-16.46 28.32.22 9.55 3.86 17.51 10.93 23.87 7.07 6.36 15.44 9.94 25.12 10.74-2.28 6.74-5.06 13.54-8.34 20.4zM119.22 31.86c0-7.39 2.66-14.24 7.99-20.55 5.33-6.31 11.85-10.38 19.57-12.21.22 1.41.33 2.66.33 3.75 0 7.39-2.82 14.41-8.47 21.06-5.65 6.65-12.28 10.59-19.89 11.83-.22-1.3-.33-2.59-.33-3.88z"/>
          </svg>
          <span class="text-xs font-medium text-gray-800">Sign up with Apple</span>
        </button>

        <!-- Not a member? Sign up -->
        <p class="text-center text-xs text-gray-600 pt-3">
          Not a member?
          <button
            type="button"
            @click="router.push('/register')"
            class="text-[#00669e] font-semibold hover:underline ml-1"
          >
            Sign up now
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

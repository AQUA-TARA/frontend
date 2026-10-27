<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = useRouter()
const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value) {
    errorMessage.value = 'Email address wajib diisi.'
    return
  }

  loading.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error

    successMessage.value = 'Tautan reset kata sandi telah dikirim ke email Anda.'
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengirim permintaan reset kata sandi.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white via-white to-[#60a5fa]/40 flex flex-col items-center justify-start px-6 pt-12 pb-8 font-sans select-none">
    <div class="w-full max-w-sm">
      <!-- Go back -->
      <button
        type="button"
        @click="goBack"
        class="flex items-center space-x-1.5 text-xs text-gray-800 hover:text-black mb-8 font-medium cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Go back</span>
      </button>

      <!-- Title -->
      <h1 class="text-2xl font-bold text-center text-gray-900 tracking-tight mb-8">Request Password Reset</h1>

      <!-- Alert Messages -->
      <div 
        v-if="errorMessage" 
        class="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-xs font-medium"
      >
        {{ errorMessage }}
      </div>
      <div 
        v-if="successMessage" 
        class="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium"
      >
        {{ successMessage }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
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

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="loading"
            class="px-7 py-2.5 rounded-lg bg-[#00669e] hover:bg-[#005584] active:scale-95 text-white text-xs font-semibold shadow transition disabled:opacity-60 cursor-pointer"
          >
            {{ loading ? 'Mengirim...' : 'Submit' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

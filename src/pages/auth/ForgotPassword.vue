<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = useRouter()
const email = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')

const handleSubmit = async () => {
  if (!email.value) {
    error.value = 'Email address is required.'
    return
  }

  loading.value = true
  message.value = ''
  error.value = ''

  try {
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (resetErr) throw resetErr
    message.value = 'Tautan reset kata sandi telah dikirim ke email Anda.'
  } catch (err) {
    error.value = err.message || 'Gagal mengirim email reset kata sandi.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-900 flex justify-center w-full">
    <!-- Mobile Frame container matching Forgor Password.png -->
    <div class="w-full max-w-md min-h-screen flex flex-col bg-gradient-to-b from-[#f8fafc] via-[#eff6ff] to-[#93c5fd] text-slate-900 font-sans shadow-2xl relative px-7 pt-4 pb-12 overflow-y-auto">

      <!-- Go Back -->
      <button 
        type="button" 
        @click="router.push('/login')" 
        class="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 mb-8 self-start cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Go back</span>
      </button>

      <!-- Page Title -->
      <h1 class="text-2xl font-bold text-center text-slate-900 mb-8 tracking-tight">
        Request Password Reset
      </h1>

      <!-- Reset Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {{ error }}
        </div>
        <div v-if="message" class="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
          {{ message }}
        </div>

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

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="loading"
            class="py-2.5 px-6 rounded-md bg-[#00669e] hover:bg-[#005584] text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-60"
          >
            {{ loading ? 'Mengirim...' : 'Submit' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

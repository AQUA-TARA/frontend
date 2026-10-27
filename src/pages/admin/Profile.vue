<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { authService } from '@/services/authService.js'
import { supabase } from '@/services/supabase.js'

// Loading indicator from authService
const isLoading = computed(() => authService.loading.value)

// Reactive profile fetched from the `users` table using supabase_id
const profile = reactive({
  name: '-',
  email: '-',
  role: '-'
})

// Notification handling
const notification = ref(null)

// Change password modal state and form
const showPasswordModal = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Fetch profile when auth user is available
const fetchProfile = async () => {
  const user = authService.user.value
  if (!user) return
  const supabaseId = user.id
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name,email,role')
      .eq('supabase_id', supabaseId)
      .single()
    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }
    if (!data) {
      console.warn('No profile data returned for supabase_id:', supabaseId)
      profile.name = '-'
profile.email = '-'
profile.role = '-'
    } else {
      profile.name = data.name ?? '-'
profile.email = data.email ?? '-'
profile.role = data.role ?? '-'
    }
  } catch (e) {
    console.error('Failed to fetch profile:', e)
  }
}

// Watch auth user changes and load profile once
watch(
  () => authService.user.value?.id,
  async (newId) => {
    if (newId) await fetchProfile()
  },
  { immediate: true }
)

// Change password flow
const handleChangePassword = () => {
  showPasswordModal.value = true
}

const submitPasswordChange = async () => {
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    alert('Harap isi semua kolom kata sandi!')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('Kata sandi baru dan konfirmasi kata sandi tidak cocok!')
    return
  }
  try {
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.value.newPassword
    })
    if (error) throw error
    showNotification('Kata sandi berhasil diubah!')
  } catch (e) {
    console.error(e)
    showNotification('Gagal mengubah kata sandi.')
  }
  showPasswordModal.value = false
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
}

const showNotification = (msg) => {
  notification.value = msg
  setTimeout(() => {
    notification.value = null
  }, 3500)
}
</script>

<template>
  <div v-if="!isLoading" class="flex-1 flex items-center justify-center p-6 md:p-12 w-full font-sans relative">
    <!-- Success Toast Notification -->
    <div v-if="notification" class="fixed top-8 right-8 z-50 bg-[#004d7a] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-sky-400 text-xs font-semibold animate-bounce">
      <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
      <span>{{ notification }}</span>
    </div>

    <!-- Profile Card -->
    <div class="w-full max-w-2xl bg-[#f0f8ff] rounded-2xl shadow-xl overflow-hidden border border-sky-100/70">
      <!-- Top Sky Blue Banner with Overlapping Avatar -->
      <div class="bg-[#72cbf7] h-28 relative px-10 flex items-end">

        <div class="pb-3">
          <h1 class="text-2xl font-extrabold text-slate-950 tracking-tight">{{ profile.name }}</h1>
          <p class="text-xs text-slate-800 font-medium mt-0.5">{{ profile.role }}</p>
        </div>
      </div>

      <!-- Form Body -->
      <div class="pt-16 pb-10 px-10 space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label class="block text-xs text-slate-700 font-medium mb-1">Nama</label>
            <div class="border-b border-slate-800 pb-1.5 text-sm font-semibold text-slate-950">{{ profile.name }}</div>
          </div>
          <div>
            <label class="block text-xs text-slate-700 font-medium mb-1">Email</label>
            <div class="border-b border-slate-800 pb-1.5 text-sm font-semibold text-slate-950">{{ profile.email }}</div>
          </div>
        </div>

        <div class="pt-4 flex items-center justify-center">
          <button @click="handleChangePassword" class="px-8 py-2.5 rounded-lg bg-[#78350f] text-white text-xs font-bold hover:bg-[#58250a] transition-colors shadow-sm">
            Change Password
          </button>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="showPasswordModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-[#54b8ea] space-y-4 text-slate-900">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-base font-bold text-slate-900">Ubah Kata Sandi</h3>
          <button @click="showPasswordModal = false" class="text-slate-500 hover:text-slate-800">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-medium text-slate-700 mb-1">Kata Sandi Saat Ini</label>
            <input type="password" v-model="passwordForm.currentPassword" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500" placeholder="Masukkan kata sandi lama"/>
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">Kata Sandi Baru</label>
            <input type="password" v-model="passwordForm.newPassword" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500" placeholder="Minimal 8 karakter"/>
          </div>
          <div>
            <label class="block font-medium text-slate-700 mb-1">Konfirmasi Kata Sandi Baru</label>
            <input type="password" v-model="passwordForm.confirmPassword" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500" placeholder="Ulangi kata sandi baru"/>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t">
          <button @click="showPasswordModal = false" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
          <button @click="submitPasswordChange" class="px-5 py-2 bg-[#004d7a] text-white text-xs font-bold rounded-lg hover:bg-[#003859] transition-colors">Simpan Kata Sandi</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex items-center justify-center h-64">
    <span class="text-xl font-semibold">Memuat profil...</span>
  </div>
</template>

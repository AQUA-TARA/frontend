<script setup>
import { ref } from 'vue'

const userProfile = ref({
  username: 'budiSantos',
  email: 'budi.santos@example.com',
  firstName: 'Budi',
  lastName: 'Santoso'
})

const isEditing = ref(false)
const saveSuccess = ref(false)

const handleEditProfile = () => {
  isEditing.value = !isEditing.value
  if (!isEditing.value) {
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 2000)
  }
}

const handleChangePassword = () => {
  alert('Fitur Ubah Kata Sandi (Simulasi UI)')
}
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] bg-gradient-to-b from-white via-white to-[#fed7aa]/30 px-6 py-8 font-sans flex flex-col items-center">
    <!-- Circular User Avatar with Orange/Warm backdrop (Matches Profile.png) -->
    <div class="relative w-28 h-28 rounded-full overflow-hidden shadow-md border-2 border-white mb-4">
      <img
        src="/assets/user_avatar.jpg"
        alt="Budi Santoso"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- User Name & Role -->
    <h1 class="text-xl font-bold text-gray-900 tracking-tight">Budi Santoso</h1>
    <p class="text-xs text-gray-500 mt-1 mb-8">Warga Kota Tarakan</p>

    <!-- Underline Form Fields (Matches Profile.png) -->
    <div class="w-full max-w-sm space-y-6">
      <!-- Username -->
      <div class="relative">
        <label class="block text-[11px] text-gray-700 font-medium mb-1">Username</label>
        <input
          v-model="userProfile.username"
          type="text"
          :readonly="!isEditing"
          class="w-full bg-transparent border-b border-gray-900 py-1 text-sm text-gray-900 focus:outline-none focus:border-[#00669e] transition"
        />
      </div>

      <!-- Email -->
      <div class="relative">
        <label class="block text-[11px] text-gray-700 font-medium mb-1">Email</label>
        <input
          v-model="userProfile.email"
          type="email"
          :readonly="!isEditing"
          class="w-full bg-transparent border-b border-gray-900 py-1 text-sm text-gray-900 focus:outline-none focus:border-[#00669e] transition"
        />
      </div>

      <!-- First Name -->
      <div class="relative">
        <label class="block text-[11px] text-gray-700 font-medium mb-1">First Name</label>
        <input
          v-model="userProfile.firstName"
          type="text"
          :readonly="!isEditing"
          class="w-full bg-transparent border-b border-gray-900 py-1 text-sm text-gray-900 focus:outline-none focus:border-[#00669e] transition"
        />
      </div>

      <!-- Last Name -->
      <div class="relative">
        <label class="block text-[11px] text-gray-700 font-medium mb-1">Last Name</label>
        <input
          v-model="userProfile.lastName"
          type="text"
          :readonly="!isEditing"
          class="w-full bg-transparent border-b border-gray-900 py-1 text-sm text-gray-900 focus:outline-none focus:border-[#00669e] transition"
        />
      </div>
    </div>

    <!-- Notification -->
    <p v-if="saveSuccess" class="text-xs text-emerald-600 font-medium mt-4">
      Profil berhasil disimpan!
    </p>

    <!-- Buttons Row -->
    <div class="w-full max-w-sm space-y-3 mt-10">
      <!-- Edit Profile / Simpan button (Light blue/gray rounded pill) -->
      <button
        type="button"
        @click="handleEditProfile"
        class="w-full py-3 rounded-xl border border-[#bae6fd] bg-[#f0f9ff] hover:bg-[#e0f2fe] active:scale-95 text-gray-900 text-xs font-semibold shadow-xs transition"
      >
        {{ isEditing ? 'Simpan Perubahan' : 'Edit Profile' }}
      </button>

      <!-- Change Password button (Warm brown rounded pill) -->
      <button
        type="button"
        @click="handleChangePassword"
        class="w-full py-3 rounded-xl bg-[#7c2d12] hover:bg-[#6c2810] active:scale-95 text-white text-xs font-semibold shadow transition"
      >
        Change Password
      </button>
    </div>
  </div>
</template>

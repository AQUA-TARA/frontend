<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import { ref, computed, watch } from 'vue'
import { authService } from '@/services/authService'
import { userSidebarOpen, toggleUserSidebar, closeUserSidebar } from '@/stores/sidebarStore.js'

const router = useRouter()

const goToSearch = () => {
  // Redirect to tracking page (search functionality placeholder)
  router.push('/tracking')
}

const showNotifications = ref(false)
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

// Nav items dynamic calculation:
// Public: Dashboard, Maps Area
// Authenticated Citizen: Dashboard, Maps Area, Riwayat, Tracking, Profile
const userNavItems = computed(() => {
  const isAuth = authService.isAuthenticated.value

  const baseItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      name: 'Maps Area', 
      path: '/map', 
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' 
    }
  ]

  if (!isAuth) {
    return baseItems
  }

  return [
    ...baseItems,
    { 
      name: 'Riwayat', 
      path: '/tracking?view=history', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      name: 'Tracking', 
      path: '/tracking', 
      icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' 
    },
    { 
      name: 'Profile', 
      path: '/profile', 
      icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' 
    }
  ]
})

const route = useRoute()
watch(() => route.fullPath, () => {
  closeUserSidebar()
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 flex justify-center w-full">
    <!-- Mobile Frame fills width on mobile, caps at md on desktop -->
    <div class="w-full max-w-md min-h-screen flex flex-col bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#fed7aa]/35 text-slate-900 font-sans shadow-2xl relative overflow-x-hidden">
      
      <!-- Drawer Sidebar -->
      <Sidebar :items="userNavItems" layout="user" />
      
      <!-- Backdrop overlay -->
      <div 
        v-if="userSidebarOpen" 
        @click="closeUserSidebar" 
        class="fixed inset-0 bg-black/40 z-40 transition-opacity"
      ></div>

      <!-- Mobile App Navigation Header -->
      <header class="h-14 px-5 flex items-center justify-between shrink-0">
        <!-- Hamburger Menu -->
        <button 
          @click="toggleUserSidebar" 
          class="p-2 text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors focus:outline-none"
          aria-label="Open menu"
        >
          <svg class="h-5 w-5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Brand Logo & Name matching reference -->
        <div class="flex items-center gap-2">
          <img
            src="@/assets/Logo.png"
            alt="AQUA-TARA Logo"
            class="w-6 h-6 object-contain"
          />
          <span class="text-base font-extrabold tracking-wider text-slate-900">AQUA-TARA</span>
        </div>

        <!-- Right Header Icons: Search & Bell -->
        <div class="flex items-center gap-1">
          <button @click="goToSearch" class="p-1.5 text-slate-800 hover:bg-slate-200/50 rounded-full transition-colors" aria-label="Search">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button @click="goToNotifications" class="p-1.5 text-slate-800 hover:bg-slate-200/50 rounded-full transition-colors" aria-label="Notifications">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Main Body View -->
      <main class="flex-1 flex flex-col overflow-y-auto">
        <RouterView />
      </main>

    </div>
  </div>
</template>

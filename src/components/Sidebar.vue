<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { userSidebarOpen, toggleUserSidebar, closeUserSidebar, adminSidebarOpen, toggleAdminSidebar, closeAdminSidebar } from '@/stores/sidebarStore.js'
import { authService } from '@/services/authService'

// Props
const { items, layout } = defineProps({
  items: { type: Array, required: true },
  layout: { type: String, required: true } // "user" or "admin"
})

const route = useRoute()
const router = useRouter()

const isOpen = computed(() => {
  return layout === 'user' ? userSidebarOpen.value : adminSidebarOpen.value
})

const toggle = () => {
  layout === 'user' ? toggleUserSidebar() : toggleAdminSidebar()
}
const close = () => {
  layout === 'user' ? closeUserSidebar() : closeAdminSidebar()
}

const isAuth = computed(() => authService.isAuthenticated.value)

const isActive = (path) => {
  if (path === '/admin' && layout === 'admin') {
    return route.path === '/admin' || route.path === '/admin/'
  }
  if (path === '/' && layout === 'user') {
    return route.path === '/'
  }
  return route.path.startsWith(path) && path !== '/'
}

const handleLogout = async () => {
  close()
  await authService.logout()
  router.push('/')
}

const goToLogin = () => {
  close()
  router.push('/login')
}
</script>

<template>
  <!-- Sidebar Drawer Navigation matching Sidebar-admin.png -->
  <aside
    :class="[
      'sidebar-drawer bg-white text-gray-900 flex flex-col shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out shadow-xl',
      isOpen ? 'w-[260px]' : 'w-[260px]',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <!-- Brand Header: Logo + AQUA-TARA text -->
    <div class="h-20 flex items-center px-6">
      <div class="flex items-center gap-3">
        <!-- Water Drop SVG Logo matching reference -->
        <img
          src="@/assets/Logo.png"
          alt="AQUA-TARA Logo"
          class="w-6 h-6 object-contain"
        />
        <span class="text-xl font-bold tracking-wider text-slate-900 font-sans">AQUA-TARA</span>
      </div>

      <!-- Close button on mobile -->
      <button
        v-if="isOpen"
        @click="close"
        class="ml-auto md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none"
        aria-label="Close sidebar"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Coral/rose divider matching reference -->
    <div class="h-[1px] bg-[#f3a9a9]/60 mx-4"></div>

    <!-- Navigation List -->
    <nav class="flex-1 py-5 px-4 flex flex-col gap-1.5 overflow-y-auto">
      <RouterLink
        v-for="item in items"
        :key="item.name"
        :to="item.path"
        @click="layout === 'user' && close()"
        class="flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
        :class="isActive(item.path)
          ? 'bg-[#0e7490] text-white font-semibold shadow-md' 
          : 'text-slate-700 hover:bg-slate-50'"
      >
        <!-- Icon SVG -->
        <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
        </svg>
        <span class="truncate">{{ item.name }}</span>
      </RouterLink>
    </nav>

    <!-- Footer: Coral divider and Login/Logout -->
    <div class="mt-auto">
      <div class="h-[1px] bg-[#f3a9a9]/60 mx-4"></div>
      <div class="p-4">
        <!-- If Authenticated: Show Logout -->
        <button
          v-if="isAuth"
          type="button"
          @click="handleLogout"
          class="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>

        <!-- If Unauthenticated: Show Login -->
        <button
          v-else
          type="button"
          @click="goToLogin"
          class="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium text-[#00669e] bg-blue-50/70 hover:bg-blue-100/70 transition-colors cursor-pointer"
        >
          <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span class="font-semibold">Login</span>
        </button>
      </div>
    </div>
  </aside>
</template>

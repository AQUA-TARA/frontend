<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import AdminSearchBar from '@/components/AdminSearchBar.vue'
import { adminSidebarOpen, toggleAdminSidebar, closeAdminSidebar } from '@/stores/sidebarStore.js'

const route = useRoute()
const router = useRouter()

// Exact admin navigation items matching Sidebar-admin.png:
const navItems = [
  { 
    name: 'Dashboard', 
    path: '/admin', 
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' 
  },
  {
    name: 'IoT Nodes',
    path: '/admin/nodes',
    icon: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z'
  },
  { 
    name: 'Daftar Tiket', 
    path: '/admin/report', 
    icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' 
  },
  { 
    name: 'Live Map Monitoring', 
    path: '/admin/map', 
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' 
  },
  { 
    name: 'Profile', 
    path: '/admin/profile', 
    icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' 
  }
]

const goToProfile = () => {
  router.push('/admin/profile')
}
</script>

<template>
  <div class="flex min-h-screen bg-[#f3f4f8] text-gray-800 font-sans antialiased relative">
    
    <!-- Sidebar backdrop overlay when opened -->
    <div 
      v-if="adminSidebarOpen" 
      @click="closeAdminSidebar" 
      class="fixed inset-0 bg-black/40 z-40 transition-opacity"
    ></div>

    <!-- Reusable Sidebar (z-50) -->
    <Sidebar :items="navItems" layout="admin" />

    <!-- Main Content Area (z-0 relative) -->
    <div class="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden relative z-0">
      
      <!-- Top Header: STICKY, matching Dashboard.png reference -->
      <header class="fixed top-0 left-0 right-0 w-full z-50 bg-[#f3f4f8] h-16 flex items-center justify-between px-6 md:px-8 shrink-0 shadow-md">
        <div class="flex items-center gap-4 flex-1">
          <!-- Hamburger menu icon -->
          <button 
            @click="toggleAdminSidebar" 
            class="p-1.5 text-slate-900 hover:bg-black/5 rounded-lg transition-colors focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <svg class="h-6 w-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Search Bar: Full width border pill box -->
          <AdminSearchBar />
        </div>
        
        <!-- Right Actions: vertical separator, Notifications & Avatar outline matching reference -->
        <div class="flex items-center gap-1 ml-4">
          <!-- Vertical separator matching reference -->
          <div class="w-px h-7 bg-slate-300 mr-3"></div>

          <button class="p-2 text-slate-700 hover:bg-black/5 rounded-full transition-colors" aria-label="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          <button 
            @click="goToProfile"
            class="p-1 rounded-full text-slate-700 hover:bg-black/5 transition-colors" 
            aria-label="Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 flex flex-col overflow-y-auto pt-16 pb-10">
        <RouterView />
      </main>
      
    </div>
  </div>
</template>

import { ref } from 'vue'

// Independent sidebar state per layout
export const userSidebarOpen = ref(false)
export const toggleUserSidebar = () => { userSidebarOpen.value = !userSidebarOpen.value }
export const closeUserSidebar = () => { userSidebarOpen.value = false }

export const adminSidebarOpen = ref(false)
export const toggleAdminSidebar = () => { adminSidebarOpen.value = !adminSidebarOpen.value }
export const closeAdminSidebar = () => { adminSidebarOpen.value = false }

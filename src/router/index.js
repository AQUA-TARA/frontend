import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '../services/authService'

const routes = [
  // --------------------------------------------------------
  // Public & Citizen Portal (Landing at '/' without session)
  // --------------------------------------------------------
  {
    path: '/',
    component: () => import('../layouts/UserLayout.vue'),
    children: [
      {
        path: '',
        name: 'portal-laporan',
        component: () => import('../pages/user/PortalLaporan.vue')
      },
      {
        path: 'camera',
        name: 'user-camera',
        component: () => import('../pages/user/CameraView.vue')
      },
      {
        path: 'success',
        name: 'user-success',
        component: () => import('../pages/user/SuccessTicket.vue')
      },
      {
        path: 'map',
        name: 'public-map',
        component: () => import('../pages/user/LiveMap.vue')
      },
      {
        path: 'tracking',
        name: 'citizen-tracking',
        component: () => import('../pages/user/Tracking.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'citizen-profile',
        component: () => import('../pages/user/Profile.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },

  // Backward compatibility alias: /user and /dev-user redirects to /
  {
    path: '/user',
    redirect: '/'
  },
  {
    path: '/dev-user',
    redirect: '/'
  },

  // --------------------------------------------------------
  // Authentication Routes (Unified Login & Citizen Register)
  // --------------------------------------------------------
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/user/Login.vue'),
    meta: { publicOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../pages/user/Register.vue'),
    meta: { publicOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../pages/user/ForgotPassword.vue')
  },

  // --------------------------------------------------------
  // Admin Layout shell - Protected with required Role: Admin
  // --------------------------------------------------------
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('../pages/admin/Dashboard.vue')
      },
      {
        path: 'report',
        name: 'admin-report-ticket',
        component: () => import('../pages/admin/ReportTicket.vue')
      },
      {
        path: 'map',
        name: 'admin-map',
        component: () => import('../pages/admin/LiveMap.vue')
      },
      {
        path: 'nodes',
        name: 'admin-nodes',
        component: () => import('../pages/admin/IoTNodes.vue')
      },
      {
        path: 'profile',
        name: 'admin-profile',
        component: () => import('../pages/admin/Profile.vue')
      }
    ]
  },
  // Backward compatibility alias for legacy dev-admin link
  {
    path: '/dev-admin',
    redirect: '/admin'
  },
  {
    path: '/dev-admin/:pathMatch(.*)*',
    redirect: to => `/admin/${to.params.pathMatch}`
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation Guard for Protected Routes
router.beforeEach(async (to, from, next) => {
  // Pastikan inisialisasi sesi Supabase selesai sebelum mengevaluasi rute
  if (authService.loading.value) {
    await authService.initialize()
  }

  const isAuth = authService.isAuthenticated.value
  const isAdmin = authService.isAdmin.value

  // If route is public only (e.g. /login, /register) and user already logged in
  if (to.meta.publicOnly && isAuth) {
    if (isAdmin) {
      return next('/admin')
    } else {
      return next('/')
    }
  }

  // Check admin authorization first
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!isAuth) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }

    if (!isAdmin) {
      console.warn('Access denied: Citizen cannot access Admin layout.')
      return next('/')
    }
  }

  // Check general authenticated route
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuth) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  }

  next()
})

export default router

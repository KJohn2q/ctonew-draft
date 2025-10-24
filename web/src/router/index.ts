import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import { requireAuth, redirectIfAuthenticated } from './guards'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      beforeEnter: redirectIfAuthenticated
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
      beforeEnter: redirectIfAuthenticated
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/kanban',
      name: 'kanban',
      component: () => import('../views/KanbanView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('../views/CalendarView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/task/:id',
      name: 'task-detail',
      component: () => import('../views/TaskDetailView.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 初始化认证状态
  if (authStore.accessToken && !authStore.user) {
    await authStore.initialize()
  }

  // 检查访客模式
  const isGuestMode = localStorage.getItem('guestMode') === 'true'

  // 检查路由是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated && !isGuestMode) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

export default router

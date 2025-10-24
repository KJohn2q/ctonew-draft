import { useAuthStore } from '@/stores/auth'
import type { RouteLocationNormalized } from 'vue-router'

export const requireAuth = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: any
) => {
  const authStore = useAuthStore()

  // 初始化认证状态
  if (authStore.accessToken && !authStore.user) {
    await authStore.initialize()
  }

  if (!authStore.isAuthenticated) {
    // 重定向到登录页面
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
}

export const redirectIfAuthenticated = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: any
) => {
  const authStore = useAuthStore()
  const isGuestMode = localStorage.getItem('guestMode') === 'true'

  if (authStore.isAuthenticated || isGuestMode) {
    next('/dashboard')
  } else {
    next()
  }
}
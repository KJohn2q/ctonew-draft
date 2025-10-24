import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthResponse, LoginRequest, SignupRequest } from '@/types/auth'
import apiClient from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  // 方法
  const initialize = async () => {
    if (accessToken.value && !user.value) {
      try {
        // 如果有token但没有用户信息，尝试获取当前用户信息
        // TODO: 添加获取当前用户信息的API调用
      } catch (err) {
        clearAuth()
      }
    }
  }

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.login(credentials.email, credentials.password)

      // 设置状态
      user.value = response.user
      accessToken.value = response.accessToken
      refreshToken.value = response.refreshToken

      // 保存到localStorage
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)

      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || '登录失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const signup = async (data: SignupRequest): Promise<AuthResponse> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.signup(data.email, data.password, data.name)

      // 设置状态
      user.value = response.user
      accessToken.value = response.accessToken
      refreshToken.value = response.refreshToken

      // 保存到localStorage
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)

      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || '注册失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearAuth()
    }
  }

  const clearAuth = () => {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    error.value = null

    // 清除localStorage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  const updateTokens = (newAccessToken: string, newRefreshToken: string) => {
    accessToken.value = newAccessToken
    refreshToken.value = newRefreshToken

    localStorage.setItem('accessToken', newAccessToken)
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  return {
    // 状态
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,

    // 计算属性
    isAuthenticated,

    // 方法
    initialize,
    login,
    signup,
    logout,
    clearAuth,
    updateTokens
  }
})
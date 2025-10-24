<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const isValid = computed(() => {
  return form.value.name &&
         form.value.email &&
         form.value.password &&
         form.value.password === form.value.confirmPassword &&
         form.value.password.length >= 8
})

const passwordStrength = computed(() => {
  const password = form.value.password
  if (!password) return 0

  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z\d]/.test(password)) score += 1

  return score
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return '弱'
  if (strength <= 4) return '中等'
  return '强'
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'bg-red-500'
  if (strength <= 4) return 'bg-yellow-500'
  return 'bg-green-500'
})

const handleSignup = async () => {
  if (!isValid.value || isLoading.value) return

  isLoading.value = true

  try {
    await authStore.signup({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password
    })

    router.push('/dashboard')
  } catch (error) {
    console.error('Signup error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-lg">TF</span>
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        注册 TaskFlow 账号
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        已有账号？
        <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-500">
          立即登录
        </router-link>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- 错误提示 -->
        <div v-if="authStore.error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                注册失败
              </h3>
              <div class="mt-2 text-sm text-red-700">
                {{ authStore.error }}
              </div>
            </div>
          </div>
        </div>

        <form class="space-y-6" @submit.prevent="handleSignup">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              姓名
            </label>
            <div class="mt-1">
              <input
                id="name"
                v-model="form.name"
                name="name"
                type="text"
                autocomplete="name"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="输入您的姓名"
              />
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              邮箱地址
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="输入您的邮箱地址"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              密码
            </label>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="new-password"
                required
                class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="创建您的密码"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 px-3 flex items-center"
                @click="showPassword = !showPassword"
              >
                <svg
                  v-if="showPassword"
                  class="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                <svg
                  v-else
                  class="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </button>
            </div>

            <!-- 密码强度指示器 -->
            <div v-if="form.password" class="mt-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500">密码强度</span>
                <span :class="passwordStrengthColor.replace('bg-', 'text-')">
                  {{ passwordStrengthText }}
                </span>
              </div>
              <div class="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  :class="passwordStrengthColor"
                  :style="`width: ${(passwordStrength / 5) * 100}%`"
                ></div>
              </div>
            </div>
          </div>

          <div>
            <label for="confirm-password" class="block text-sm font-medium text-gray-700">
              确认密码
            </label>
            <div class="mt-1 relative">
              <input
                id="confirm-password"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                name="confirm-password"
                autocomplete="new-password"
                required
                class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="再次输入您的密码"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 px-3 flex items-center"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <svg
                  v-if="showConfirmPassword"
                  class="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                <svg
                  v-else
                  class="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </button>
            </div>
            <div v-if="form.confirmPassword && form.password !== form.confirmPassword" class="mt-1 text-xs text-red-600">
              密码不匹配
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="!isValid || isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div v-if="isLoading" class="mr-3">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              {{ isLoading ? '注册中...' : '注册账号' }}
            </button>
          </div>

          <div class="text-xs text-gray-500">
            注册即表示您同意我们的
            <a href="#" class="text-blue-600 hover:text-blue-500">服务条款</a>
            和
            <a href="#" class="text-blue-600 hover:text-blue-500">隐私政策</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
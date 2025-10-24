<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { BellIcon, CalendarIcon, CheckIcon, ViewColumnsIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, Bars3Icon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon as LogoutIcon } from '@heroicons/vue/24/outline'

const isGuestMode = computed(() => {
  return typeof window !== 'undefined' && localStorage.getItem('guestMode') === 'true'
})

const exitGuestMode = () => {
  localStorage.removeItem('guestMode')
  window.location.href = '/login'
}

// 通知下拉菜单
const showNotifications = ref(false)
const notifications = ref([
  { id: 1, title: '任务 "完成项目提案" 即将到期', time: '5分钟前', read: false, type: 'warning' },
  { id: 2, title: '新任务分配给你', time: '1小时前', read: false, type: 'info' },
  { id: 3, title: '代码审查已完成', time: '2小时前', read: true, type: 'success' }
])

const unreadNotifications = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// 用户菜单
const showUserMenu = ref(false)

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.notification-dropdown') && !target.closest('.user-dropdown')) {
    showNotifications.value = false
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const markNotificationAsRead = (id: number) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllNotificationsAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

// 用户菜单功能
const userProfile = ref({
  name: '用户',
  email: 'user@example.com',
  avatar: 'U'
})

const logout = () => {
  // 清除用户信息并跳转到登录页
  localStorage.removeItem('userToken')
  localStorage.removeItem('userInfo')
  window.location.href = '/login'
}

const goToSettings = () => {
  // 跳转到设置页面
  console.log('跳转到设置页面')
  showUserMenu.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Header -->
    <nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-2xl font-bold gradient-text">TaskFlow</h1>
            </div>

            <!-- Navigation Links -->
            <div class="hidden md:ml-8 md:flex md:space-x-1">
              <RouterLink
                to="/dashboard"
                class="nav-link"
                active-class="nav-link-active"
                inactive-class="nav-link-inactive"
              >
                <CheckIcon class="w-4 h-4 mr-2" />
                任务
              </RouterLink>
              <RouterLink
                to="/kanban"
                class="nav-link"
                active-class="nav-link-active"
                inactive-class="nav-link-inactive"
              >
                <ViewColumnsIcon class="w-4 h-4 mr-2" />
                看板
              </RouterLink>
              <RouterLink
                to="/calendar"
                class="nav-link"
                active-class="nav-link-active"
                inactive-class="nav-link-inactive"
              >
                <CalendarIcon class="w-4 h-4 mr-2" />
                日历
              </RouterLink>
            </div>
          </div>

          <!-- Right side -->
          <div class="flex items-center space-x-4">
            <!-- 访客模式标识 -->
            <div v-if="isGuestMode" class="flex items-center space-x-3">
              <span class="badge badge-warning">
                访客模式
              </span>
              <button
                @click="exitGuestMode"
                class="btn btn-ghost btn-sm"
                title="退出访客模式"
              >
                <ArrowRightOnRectangleIcon class="w-4 h-4 mr-2" />
                退出
              </button>
            </div>

            <!-- 正常用户显示 -->
            <div v-else class="flex items-center space-x-3">
              <!-- 通知按钮 -->
              <div class="relative notification-dropdown">
                <button
                  @click="showNotifications = !showNotifications; showUserMenu = false"
                  class="btn btn-ghost btn-sm relative"
                >
                  <BellIcon class="w-5 h-5" />
                  <span
                    v-if="unreadNotifications > 0"
                    class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {{ unreadNotifications > 99 ? '99+' : unreadNotifications }}
                  </span>
                </button>

                <!-- 通知下拉菜单 -->
                <div
                  v-show="showNotifications"
                  class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 notification-dropdown"
                >
                  <div class="p-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                      <h3 class="text-sm font-semibold text-gray-900">通知</h3>
                      <button
                        v-if="unreadNotifications > 0"
                        @click="markAllNotificationsAsRead"
                        class="text-xs text-blue-600 hover:text-blue-800"
                      >
                        全部已读
                      </button>
                    </div>
                  </div>

                  <div class="max-h-96 overflow-y-auto">
                    <div
                      v-for="notification in notifications"
                      :key="notification.id"
                      class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      @click="markNotificationAsRead(notification.id)"
                    >
                      <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                          <div
                            class="w-2 h-2 rounded-full mt-2"
                            :class="{
                              'bg-red-500': notification.type === 'warning',
                              'bg-blue-500': notification.type === 'info',
                              'bg-green-500': notification.type === 'success'
                            }"
                          ></div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm text-gray-900" :class="{ 'font-semibold': !notification.read }">
                            {{ notification.title }}
                          </p>
                          <p class="text-xs text-gray-500 mt-1">
                            {{ notification.time }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="notifications.length === 0" class="p-4 text-center text-gray-500 text-sm">
                    暂无通知
                  </div>
                </div>
              </div>

              <!-- 用户菜单 -->
              <div class="relative user-dropdown">
                <button
                  @click="showUserMenu = !showUserMenu; showNotifications = false"
                  class="flex items-center space-x-2 btn btn-ghost btn-sm"
                >
                  <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span class="text-white text-sm font-medium">{{ userProfile.avatar }}</span>
                  </div>
                  <ChevronDownIcon class="w-4 h-4 text-gray-500" />
                </button>

                <!-- 用户下拉菜单 -->
                <div
                  v-show="showUserMenu"
                  class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 user-dropdown"
                >
                  <div class="px-4 py-3 border-b border-gray-200">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span class="text-white font-medium">{{ userProfile.avatar }}</span>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ userProfile.name }}</p>
                        <p class="text-xs text-gray-500">{{ userProfile.email }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="py-1">
                    <button
                      @click="goToSettings"
                      class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Cog6ToothIcon class="w-4 h-4 mr-3" />
                      设置
                    </button>
                    <button
                      @click="logout"
                      class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogoutIcon class="w-4 h-4 mr-3" />
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 移动端菜单按钮 -->
            <button class="md:hidden btn btn-ghost btn-sm">
              <Bars3Icon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- 移动端导航菜单 -->
      <div v-show="false" class="md:hidden border-t border-gray-200 bg-white">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <RouterLink
            to="/dashboard"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            active-class="bg-blue-50 text-blue-700"
          >
            <CheckIcon class="w-4 h-4 inline mr-2" />
            任务
          </RouterLink>
          <RouterLink
            to="/kanban"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            active-class="bg-blue-50 text-blue-700"
          >
            <ViewColumnsIcon class="w-4 h-4 inline mr-2" />
            看板
          </RouterLink>
          <RouterLink
            to="/calendar"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            active-class="bg-blue-50 text-blue-700"
          >
            <CalendarIcon class="w-4 h-4 inline mr-2" />
            日历
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <RouterView />
    </main>
  </div>
</template>

import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_KEYS = {
  programmes: 'cache_programmes',
  teachers: 'cache_teachers',
  lessons: 'cache_lessons',
  messages: 'cache_messages',
  attendance: 'cache_attendance'
}

export const offlineStorage = {
  async setProgrammes(data: any) {
    await AsyncStorage.setItem(CACHE_KEYS.programmes, JSON.stringify(data))
  },

  async getProgrammes() {
    const data = await AsyncStorage.getItem(CACHE_KEYS.programmes)
    return data ? JSON.parse(data) : []
  },

  async setTeachers(data: any) {
    await AsyncStorage.setItem(CACHE_KEYS.teachers, JSON.stringify(data))
  },

  async getTeachers() {
    const data = await AsyncStorage.getItem(CACHE_KEYS.teachers)
    return data ? JSON.parse(data) : []
  },

  async setLessons(data: any) {
    await AsyncStorage.setItem(CACHE_KEYS.lessons, JSON.stringify(data))
  },

  async getLessons() {
    const data = await AsyncStorage.getItem(CACHE_KEYS.lessons)
    return data ? JSON.parse(data) : []
  },

  async setMessages(data: any) {
    await AsyncStorage.setItem(CACHE_KEYS.messages, JSON.stringify(data))
  },

  async getMessages() {
    const data = await AsyncStorage.getItem(CACHE_KEYS.messages)
    return data ? JSON.parse(data) : []
  },

  async setAttendance(data: any) {
    await AsyncStorage.setItem(CACHE_KEYS.attendance, JSON.stringify(data))
  },

  async getAttendance() {
    const data = await AsyncStorage.getItem(CACHE_KEYS.attendance)
    return data ? JSON.parse(data) : []
  },

  async clearAll() {
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS))
  }
}

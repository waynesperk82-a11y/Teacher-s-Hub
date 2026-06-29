// database.ts
import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'

// ==================== TYPES ====================

export interface User {
  id: number
  name: string
  username: string
  password: string
  role: 'admin' | 'teacher'
  teacherId: number | null
  permissions: string[]
  createdAt?: string
  updatedAt?: string
}

export interface Teacher {
  id: number
  name: string
  subject: string
  email: string
  username: string
  createdAt?: string
  updatedAt?: string
}

export interface Programme {
  id: number
  title: string
  description: string
  status: 'upcoming' | 'ongoing' | 'completed'
  startDate: string
  endDate: string
  teachers: number[]
  createdAt?: string
  updatedAt?: string
}

export interface Lesson {
  id: number
  teacherId: number
  programmeId: number
  subject: string
  day: string
  time: string
  duration: string
  topic: string
  createdAt?: string
  updatedAt?: string
}

export interface Message {
  id: number
  senderId: number
  senderName: string
  content: string
  role: string
  createdAt: string
}

export interface Attendance {
  id: number
  lessonId: number
  userId: number
  status: 'present' | 'absent' | 'late'
  timestamp: string
}

export interface Analytics {
  totalLogins: number
  totalTeachers: number
  totalProgrammes: number
  totalLessons: number
  totalMessages: number
  totalAttendance: number
  lastUpdated: string
}

export interface DBStore {
  users: User[]
  teachers: Teacher[]
  programmes: Programme[]
  lessons: Lesson[]
  messages: Message[]
  attendance: Attendance[]
  analytics: Analytics
}

// ==================== CONSTANTS ====================

const DB_PATH = path.join(process.cwd(), 'data.json')
const BACKUP_PATH = path.join(process.cwd(), 'data.backup.json')

const defaultStore: DBStore = {
  users: [
    {
      id: 1,
      name: 'System Administrator',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      teacherId: null,
      permissions: ['all'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  teachers: [],
  programmes: [],
  lessons: [],
  messages: [],
  attendance: [],
  analytics: {
    totalLogins: 0,
    totalTeachers: 0,
    totalProgrammes: 0,
    totalLessons: 0,
    totalMessages: 0,
    totalAttendance: 0,
    lastUpdated: new Date().toISOString()
  }
}

// ==================== CORE FUNCTIONS ====================

export function loadDB(): DBStore {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8')
      const parsed = JSON.parse(data)
      
      // Ensure all fields exist
      return {
        ...defaultStore,
        ...parsed,
        analytics: {
          ...defaultStore.analytics,
          ...(parsed.analytics || {})
        }
      }
    }
  } catch (error) {
    console.error('Error loading database:', error)
    // Try to load from backup
    try {
      if (fs.existsSync(BACKUP_PATH)) {
        console.log('Attempting to load from backup...')
        const backupData = fs.readFileSync(BACKUP_PATH, 'utf-8')
        return JSON.parse(backupData)
      }
    } catch (backupError) {
      console.error('Error loading backup:', backupError)
    }
  }
  
  // Return default store if no data exists
  return defaultStore
}

export function saveDB(store: DBStore): void {
  try {
    // Create backup before saving
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, BACKUP_PATH)
    }
    
    // Update timestamp
    store.analytics.lastUpdated = new Date().toISOString()
    
    // Write to file
    fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2))
  } catch (error) {
    console.error('Error saving database:', error)
    throw new Error('Failed to save database')
  }
}

export function getStore(): DBStore {
  return loadDB()
}

export function updateStore(updates: Partial<DBStore>): DBStore {
  const store = loadDB()
  const updated = { 
    ...store, 
    ...updates,
    analytics: {
      ...store.analytics,
      ...(updates.analytics || {}),
      lastUpdated: new Date().toISOString()
    }
  }
  saveDB(updated)
  return updated
}

// ==================== ASYNC FUNCTIONS ====================

export async function loadDBAsync(): Promise<DBStore> {
  try {
    const data = await fsPromises.readFile(DB_PATH, 'utf-8')
    const parsed = JSON.parse(data)
    return {
      ...defaultStore,
      ...parsed,
      analytics: {
        ...defaultStore.analytics,
        ...(parsed.analytics || {})
      }
    }
  } catch (error) {
    console.error('Error loading database async:', error)
    return defaultStore
  }
}

export async function saveDBAsync(store: DBStore): Promise<void> {
  try {
    store.analytics.lastUpdated = new Date().toISOString()
    await fsPromises.writeFile(DB_PATH, JSON.stringify(store, null, 2))
  } catch (error) {
    console.error('Error saving database async:', error)
    throw new Error('Failed to save database')
  }
}

// ==================== UTILITY FUNCTIONS ====================

export function generateId(collection: any[]): number {
  return collection.length ? Math.max(...collection.map(item => item.id)) + 1 : 1
}

export function getTimestamp(): string {
  return new Date().toISOString()
}

export function addTimestamps<T extends { createdAt?: string; updatedAt?: string }>(
  item: T
): T & { createdAt: string; updatedAt: string } {
  const now = getTimestamp()
  return {
    ...item,
    createdAt: now,
    updatedAt: now
  }
}

export function updateTimestamps<T extends { updatedAt?: string }>(
  item: T
): T & { updatedAt: string } {
  return {
    ...item,
    updatedAt: getTimestamp()
  }
}

// ==================== COLLECTION HELPERS ====================

export function findById<T extends { id: number }>(
  collection: T[],
  id: number
): T | undefined {
  return collection.find(item => item.id === id)
}

export function findIndexById<T extends { id: number }>(
  collection: T[],
  id: number
): number {
  return collection.findIndex(item => item.id === id)
}

export function removeById<T extends { id: number }>(
  collection: T[],
  id: number
): { removed: T | undefined; newCollection: T[] } {
  const index = findIndexById(collection, id)
  if (index === -1) {
    return { removed: undefined, newCollection: collection }
  }
  const removed = collection[index]
  const newCollection = [...collection.slice(0, index), ...collection.slice(index + 1)]
  return { removed, newCollection }
}

export function updateById<T extends { id: number }>(
  collection: T[],
  id: number,
  updates: Partial<T>
): { updated: T | undefined; newCollection: T[] } {
  const index = findIndexById(collection, id)
  if (index === -1) {
    return { updated: undefined, newCollection: collection }
  }
  
  const updated = {
    ...collection[index],
    ...updates,
    updatedAt: getTimestamp()
  }
  
  const newCollection = [
    ...collection.slice(0, index),
    updated,
    ...collection.slice(index + 1)
  ]
  
  return { updated, newCollection }
}

// ==================== DATABASE OPERATIONS ====================

export const db = {
  // User operations
  users: {
    getAll: () => getStore().users,
    findById: (id: number) => findById(getStore().users, id),
    findByUsername: (username: string) => 
      getStore().users.find(u => u.username === username),
    findByTeacherId: (teacherId: number) =>
      getStore().users.find(u => u.teacherId === teacherId),
    create: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
      const store = getStore()
      const newUser = addTimestamps({
        ...user,
        id: generateId(store.users)
      } as User)
      store.users.push(newUser)
      saveDB(store)
      return newUser
    },
    update: (id: number, updates: Partial<User>) => {
      const store = getStore()
      const { updated, newCollection } = updateById(store.users, id, updates)
      if (updated) {
        store.users = newCollection
        saveDB(store)
      }
      return updated
    },
    delete: (id: number) => {
      const store = getStore()
      const { removed, newCollection } = removeById(store.users, id)
      if (removed) {
        store.users = newCollection
        saveDB(store)
      }
      return removed
    }
  },

  // Teacher operations
  teachers: {
    getAll: () => getStore().teachers,
    findById: (id: number) => findById(getStore().teachers, id),
    create: (teacher: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>) => {
      const store = getStore()
      const newTeacher = addTimestamps({
        ...teacher,
        id: generateId(store.teachers)
      } as Teacher)
      store.teachers.push(newTeacher)
      store.analytics.totalTeachers++
      saveDB(store)
      return newTeacher
    },
    update: (id: number, updates: Partial<Teacher>) => {
      const store = getStore()
      const { updated, newCollection } = updateById(store.teachers, id, updates)
      if (updated) {
        store.teachers = newCollection
        saveDB(store)
      }
      return updated
    },
    delete: (id: number) => {
      const store = getStore()
      const { removed, newCollection } = removeById(store.teachers, id)
      if (removed) {
        store.teachers = newCollection
        store.analytics.totalTeachers--
        saveDB(store)
      }
      return removed
    }
  },

  // Programme operations
  programmes: {
    getAll: () => getStore().programmes,
    findById: (id: number) => findById(getStore().programmes, id),
    create: (programme: Omit<Programme, 'id' | 'createdAt' | 'updatedAt'>) => {
      const store = getStore()
      const newProgramme = addTimestamps({
        ...programme,
        id: generateId(store.programmes)
      } as Programme)
      store.programmes.push(newProgramme)
      store.analytics.totalProgrammes++
      saveDB(store)
      return newProgramme
    },
    update: (id: number, updates: Partial<Programme>) => {
      const store = getStore()
      const { updated, newCollection } = updateById(store.programmes, id, updates)
      if (updated) {
        store.programmes = newCollection
        saveDB(store)
      }
      return updated
    },
    delete: (id: number) => {
      const store = getStore()
      const { removed, newCollection } = removeById(store.programmes, id)
      if (removed) {
        store.programmes = newCollection
        store.analytics.totalProgrammes--
        saveDB(store)
      }
      return removed
    }
  },

  // Lesson operations
  lessons: {
    getAll: () => getStore().lessons,
    findById: (id: number) => findById(getStore().lessons, id),
    findByTeacher: (teacherId: number) =>
      getStore().lessons.filter(l => l.teacherId === teacherId),
    findByProgramme: (programmeId: number) =>
      getStore().lessons.filter(l => l.programmeId === programmeId),
    findByDay: (day: string) =>
      getStore().lessons.filter(l => l.day === day),
    create: (lesson: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>) => {
      const store = getStore()
      const newLesson = addTimestamps({
        ...lesson,
        id: generateId(store.lessons)
      } as Lesson)
      store.lessons.push(newLesson)
      store.analytics.totalLessons++
      saveDB(store)
      return newLesson
    },
    update: (id: number, updates: Partial<Lesson>) => {
      const store = getStore()
      const { updated, newCollection } = updateById(store.lessons, id, updates)
      if (updated) {
        store.lessons = newCollection
        saveDB(store)
      }
      return updated
    },
    delete: (id: number) => {
      const store = getStore()
      const { removed, newCollection } = removeById(store.lessons, id)
      if (removed) {
        store.lessons = newCollection
        store.analytics.totalLessons--
        saveDB(store)
      }
      return removed
    },
    clear: () => {
      const store = getStore()
      store.lessons = []
      store.analytics.totalLessons = 0
      saveDB(store)
      return store.lessons
    }
  },

  // Message operations
  messages: {
    getAll: () => getStore().messages || [],
    findById: (id: number) => findById(getStore().messages || [], id),
    create: (message: Omit<Message, 'id'>) => {
      const store = getStore()
      if (!store.messages) store.messages = []
      const newMessage = {
        ...message,
        id: generateId(store.messages)
      }
      store.messages.push(newMessage)
      store.analytics.totalMessages = (store.analytics.totalMessages || 0) + 1
      saveDB(store)
      return newMessage
    },
    delete: (id: number) => {
      const store = getStore()
      const { removed, newCollection } = removeById(store.messages || [], id)
      if (removed) {
        store.messages = newCollection
        store.analytics.totalMessages = (store.analytics.totalMessages || 1) - 1
        saveDB(store)
      }
      return removed
    }
  },

  // Attendance operations
  attendance: {
    getAll: () => getStore().attendance || [],
    findById: (id: number) => findById(getStore().attendance || [], id),
    findByLesson: (lessonId: number) =>
      (getStore().attendance || []).filter(a => a.lessonId === lessonId),
    findByUser: (userId: number) =>
      (getStore().attendance || []).filter(a => a.userId === userId),
    create: (attendance: Omit<Attendance, 'id'>) => {
      const store = getStore()
      if (!store.attendance) store.attendance = []
      const newAttendance = {
        ...attendance,
        id: generateId(store.attendance),
        timestamp: new Date().toISOString()
      }
      store.attendance.push(newAttendance)
      store.analytics.totalAttendance = (store.analytics.totalAttendance || 0) + 1
      saveDB(store)
      return newAttendance
    },
    update: (id: number, updates: Partial<Attendance>) => {
      const store = getStore()
      const { updated, newCollection } = updateById(store.attendance || [], id, updates)
      if (updated) {
        store.attendance = newCollection
        saveDB(store)
      }
      return updated
    },
    delete: (id: number) => {
      const store = getStore()
      const { removed, newCollection } = removeById(store.attendance || [], id)
      if (removed) {
        store.attendance = newCollection
        store.analytics.totalAttendance = (store.analytics.totalAttendance || 1) - 1
        saveDB(store)
      }
      return removed
    }
  },

  // Analytics operations
  analytics: {
    get: () => getStore().analytics,
    incrementLogins: () => {
      const store = getStore()
      store.analytics.totalLogins = (store.analytics.totalLogins || 0) + 1
      saveDB(store)
      return store.analytics
    },
    reset: () => {
      const store = getStore()
      store.analytics = {
        ...defaultStore.analytics,
        lastUpdated: new Date().toISOString()
      }
      saveDB(store)
      return store.analytics
    }
  },

  // General operations
  clear: () => {
    const store = {
      ...defaultStore,
      analytics: {
        ...defaultStore.analytics,
        lastUpdated: new Date().toISOString()
      }
    }
    saveDB(store)
    return store
  },

  backup: () => {
    const store = getStore()
    const backupPath = path.join(process.cwd(), `backup_${Date.now()}.json`)
    fs.writeFileSync(backupPath, JSON.stringify(store, null, 2))
    return backupPath
  },

  restore: (backupPath: string) => {
    try {
      const data = fs.readFileSync(backupPath, 'utf-8')
      const store = JSON.parse(data)
      saveDB(store)
      return store
    } catch (error) {
      console.error('Error restoring backup:', error)
      throw new Error('Failed to restore backup')
    }
  }
}

// ==================== EXPORTS ====================

export default {
  loadDB,
  saveDB,
  getStore,
  updateStore,
  loadDBAsync,
  saveDBAsync,
  db,
  generateId,
  getTimestamp,
  addTimestamps,
  updateTimestamps,
  findById,
  findIndexById,
  removeById,
  updateById
      }

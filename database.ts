import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data.json')

interface DBStore {
  users: any[]
  teachers: any[]
  programmes: any[]
  lessons: any[]
  messages: any[]
  attendance: any[]
  analytics: any
}

const defaultStore: DBStore = {
  users: [],
  teachers: [],
  programmes: [],
  lessons: [],
  messages: [],
  attendance: [],
  analytics: { totalLogins: 0, totalMessages: 0 }
}

export function loadDB(): DBStore {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading database:', error)
  }
  return defaultStore
}

export function saveDB(store: DBStore) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(store, null, 2))
  } catch (error) {
    console.error('Error saving database:', error)
  }
}

export function getStore(): DBStore {
  return loadDB()
}

export function updateStore(updates: Partial<DBStore>) {
  const store = loadDB()
  const updated = { ...store, ...updates }
  saveDB(updated)
  return updated
}

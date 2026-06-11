import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { getStore, saveDB } from './database'

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

let store = getStore()

const nextId = (arr: { id: number }[]) => (arr.length ? Math.max(...arr.map((item) => item.id)) + 1 : 1)

const broadcastUpdate = (event: string, data: any) => {
  io.emit(event, data)
}

// Delete endpoints
app.delete('/api/teachers/:id', (req, res) => {
  const teacherId = Number(req.params.id)
  const teacherIndex = store.teachers.findIndex((item) => item.id === teacherId)
  if (teacherIndex === -1) {
    return res.status(404).json({ error: 'Teacher not found' })
  }
  const userIndex = store.users.findIndex((item) => item.teacherId === teacherId)
  if (userIndex !== -1) {
    store.users.splice(userIndex, 1)
  }
  const teacher = store.teachers.splice(teacherIndex, 1)[0]
  saveDB(store)
  broadcastUpdate('teacherRemoved', { id: teacherId })
  res.json({ message: 'Teacher removed', teacher })
})

app.delete('/api/users/:id', (req, res) => {
  const userId = Number(req.params.id)
  const userIndex = store.users.findIndex((item) => item.id === userId)
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' })
  }
  if (store.users[userIndex].role === 'admin') {
    return res.status(403).json({ error: 'Cannot delete admin user' })
  }
  const user = store.users.splice(userIndex, 1)[0]
  saveDB(store)
  broadcastUpdate('userRemoved', { id: userId })
  res.json({ message: 'User removed', user })
})

app.delete('/api/lessons/:id', (req, res) => {
  const lessonId = Number(req.params.id)
  const lessonIndex = store.lessons.findIndex((item) => item.id === lessonId)
  if (lessonIndex === -1) {
    return res.status(404).json({ error: 'Lesson not found' })
  }
  const lesson = store.lessons.splice(lessonIndex, 1)[0]
  saveDB(store)
  broadcastUpdate('lessonRemoved', { id: lessonId })
  res.json({ message: 'Lesson removed', lesson })
})

app.delete('/api/programmes/:id', (req, res) => {
  const programmeId = Number(req.params.id)
  const programmeIndex = store.programmes.findIndex((item) => item.id === programmeId)
  if (programmeIndex === -1) {
    return res.status(404).json({ error: 'Programme not found' })
  }
  const programme = store.programmes.splice(programmeIndex, 1)[0]
  store.lessons = store.lessons.filter((lesson) => lesson.programmeId !== programmeId)
  saveDB(store)
  broadcastUpdate('programmeRemoved', { id: programmeId })
  res.json({ message: 'Programme removed', programme })
})

app.post('/api/timetable/clear', (req, res) => {
  store.lessons = []
  saveDB(store)
  broadcastUpdate('timetableCleared', {})
  res.json({ message: 'All lessons cleared' })
})

export { app, httpServer, io, store }

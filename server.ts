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

const broadcastUpdate = (event: string, data: any) => {
  io.emit(event, data)
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

})

const nextId = (arr: { id: number }[]) => (arr.length ? Math.max(...arr.map((item) => item.id)) + 1 : 1)

app.post('/api/login', (req, res) => {
  const { username, password } = req.body as { username: string; password: string }
  const user = store.users.find((entry) => entry.username === username && entry.password === password)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  store.analytics.totalLogins++
  saveDB(store)
  const { password: _pwd, ...payload } = user
  res.json(payload)
})

app.get('/api/teachers', (_, res) => {
  res.json(store.teachers)
})

app.post('/api/teachers', (req, res) => {
  const { name, subject, email, username, password } = req.body as {
    name: string
    subject: string
    email: string
    username: string
    password: string
  }
  if (!name || !subject || !email || !username || !password) {
    return res.status(400).json({ error: 'All teacher fields are required' })
  }
  if (store.users.some((entry) => entry.username === username)) {
    return res.status(409).json({ error: 'Username already exists' })
  }
  const nextTeacherId = nextId(store.teachers)
  store.teachers.push({ id: nextTeacherId, name, subject, email, username })
  store.users.push({ id: nextId(store.users), name, username, password, role: 'teacher', teacherId: nextTeacherId })
  store.analytics.totalTeachers++
  saveDB(store)
  broadcastUpdate('teacherAdded', { id: nextTeacherId, name, subject, email, username })
  res.status(201).json({ id: nextTeacherId, name, subject, email, username })
})

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
  store.analytics.totalTeachers--
  saveDB(store)
  broadcastUpdate('teacherRemoved', { id: teacherId })
  res.json({ message: 'Teacher removed', teacher })
})

app.get('/api/programmes', (_, res) => {
  res.json(store.programmes)
})

app.post('/api/programmes', (req, res) => {
  const { title, description, status, startDate, endDate, teachers: programmeTeachers } = req.body as {
    title: string
    description: string
    status: 'upcoming' | 'ongoing' | 'completed'
    startDate: string
    endDate: string
    teachers: number[]
  }
  if (!title || !description || !startDate || !endDate || !status) {
    return res.status(400).json({ error: 'Title, description, status, start date, and end date are required' })
  }
  const programme = {
    id: nextId(store.programmes),
    title,
    description,
    status,
    startDate,
    endDate,
    teachers: programmeTeachers || []
  }
  store.programmes.push(programme)
  store.analytics.totalProgrammes++
  saveDB(store)
  broadcastUpdate('programmeAdded', programme)
  res.status(201).json(programme)
})

app.put('/api/programmes/:id', (req, res) => {
  const programmeId = Number(req.params.id)
  const programme = store.programmes.find((item) => item.id === programmeId)
  if (!programme) {
    return res.status(404).json({ error: 'Programme not found' })
  }
  const { title, description, status, startDate, endDate, teachers: programmeTeachers } = req.body as Partial<any>
  if (title) programme.title = title
  if (description) programme.description = description
  if (status) programme.status = status
  if (startDate) programme.startDate = startDate
  if (endDate) programme.endDate = endDate
  if (programmeTeachers) programme.teachers = programmeTeachers
  saveDB(store)
  broadcastUpdate('programmeUpdated', programme)
  res.json(programme)
})

app.delete('/api/programmes/:id', (req, res) => {
  const programmeId = Number(req.params.id)
  const programmeIndex = store.programmes.findIndex((item) => item.id === programmeId)
  if (programmeIndex === -1) {
    return res.status(404).json({ error: 'Programme not found' })
  }
  const programme = store.programmes.splice(programmeIndex, 1)[0]
  store.lessons = store.lessons.filter((lesson) => lesson.programmeId !== programmeId)
  store.analytics.totalProgrammes--
  saveDB(store)
  broadcastUpdate('programmeRemoved', { id: programmeId })
  res.json({ message: 'Programme removed', programme })
})

app.get('/api/lessons', (req, res) => {
  const day = req.query.day as string | undefined
  const teacherId = req.query.teacherId ? Number(req.query.teacherId) : undefined
  let results = store.lessons
  if (day) {
    results = results.filter((lesson) => lesson.day === day)
  }
  if (teacherId) {
    results = results.filter((lesson) => lesson.teacherId === teacherId)
  }
  res.json(results)
})

app.get('/api/teachers/:id/lessons', (req, res) => {
  const teacherId = Number(req.params.id)
  const day = req.query.day as string | undefined
  let results = store.lessons.filter((lesson) => lesson.teacherId === teacherId)
  if (day) {
    results = results.filter((lesson) => lesson.day === day)
  }
  res.json(results)
})

app.post('/api/lessons', (req, res) => {
  const { teacherId, programmeId, subject, day, time, duration, topic } = req.body as any
  if (!teacherId || !programmeId || !subject || !day || !time || !duration || !topic) {
    return res.status(400).json({ error: 'All lesson fields are required' })
  }
  if (!store.teachers.some((teacher) => teacher.id === teacherId)) {
    return res.status(404).json({ error: 'Teacher not found' })
  }
  if (!store.programmes.some((programme) => programme.id === programmeId)) {
    return res.status(404).json({ error: 'Programme not found' })
  }
  const lesson = { id: nextId(store.lessons), teacherId, programmeId, subject, day, time, duration, topic }
  store.lessons.push(lesson)
  store.analytics.totalLessons++
  saveDB(store)
  broadcastUpdate('lessonAdded', lesson)
  res.status(201).json(lesson)
})

app.put('/api/lessons/:id', (req, res) => {
  const lessonId = Number(req.params.id)
  const lesson = store.lessons.find((item) => item.id === lessonId)
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' })
  }
  const { teacherId, programmeId, subject, day, time, duration, topic } = req.body as Partial<any>
  if (teacherId) lesson.teacherId = teacherId
  if (programmeId) lesson.programmeId = programmeId
  if (subject) lesson.subject = subject
  if (day) lesson.day = day
  if (time) lesson.time = time
  if (duration) lesson.duration = duration
  if (topic) lesson.topic = topic
  saveDB(store)
  broadcastUpdate('lessonUpdated', lesson)
  res.json(lesson)
})

app.delete('/api/lessons/:id', (req, res) => {
  const lessonId = Number(req.params.id)
  const lessonIndex = store.lessons.findIndex((item) => item.id === lessonId)
  if (lessonIndex === -1) {
    return res.status(404).json({ error: 'Lesson not found' })
  }
  const lesson = store.lessons.splice(lessonIndex, 1)[0]
  store.analytics.totalLessons--
  saveDB(store)
  broadcastUpdate('lessonRemoved', { id: lessonId })
  res.json({ message: 'Lesson removed', lesson })
})

app.post('/api/timetable/clear', (req, res) => {
  store.lessons = []
  store.analytics.totalLessons = 0
  saveDB(store)
  broadcastUpdate('timetableCleared', {})
  res.json({ message: 'All lessons cleared' })
})

app.get('/api/messages', (_, res) => {
  res.json(messages)
})

app.post('/api/messages', (req, res) => {
  const { senderId, senderName, content } = req.body as { senderId: number; senderName: string; content: string }
  if (!senderId || !senderName || !content) {
    return res.status(400).json({ error: 'Sender and message content are required' })
  }
  const message = { id: nextId(messages), senderId, senderName, content, createdAt: new Date().toISOString() }
  messages.push(message)
  res.status(201).json(message)
})

app.patch('/api/users/:id', (req, res) => {
  const userId = Number(req.params.id)
  const user = users.find((item) => item.id === userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username && !password) {
    return res.status(400).json({ error: 'Username or password must be provided' })
  }
  if (username && users.some((item) => item.username === username && item.id !== userId)) {
    return res.status(409).json({ error: 'Username already in use' })
  }
  if (username) {
    user.username = username
    if (user.role === 'teacher' && user.teacherId) {
      const teacher = teachers.find((item) => item.id === user.teacherId)
      if (teacher) teacher.username = username
    }
  }
  if (password) {
    user.password = password
  }
  const { password: _pwd, ...payload } = user
  res.json(payload)
})

const port = 4000
app.listen(port, () => {
  console.log(`School programme server running on http://localhost:${port}`)
})

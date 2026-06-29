// server.ts
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { getStore, saveDB } from './database'

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, { 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  } 
})

app.use(cors())
app.use(express.json())

let store = getStore()

const nextId = (arr: { id: number }[]) => 
  arr.length ? Math.max(...arr.map((item) => item.id)) + 1 : 1

const broadcastUpdate = (event: string, data: any) => {
  io.emit(event, data)
}

// ==================== SOCKET.IO ====================
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

// ==================== AUTH ENDPOINTS ====================

app.post('/api/login', (req, res) => {
  const { username, password } = req.body as { username: string; password: string }
  
  const user = store.users.find(
    (entry) => entry.username === username && entry.password === password
  )
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  
  store.analytics.totalLogins++
  saveDB(store)
  
  const { password: _pwd, ...payload } = user
  res.json({ ...payload, token: user.id.toString() })
})

app.get('/api/me', (req, res) => {
  // In a real app, you'd get the user from the token
  // For simplicity, we'll return the first user
  const user = store.users[0]
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  const { password, ...payload } = user
  res.json(payload)
})

// ==================== USER ENDPOINTS ====================

app.get('/api/users', (req, res) => {
  const users = store.users.map(({ password, ...user }) => user)
  res.json(users)
})

app.get('/api/users/:id', (req, res) => {
  const userId = Number(req.params.id)
  const user = store.users.find((item) => item.id === userId)
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const { password, ...payload } = user
  res.json(payload)
})

app.post('/api/users', (req, res) => {
  const { name, username, password, role, teacherId, permissions } = req.body
  
  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'Name, username, password, and role are required' })
  }
  
  if (store.users.some((u) => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' })
  }
  
  const newUser = {
    id: nextId(store.users),
    name,
    username,
    password,
    role,
    teacherId: teacherId || null,
    permissions: permissions || []
  }
  
  store.users.push(newUser)
  saveDB(store)
  
  const { password: _pwd, ...payload } = newUser
  broadcastUpdate('userAdded', payload)
  res.status(201).json(payload)
})

app.patch('/api/users/:id', (req, res) => {
  const userId = Number(req.params.id)
  const user = store.users.find((item) => item.id === userId)
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const { name, username, password, role, teacherId, permissions } = req.body
  
  if (username && store.users.some((u) => u.username === username && u.id !== userId)) {
    return res.status(409).json({ error: 'Username already in use' })
  }
  
  if (name) user.name = name
  if (username) user.username = username
  if (password) user.password = password
  if (role) user.role = role
  if (teacherId !== undefined) user.teacherId = teacherId
  if (permissions) user.permissions = permissions
  
  saveDB(store)
  
  const { password: _pwd, ...payload } = user
  broadcastUpdate('userUpdated', payload)
  res.json(payload)
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

app.patch('/api/users/:id/permissions', (req, res) => {
  const userId = Number(req.params.id)
  const user = store.users.find((item) => item.id === userId)
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  const { permissions } = req.body
  if (!permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ error: 'Permissions array is required' })
  }
  
  user.permissions = permissions
  saveDB(store)
  
  const { password, ...payload } = user
  broadcastUpdate('userPermissionsUpdated', { 
    userId: user.id, 
    username: user.username,
    permissions: user.permissions 
  })
  res.json(payload)
})

// ==================== TEACHER ENDPOINTS ====================

app.get('/api/teachers', (req, res) => {
  res.json(store.teachers)
})

app.get('/api/teachers/:id', (req, res) => {
  const teacherId = Number(req.params.id)
  const teacher = store.teachers.find((item) => item.id === teacherId)
  
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' })
  }
  
  res.json(teacher)
})

app.post('/api/teachers', (req, res) => {
  const { name, subject, email, username, password } = req.body
  
  if (!name || !subject || !email || !username || !password) {
    return res.status(400).json({ error: 'All teacher fields are required' })
  }
  
  if (store.users.some((entry) => entry.username === username)) {
    return res.status(409).json({ error: 'Username already exists' })
  }
  
  const nextTeacherId = nextId(store.teachers)
  const newTeacher = { id: nextTeacherId, name, subject, email, username }
  
  store.teachers.push(newTeacher)
  store.users.push({
    id: nextId(store.users),
    name,
    username,
    password,
    role: 'teacher',
    teacherId: nextTeacherId,
    permissions: []
  })
  store.analytics.totalTeachers++
  saveDB(store)
  
  broadcastUpdate('teacherAdded', newTeacher)
  res.status(201).json(newTeacher)
})

app.put('/api/teachers/:id', (req, res) => {
  const teacherId = Number(req.params.id)
  const teacher = store.teachers.find((item) => item.id === teacherId)
  
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' })
  }
  
  const { name, subject, email, username } = req.body
  
  if (username && store.users.some((u) => u.username === username && u.teacherId !== teacherId)) {
    return res.status(409).json({ error: 'Username already in use' })
  }
  
  if (name) teacher.name = name
  if (subject) teacher.subject = subject
  if (email) teacher.email = email
  if (username) teacher.username = username
  
  // Update corresponding user
  const user = store.users.find((u) => u.teacherId === teacherId)
  if (user) {
    if (username) user.username = username
    if (name) user.name = name
  }
  
  saveDB(store)
  broadcastUpdate('teacherUpdated', teacher)
  res.json(teacher)
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

// ==================== PROGRAMME ENDPOINTS ====================

app.get('/api/programmes', (req, res) => {
  res.json(store.programmes)
})

app.get('/api/programmes/:id', (req, res) => {
  const programmeId = Number(req.params.id)
  const programme = store.programmes.find((item) => item.id === programmeId)
  
  if (!programme) {
    return res.status(404).json({ error: 'Programme not found' })
  }
  
  res.json(programme)
})

app.post('/api/programmes', (req, res) => {
  const { title, description, status, startDate, endDate, teachers: programmeTeachers } = req.body
  
  if (!title || !description || !startDate || !endDate || !status) {
    return res.status(400).json({ 
      error: 'Title, description, status, start date, and end date are required' 
    })
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
  
  const { title, description, status, startDate, endDate, teachers: programmeTeachers } = req.body
  
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

// ==================== LESSON ENDPOINTS ====================

app.get('/api/lessons', (req, res) => {
  const day = req.query.day as string | undefined
  const teacherId = req.query.teacherId ? Number(req.query.teacherId) : undefined
  const programmeId = req.query.programmeId ? Number(req.query.programmeId) : undefined
  
  let results = store.lessons
  
  if (day) {
    results = results.filter((lesson) => lesson.day === day)
  }
  if (teacherId) {
    results = results.filter((lesson) => lesson.teacherId === teacherId)
  }
  if (programmeId) {
    results = results.filter((lesson) => lesson.programmeId === programmeId)
  }
  
  res.json(results)
})

app.get('/api/lessons/:id', (req, res) => {
  const lessonId = Number(req.params.id)
  const lesson = store.lessons.find((item) => item.id === lessonId)
  
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' })
  }
  
  res.json(lesson)
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
  const { teacherId, programmeId, subject, day, time, duration, topic } = req.body
  
  if (!teacherId || !programmeId || !subject || !day || !time || !duration || !topic) {
    return res.status(400).json({ error: 'All lesson fields are required' })
  }
  
  if (!store.teachers.some((teacher) => teacher.id === teacherId)) {
    return res.status(404).json({ error: 'Teacher not found' })
  }
  
  if (!store.programmes.some((programme) => programme.id === programmeId)) {
    return res.status(404).json({ error: 'Programme not found' })
  }
  
  // Check for scheduling conflicts
  const conflict = store.lessons.some(
    (l) => l.teacherId === teacherId && l.day === day && l.time === time
  )
  
  if (conflict) {
    return res.status(409).json({ error: 'Teacher already has a lesson at this time' })
  }
  
  const lesson = { 
    id: nextId(store.lessons), 
    teacherId, 
    programmeId, 
    subject, 
    day, 
    time, 
    duration, 
    topic 
  }
  
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
  
  const { teacherId, programmeId, subject, day, time, duration, topic } = req.body
  
  // Check for conflicts if teacher or time is changing
  if ((teacherId || time || day) && (teacherId || lesson.teacherId) && (time || lesson.time) && (day || lesson.day)) {
    const newTeacherId = teacherId || lesson.teacherId
    const newDay = day || lesson.day
    const newTime = time || lesson.time
    
    const conflict = store.lessons.some(
      (l) => l.id !== lessonId && l.teacherId === newTeacherId && l.day === newDay && l.time === newTime
    )
    
    if (conflict) {
      return res.status(409).json({ error: 'Teacher already has a lesson at this time' })
    }
  }
  
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

// ==================== MESSAGE ENDPOINTS ====================

app.get('/api/messages', (req, res) => {
  res.json(store.messages || [])
})

app.post('/api/messages', (req, res) => {
  const { senderId, senderName, content } = req.body
  
  if (!senderId || !senderName || !content) {
    return res.status(400).json({ error: 'Sender and message content are required' })
  }
  
  if (!store.messages) {
    store.messages = []
  }
  
  const message = {
    id: nextId(store.messages),
    senderId,
    senderName,
    content,
    role: store.users.find(u => u.id === senderId)?.role || 'teacher',
    createdAt: new Date().toISOString()
  }
  
  store.messages.push(message)
  saveDB(store)
  
  broadcastUpdate('messageAdded', message)
  res.status(201).json(message)
})

app.delete('/api/messages/:id', (req, res) => {
  const messageId = Number(req.params.id)
  const messageIndex = store.messages.findIndex((m) => m.id === messageId)
  
  if (messageIndex === -1) {
    return res.status(404).json({ error: 'Message not found' })
  }
  
  store.messages.splice(messageIndex, 1)
  saveDB(store)
  
  broadcastUpdate('messageRemoved', { id: messageId })
  res.json({ message: 'Message deleted' })
})

// ==================== ATTENDANCE ENDPOINTS ====================

app.get('/api/attendance', (req, res) => {
  const lessonId = req.query.lessonId ? Number(req.query.lessonId) : undefined
  const userId = req.query.userId ? Number(req.query.userId) : undefined
  
  let results = store.attendance || []
  
  if (lessonId) {
    results = results.filter((a) => a.lessonId === lessonId)
  }
  if (userId) {
    results = results.filter((a) => a.userId === userId)
  }
  
  res.json(results)
})

app.get('/api/attendance/:id', (req, res) => {
  const attendanceId = Number(req.params.id)
  const attendance = (store.attendance || []).find((item) => item.id === attendanceId)
  
  if (!attendance) {
    return res.status(404).json({ error: 'Attendance record not found' })
  }
  
  res.json(attendance)
})

app.post('/api/attendance', (req, res) => {
  const { lessonId, userId, status } = req.body
  
  if (!lessonId || !userId || !status) {
    return res.status(400).json({ error: 'Lesson ID, user ID, and status are required' })
  }
  
  if (!['present', 'absent', 'late'].includes(status)) {
    return res.status(400).json({ error: 'Status must be present, absent, or late' })
  }
  
  // Verify lesson exists
  if (!store.lessons.some((lesson) => lesson.id === lessonId)) {
    return res.status(404).json({ error: 'Lesson not found' })
  }
  
  // Verify user exists
  if (!store.users.some((user) => user.id === userId)) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  if (!store.attendance) {
    store.attendance = []
  }
  
  // Check if attendance already exists for this lesson and user
  const existingIndex = store.attendance.findIndex(
    (a) => a.lessonId === lessonId && a.userId === userId
  )
  
  let attendanceRecord
  
  if (existingIndex !== -1) {
    // Update existing
    store.attendance[existingIndex].status = status
    store.attendance[existingIndex].timestamp = new Date().toISOString()
    attendanceRecord = store.attendance[existingIndex]
  } else {
    // Create new
    attendanceRecord = {
      id: nextId(store.attendance),
      lessonId,
      userId,
      status,
      timestamp: new Date().toISOString()
    }
    store.attendance.push(attendanceRecord)
  }
  
  store.analytics.totalAttendance = (store.analytics.totalAttendance || 0) + 1
  saveDB(store)
  
  broadcastUpdate('attendanceUpdated', attendanceRecord)
  res.status(201).json(attendanceRecord)
})

app.put('/api/attendance/:id', (req, res) => {
  const attendanceId = Number(req.params.id)
  const { status } = req.body
  
  if (!status) {
    return res.status(400).json({ error: 'Status is required' })
  }
  
  if (!['present', 'absent', 'late'].includes(status)) {
    return res.status(400).json({ error: 'Status must be present, absent, or late' })
  }
  
  if (!store.attendance) {
    return res.status(404).json({ error: 'Attendance record not found' })
  }
  
  const attendanceIndex = store.attendance.findIndex((item) => item.id === attendanceId)
  
  if (attendanceIndex === -1) {
    return res.status(404).json({ error: 'Attendance record not found' })
  }
  
  store.attendance[attendanceIndex].status = status
  store.attendance[attendanceIndex].timestamp = new Date().toISOString()
  saveDB(store)
  
  broadcastUpdate('attendanceUpdated', store.attendance[attendanceIndex])
  res.json(store.attendance[attendanceIndex])
})

app.delete('/api/attendance/:id', (req, res) => {
  const attendanceId = Number(req.params.id)
  
  if (!store.attendance) {
    return res.status(404).json({ error: 'Attendance record not found' })
  }
  
  const attendanceIndex = store.attendance.findIndex((item) => item.id === attendanceId)
  
  if (attendanceIndex === -1) {
    return res.status(404).json({ error: 'Attendance record not found' })
  }
  
  const attendance = store.attendance.splice(attendanceIndex, 1)[0]
  store.analytics.totalAttendance = Math.max(0, (store.analytics.totalAttendance || 1) - 1)
  saveDB(store)
  
  broadcastUpdate('attendanceRemoved', { id: attendanceId })
  res.json({ message: 'Attendance record removed', attendance })
})

// Bulk attendance endpoints
app.post('/api/attendance/bulk', (req, res) => {
  const { records } = req.body
  
  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Records array is required' })
  }
  
  if (!store.attendance) {
    store.attendance = []
  }
  
  const results = []
  
  for (const record of records) {
    const { lessonId, userId, status } = record
    
    if (!lessonId || !userId || !status) {
      continue // Skip invalid records
    }
    
    if (!['present', 'absent', 'late'].includes(status)) {
      continue // Skip invalid status
    }
    
    // Check if attendance already exists
    const existingIndex = store.attendance.findIndex(
      (a) => a.lessonId === lessonId && a.userId === userId
    )
    
    let attendanceRecord
    
    if (existingIndex !== -1) {
      // Update existing
      store.attendance[existingIndex].status = status
      store.attendance[existingIndex].timestamp = new Date().toISOString()
      attendanceRecord = store.attendance[existingIndex]
    } else {
      // Create new
      attendanceRecord = {
        id: nextId(store.attendance),
        lessonId,
        userId,
        status,
        timestamp: new Date().toISOString()
      }
      store.attendance.push(attendanceRecord)
    }
    
    results.push(attendanceRecord)
  }
  
  store.analytics.totalAttendance = (store.analytics.totalAttendance || 0) + results.length
  saveDB(store)
  
  broadcastUpdate('attendanceBulkUpdated', { count: results.length })
  res.status(201).json({ message: `${results.length} attendance records saved`, records: results })
})

// Get attendance statistics for a user
app.get('/api/users/:id/attendance/stats', (req, res) => {
  const userId = Number(req.params.id)
  
  if (!store.attendance) {
    return res.json({
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendanceRate: 0
    })
  }
  
  const userAttendance = store.attendance.filter((a) => a.userId === userId)
  const total = userAttendance.length
  
  if (total === 0) {
    return res.json({
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendanceRate: 0
    })
  }
  
  const present = userAttendance.filter((a) => a.status === 'present').length
  const absent = userAttendance.filter((a) => a.status === 'absent').length
  const late = userAttendance.filter((a) => a.status === 'late').length
  const attendanceRate = Math.round((present / total) * 100)
  
  res.json({
    total,
    present,
    absent,
    late,
    attendanceRate
  })
})

// Get attendance statistics for a lesson
app.get('/api/lessons/:id/attendance/stats', (req, res) => {
  const lessonId = Number(req.params.id)
  
  if (!store.attendance) {
    return res.json({
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendanceRate: 0
    })
  }
  
  const lessonAttendance = store.attendance.filter((a) => a.lessonId === lessonId)
  const total = lessonAttendance.length
  
  if (total === 0) {
    return res.json({
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendanceRate: 0
    })
  }
  
  const present = lessonAttendance.filter((a) => a.status === 'present').length
  const absent = lessonAttendance.filter((a) => a.status === 'absent').length
  const late = lessonAttendance.filter((a) => a.status === 'late').length
  const attendanceRate = Math.round((present / total) * 100)
  
  res.json({
    total,
    present,
    absent,
    late,
    attendanceRate
  })
})

// ==================== ANALYTICS ENDPOINTS ====================

app.get('/api/analytics', (req, res) => {
  const analytics = {
    ...store.analytics,
    totalUsers: store.users.length,
    totalMessages: (store.messages || []).length,
    totalAttendance: (store.attendance || []).length,
    userBreakdown: {
      admin: store.users.filter(u => u.role === 'admin').length,
      teacher: store.users.filter(u => u.role === 'teacher').length,
    },
    programmeStatus: {
      upcoming: store.programmes.filter(p => p.status === 'upcoming').length,
      ongoing: store.programmes.filter(p => p.status === 'ongoing').length,
      completed: store.programmes.filter(p => p.status === 'completed').length,
    }
  }
  
  res.json(analytics)
})

// ==================== TIMETABLE ENDPOINTS ====================

app.post('/api/timetable/clear', (req, res) => {
  store.lessons = []
  store.analytics.totalLessons = 0
  saveDB(store)
  
  broadcastUpdate('timetableCleared', {})
  res.json({ message: 'All lessons cleared' })
})

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// ==================== PERMISSIONS ENDPOINT ====================

app.get('/api/permissions', (req, res) => {
  const permissions = {
    'manage_users': 'Create, update, and delete users',
    'manage_teachers': 'Create, update, and delete teachers',
    'manage_programmes': 'Create, update, and delete programmes',
    'manage_lessons': 'Create, update, and delete lessons',
    'manage_all_lessons': 'Delete ANY lesson (not just own)',
    'manage_messages': 'Delete messages',
    'view_analytics': 'View analytics dashboard',
    'manage_permissions': 'Assign permissions to other teachers',
    'clear_timetable': 'Clear entire timetable'
  }
  
  res.json(permissions)
})

// ==================== START SERVER ====================

const PORT = process.env.PORT || 4000

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(` API endpoints available at http://localhost:${PORT}/api`)
  console.log(` WebSocket server running on ws://localhost:${PORT}`)
})

export { app, httpServer, io, store }

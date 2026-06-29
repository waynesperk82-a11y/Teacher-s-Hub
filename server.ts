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

// Initialize admin user if not exists
const initializeAdmin = () => {
  const adminExists = store.users.some(user => user.role === 'admin')
  if (!adminExists) {
    const adminUser = {
      id: nextId(store.users),
      name: 'System Administrator',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      teacherId: null,
      permissions: ['all'] // Admin has all permissions
    }
    store.users.push(adminUser)
    saveDB(store)
    console.log('✅ Admin user created with username: admin, password: admin123')
  }
}

const broadcastUpdate = (event: string, data: any) => {
  io.emit(event, data)
}

// Authentication middleware
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  const token = authHeader.split(' ')[1]
  const user = store.users.find(u => u.id === parseInt(token))
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
  
  req.user = user
  next()
}

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Permission-based middleware
const requirePermission = (permission: string) => {
  return (req: any, res: any, next: any) => {
    if (req.user.role === 'admin') {
      return next() // Admin has all permissions
    }
    
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: `Permission '${permission}' required. Contact admin to request access.` 
      })
    }
    next()
  }
}

// Teacher or Admin middleware (basic access)
const requireTeacherOrAdmin = (req: any, res: any, next: any) => {
  if (req.user.role === 'admin' || req.user.role === 'teacher') {
    return next()
  }
  return res.status(403).json({ error: 'Teacher or Admin access required' })
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

const nextId = (arr: { id: number }[]) => (arr.length ? Math.max(...arr.map((item) => item.id)) + 1 : 1)

// Initialize admin on startup
initializeAdmin()

// ==================== AUTH ENDPOINTS ====================

app.post('/api/login', (req, res) => {
  const { username, password } = req.body as { username: string; password: string }
  const user = store.users.find((entry) => entry.username === username && entry.password === password)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  store.analytics.totalLogins++
  saveDB(store)
  const { password: _pwd, ...payload } = user
  res.json({ ...payload, token: user.id.toString() })
})

app.post('/api/logout', authenticate, (req: any, res) => {
  res.json({ message: 'Logged out successfully' })
})

// ==================== PERMISSION MANAGEMENT (Admin only) ====================

// Available permissions
const AVAILABLE_PERMISSIONS = {
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

app.get('/api/permissions', authenticate, (req, res) => {
  res.json(AVAILABLE_PERMISSIONS)
})

app.get('/api/users/:id/permissions', authenticate, requireAdmin, (req, res) => {
  const userId = Number(req.params.id)
  const user = store.users.find((u) => u.id === userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json({
    userId: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions || []
  })
})

app.patch('/api/users/:id/permissions', authenticate, requireAdmin, (req, res) => {
  const userId = Number(req.params.id)
  const user = store.users.find((u) => u.id === userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Prevent modifying admin permissions
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'Cannot modify admin permissions' })
  }

  const { permissions } = req.body as { permissions: string[] }
  
  // Validate permissions
  const validPermissions = Object.keys(AVAILABLE_PERMISSIONS)
  const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
  if (invalidPermissions.length > 0) {
    return res.status(400).json({ 
      error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
      available: validPermissions
    })
  }

  user.permissions = permissions
  saveDB(store)
  broadcastUpdate('userPermissionsUpdated', { 
    userId: user.id, 
    username: user.username,
    permissions: user.permissions 
  })
  
  const { password, ...userWithoutPassword } = user
  res.json(userWithoutPassword)
})

// ==================== USER MANAGEMENT (Admin only) ====================

app.get('/api/users', authenticate, requireAdmin, (req, res) => {
  const users = store.users.map(({ password, ...user }) => user)
  res.json(users)
})

app.get('/api/users/:id', authenticate, requireAdmin, (req, res) => {
  const userId = Number(req.params.id)
  const user = store.users.find((item) => item.id === userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  const { password, ...userWithoutPassword } = user
  res.json(userWithoutPassword)
})

app.post('/api/users', authenticate, requireAdmin, (req, res) => {
  const { name, username, password, role, teacherId, permissions } = req.body as {
    name: string
    username: string
    password: string
    role: 'admin' | 'teacher'
    teacherId?: number
    permissions?: string[]
  }

  if (!name || !username || !password || !role) {
    return res.status(400).json({ error: 'Name, username, password, and role are required' })
  }

  if (role !== 'admin' && role !== 'teacher') {
    return res.status(400).json({ error: 'Role must be either "admin" or "teacher"' })
  }

  if (store.users.some((u) => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' })
  }

  if (role === 'teacher' && teacherId) {
    const teacher = store.teachers.find(t => t.id === teacherId)
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' })
    }
  }

  // Validate permissions if provided
  if (permissions) {
    const validPermissions = Object.keys(AVAILABLE_PERMISSIONS)
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    if (invalidPermissions.length > 0) {
      return res.status(400).json({ 
        error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
        available: validPermissions
      })
    }
  }

  const newUser = {
    id: nextId(store.users),
    name,
    username,
    password,
    role,
    teacherId: role === 'teacher' ? teacherId || null : null,
    permissions: role === 'admin' ? ['all'] : (permissions || [])
  }

  store.users.push(newUser)
  saveDB(store)
  broadcastUpdate('userAdded', { ...newUser, password: undefined })
  
  const { password: _pwd, ...userWithoutPassword } = newUser
  res.status(201).json(userWithoutPassword)
})

app.patch('/api/users/:id', authenticate, requireAdmin, (req, res) => {
  const userId = Number(req.params.id)
  const user = store.users.find((item) => item.id === userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (user.role === 'admin' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Cannot modify another admin user' })
  }

  const { name, username, password, role, teacherId, permissions } = req.body as {
    name?: string
    username?: string
    password?: string
    role?: 'admin' | 'teacher'
    teacherId?: number | null
    permissions?: string[]
  }

  if (username && store.users.some((u) => u.username === username && u.id !== userId)) {
    return res.status(409).json({ error: 'Username already in use' })
  }

  if (role && role !== 'admin' && role !== 'teacher') {
    return res.status(400).json({ error: 'Role must be either "admin" or "teacher"' })
  }

  // Validate permissions if provided
  if (permissions) {
    const validPermissions = Object.keys(AVAILABLE_PERMISSIONS)
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    if (invalidPermissions.length > 0) {
      return res.status(400).json({ 
        error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
        available: validPermissions
      })
    }
    user.permissions = permissions
  }

  if (name) user.name = name
  if (username) user.username = username
  if (password) user.password = password
  if (role) user.role = role
  if (teacherId !== undefined) user.teacherId = teacherId

  if (user.role === 'teacher' && user.teacherId) {
    const teacher = store.teachers.find(t => t.id === user.teacherId)
    if (teacher) {
      if (username) teacher.username = username
      if (name) teacher.name = name
    }
  }

  saveDB(store)
  broadcastUpdate('userUpdated', { ...user, password: undefined })
  
  const { password: _pwd, ...userWithoutPassword } = user
  res.json(userWithoutPassword)
})

app.delete('/api/users/:id', authenticate, requireAdmin, (req: any, res) => {
  const userId = Number(req.params.id)
  
  // Prevent self-deletion
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' })
  }

  const adminCount = store.users.filter(u => u.role === 'admin').length
  const userToDelete = store.users.find(u => u.id === userId)
  
  if (!userToDelete) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (userToDelete.role === 'admin' && adminCount <= 1) {
    return res.status(400).json({ error: 'Cannot delete the last admin user' })
  }

  if (userToDelete.role === 'admin') {
    return res.status(403).json({ error: 'Cannot delete admin users' })
  }

  const userIndex = store.users.findIndex((u) => u.id === userId)
  store.users.splice(userIndex, 1)
  saveDB(store)
  broadcastUpdate('userRemoved', { id: userId })
  res.json({ message: 'User deleted successfully' })
})

// ==================== TEACHER MANAGEMENT ====================

app.get('/api/teachers', authenticate, (_, res) => {
  res.json(store.teachers)
})

app.get('/api/teachers/:id', authenticate, (req, res) => {
  const teacherId = Number(req.params.id)
  const teacher = store.teachers.find((t) => t.id === teacherId)
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' })
  }
  res.json(teacher)
})

app.post('/api/teachers', authenticate, requirePermission('manage_teachers'), (req, res) => {
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
  store.users.push({ 
    id: nextId(store.users), 
    name, 
    username, 
    password, 
    role: 'teacher', 
    teacherId: nextTeacherId,
    permissions: [] // Teachers start with no permissions
  })
  store.analytics.totalTeachers++
  saveDB(store)
  broadcastUpdate('teacherAdded', { id: nextTeacherId, name, subject, email, username })
  res.status(201).json({ id: nextTeacherId, name, subject, email, username })
})

app.put('/api/teachers/:id', authenticate, requirePermission('manage_teachers'), (req, res) => {
  const teacherId = Number(req.params.id)
  const teacher = store.teachers.find((t) => t.id === teacherId)
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' })
  }

  const { name, subject, email, username } = req.body as {
    name?: string
    subject?: string
    email?: string
    username?: string
  }

  if (username && store.users.some((u) => u.username === username && u.teacherId !== teacherId)) {
    return res.status(409).json({ error: 'Username already in use' })
  }

  if (name) teacher.name = name
  if (subject) teacher.subject = subject
  if (email) teacher.email = email
  if (username) teacher.username = username

  const user = store.users.find((u) => u.teacherId === teacherId)
  if (user) {
    if (username) user.username = username
    if (name) user.name = name
  }

  saveDB(store)
  broadcastUpdate('teacherUpdated', teacher)
  res.json(teacher)
})

app.delete('/api/teachers/:id', authenticate, requirePermission('manage_teachers'), (req, res) => {
  const teacherId = Number(req.params.id)
  const teacherIndex = store.teachers.findIndex((item) => item.id === teacherId)
  if (teacherIndex === -1) {
    return res.status(404).json({ error: 'Teacher not found' })
  }

  const hasLessons = store.lessons.some((lesson) => lesson.teacherId === teacherId)
  if (hasLessons) {
    return res.status(400).json({ error: 'Cannot delete teacher with assigned lessons. Remove lessons first.' })
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

// ==================== PROGRAMME MANAGEMENT ====================

app.get('/api/programmes', authenticate, (_, res) => {
  res.json(store.programmes)
})

app.get('/api/programmes/:id', authenticate, (req, res) => {
  const programmeId = Number(req.params.id)
  const programme = store.programmes.find((p) => p.id === programmeId)
  if (!programme) {
    return res.status(404).json({ error: 'Programme not found' })
  }
  res.json(programme)
})

app.post('/api/programmes', authenticate, requirePermission('manage_programmes'), (req, res) => {
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

app.put('/api/programmes/:id', authenticate, requirePermission('manage_programmes'), (req, res) => {
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

app.delete('/api/programmes/:id', authenticate, requirePermission('manage_programmes'), (req, res) => {
  const programmeId = Number(req.params.id)
  const programmeIndex = store.programmes.findIndex((item) => item.id === programmeId)
  if (programmeIndex === -1) {
    return res.status(404).json({ error: 'Programme not found' })
  }

  const hasLessons = store.lessons.some((lesson) => lesson.programmeId === programmeId)
  if (hasLessons) {
    return res.status(400).json({ error: 'Cannot delete programme with assigned lessons. Remove lessons first.' })
  }

  const programme = store.programmes.splice(programmeIndex, 1)[0]
  store.analytics.totalProgrammes--
  saveDB(store)
  broadcastUpdate('programmeRemoved', { id: programmeId })
  res.json({ message: 'Programme removed', programme })
})

// ==================== LESSON MANAGEMENT ====================

app.get('/api/lessons', authenticate, (req, res) => {
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

app.get('/api/lessons/:id', authenticate, (req, res) => {
  const lessonId = Number(req.params.id)
  const lesson = store.lessons.find((l) => l.id === lessonId)
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' })
  }
  res.json(lesson)
})

app.get('/api/teachers/:id/lessons', authenticate, (req, res) => {
  const teacherId = Number(req.params.id)
  const day = req.query.day as string | undefined
  let results = store.lessons.filter((lesson) => lesson.teacherId === teacherId)
  if (day) {
    results = results.filter((lesson) => lesson.day === day)
  }
  res.json(results)
})

app.post('/api/lessons', authenticate, requirePermission('manage_lessons'), (req, res) => {
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

  const conflict = store.lessons.some(
    (l) => l.teacherId === teacherId && l.day === day && l.time === time
  )
  if (conflict) {
    return res.status(409).json({ error: 'Teacher already has a lesson at this time' })
  }

  const lesson = { id: nextId(store.lessons), teacherId, programmeId, subject, day, time, duration, topic }
  store.lessons.push(lesson)
  store.analytics.totalLessons++
  saveDB(store)
  broadcastUpdate('lessonAdded', lesson)
  res.status(201).json(lesson)
})

app.put('/api/lessons/:id', authenticate, requirePermission('manage_lessons'), (req: any, res) => {
  const lessonId = Number(req.params.id)
  const lesson = store.lessons.find((item) => item.id === lessonId)
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' })
  }

  // Check if user has permission to edit this lesson
  if (req.user.role !== 'admin' && req.user.teacherId !== lesson.teacherId) {
    return res.status(403).json({ error: 'You can only edit your own lessons' })
  }

  const { teacherId, programmeId, subject, day, time, duration, topic } = req.body as Partial<any>
  
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

app.delete('/api/lessons/:id', authenticate, (req: any, res) => {
  const lessonId = Number(req.params.id)
  const lessonIndex = store.lessons.findIndex((item) => item.id === lessonId)
  
  if (lessonIndex === -1) {
    return res.status(404).json({ error: 'Lesson not found' })
  }

  const lesson = store.lessons[lessonIndex]
  
  // Check permissions
  if (req.user.role === 'admin') {
    // Admin can delete any lesson
  } else if (req.user.permissions && req.user.permissions.includes('manage_all_lessons')) {
    // Teachers with manage_all_lessons permission can delete any lesson
  } else if (req.user.teacherId === lesson.teacherId) {
    // Teachers can delete their own lessons
  } else {
    return res.status(403).json({ error: 'You do not have permission to delete this lesson' })
  }

  store.lessons.splice(lessonIndex, 1)
  store.analytics.totalLessons--
  saveDB(store)
  broadcastUpdate('lessonRemoved', { id: lessonId })
  res.json({ message: 'Lesson removed', lesson })
})

// ==================== TIMETABLE OPERATIONS ====================

app.post('/api/timetable/clear', authenticate, requirePermission('clear_timetable'), (req, res) => {
  store.lessons = []
  store.analytics.totalLessons = 0
  saveDB(store)
  broadcastUpdate('timetableCleared', {})
  res.json({ message: 'All lessons cleared' })
})

// ==================== MESSAGES ====================

app.get('/api/messages', authenticate, (_, res) => {
  res.json(store.messages || [])
})

app.post('/api/messages', authenticate, (req: any, res) => {
  const { content } = req.body as { content: string }
  if (!content) {
    return res.status(400).json({ error: 'Message content is required' })
  }

  if (!store.messages) {
    store.messages = []
  }

  const message = {
    id: nextId(store.messages),
    senderId: req.user.id,
    senderName: req.user.name,
    content,
    role: req.user.role,
    createdAt: new Date().toISOString()
  }

  store.messages.push(message)
  saveDB(store)
  broadcastUpdate('messageAdded', message)
  res.status(201).json(message)
})

app.delete('/api/messages/:id', authenticate, requirePermission('manage_messages'), (req, res) => {
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

// ==================== ANALYTICS ====================

app.get('/api/analytics', authenticate, requirePermission('view_analytics'), (_, res) => {
  const analytics = {
    ...store.analytics,
    totalUsers: store.users.length,
    totalTeachers: store.teachers.length,
    totalProgrammes: store.programmes.length,
    totalLessons: store.lessons.length,
    totalMessages: (store.messages || []).length,
    userBreakdown: {
      admin: store.users.filter(u => u.role === 'admin').length,
      teacher: store.users.filter(u => u.role === 'teacher').length,
    },
    programmeStatus: {
      upcoming: store.programmes.filter(p => p.status === 'upcoming').length,
      ongoing: store.programmes.filter(p => p.status === 'ongoing').length,
      completed: store.programmes.filter(p => p.status === 'completed').length
    }
  }
  res.json(analytics)
})

// ==================== HEALTH CHECK ====================

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/me', authenticate, (req: any, res) => {
  const { password, ...user } = req.user
  res.json(user)
})

const port = 4000
httpServer.listen(port, () => {
  console.log(`School programme server running on http://localhost:${port}`)
  console.log(' Default admin credentials: admin / admin123')
  console.log('Available permissions:')
  Object.entries(AVAILABLE_PERMISSIONS).forEach(([key, value]) => {
    console.log(`   - ${key}: ${value}`)
  })
})

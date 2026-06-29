// deleteEndpoints.ts
import { Express } from 'express'
import { getStore, saveDB } from './database'

export function setupDeleteEndpoints(app: Express) {
  const broadcastUpdate = (event: string, data: any) => {
    // This will be connected to Socket.IO
    // The actual implementation will be in the main server file
    console.log(`Broadcasting ${event}:`, data)
  }

  // Delete Teacher
  app.delete('/api/teachers/:id', (req, res) => {
    const teacherId = Number(req.params.id)
    const store = getStore()
    
    const teacherIndex = store.teachers.findIndex((item) => item.id === teacherId)
    if (teacherIndex === -1) {
      return res.status(404).json({ error: 'Teacher not found' })
    }
    
    // Remove associated user account
    const userIndex = store.users.findIndex((item) => item.teacherId === teacherId)
    if (userIndex !== -1) {
      store.users.splice(userIndex, 1)
    }
    
    const teacher = store.teachers.splice(teacherIndex, 1)[0]
    store.analytics.totalTeachers = Math.max(0, (store.analytics.totalTeachers || 1) - 1)
    saveDB(store)
    
    broadcastUpdate('teacherRemoved', { id: teacherId })
    res.json({ message: 'Teacher removed', teacher })
  })

  // Delete User
  app.delete('/api/users/:id', (req, res) => {
    const userId = Number(req.params.id)
    const store = getStore()
    
    const userIndex = store.users.findIndex((item) => item.id === userId)
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Prevent deleting admin users
    if (store.users[userIndex].role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' })
    }
    
    const user = store.users.splice(userIndex, 1)[0]
    saveDB(store)
    
    broadcastUpdate('userRemoved', { id: userId })
    res.json({ message: 'User removed', user })
  })

  // Delete Lesson
  app.delete('/api/lessons/:id', (req, res) => {
    const lessonId = Number(req.params.id)
    const store = getStore()
    
    const lessonIndex = store.lessons.findIndex((item) => item.id === lessonId)
    if (lessonIndex === -1) {
      return res.status(404).json({ error: 'Lesson not found' })
    }
    
    const lesson = store.lessons.splice(lessonIndex, 1)[0]
    store.analytics.totalLessons = Math.max(0, (store.analytics.totalLessons || 1) - 1)
    saveDB(store)
    
    broadcastUpdate('lessonRemoved', { id: lessonId })
    res.json({ message: 'Lesson removed', lesson })
  })

  // Delete Programme
  app.delete('/api/programmes/:id', (req, res) => {
    const programmeId = Number(req.params.id)
    const store = getStore()
    
    const programmeIndex = store.programmes.findIndex((item) => item.id === programmeId)
    if (programmeIndex === -1) {
      return res.status(404).json({ error: 'Programme not found' })
    }
    
    const programme = store.programmes.splice(programmeIndex, 1)[0]
    
    // Remove all associated lessons
    store.lessons = store.lessons.filter((lesson) => lesson.programmeId !== programmeId)
    store.analytics.totalProgrammes = Math.max(0, (store.analytics.totalProgrammes || 1) - 1)
    saveDB(store)
    
    broadcastUpdate('programmeRemoved', { id: programmeId })
    res.json({ message: 'Programme removed', programme })
  })

  // Delete Message
  app.delete('/api/messages/:id', (req, res) => {
    const messageId = Number(req.params.id)
    const store = getStore()
    
    if (!store.messages) {
      return res.status(404).json({ error: 'Message not found' })
    }
    
    const messageIndex = store.messages.findIndex((item) => item.id === messageId)
    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' })
    }
    
    const message = store.messages.splice(messageIndex, 1)[0]
    store.analytics.totalMessages = Math.max(0, (store.analytics.totalMessages || 1) - 1)
    saveDB(store)
    
    broadcastUpdate('messageRemoved', { id: messageId })
    res.json({ message: 'Message deleted', message })
  })

  // Delete Attendance Record
  app.delete('/api/attendance/:id', (req, res) => {
    const attendanceId = Number(req.params.id)
    const store = getStore()
    
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

  // Clear Timetable (Delete All Lessons)
  app.post('/api/timetable/clear', (req, res) => {
    const store = getStore()
    
    store.lessons = []
    store.analytics.totalLessons = 0
    saveDB(store)
    
    broadcastUpdate('timetableCleared', {})
    res.json({ message: 'All lessons cleared' })
  })

  // Bulk Delete Lessons by Day
  app.delete('/api/lessons/day/:day', (req, res) => {
    const day = req.params.day
    const store = getStore()
    
    const lessonsToDelete = store.lessons.filter((lesson) => lesson.day === day)
    const count = lessonsToDelete.length
    
    if (count === 0) {
      return res.status(404).json({ error: `No lessons found for ${day}` })
    }
    
    store.lessons = store.lessons.filter((lesson) => lesson.day !== day)
    store.analytics.totalLessons = Math.max(0, (store.analytics.totalLessons || count) - count)
    saveDB(store)
    
    broadcastUpdate('lessonsByDayRemoved', { day, count })
    res.json({ message: `${count} lessons removed for ${day}`, count })
  })

  // Bulk Delete Lessons by Teacher
  app.delete('/api/teachers/:id/lessons', (req, res) => {
    const teacherId = Number(req.params.id)
    const store = getStore()
    
    const lessonsToDelete = store.lessons.filter((lesson) => lesson.teacherId === teacherId)
    const count = lessonsToDelete.length
    
    if (count === 0) {
      return res.status(404).json({ error: `No lessons found for teacher ${teacherId}` })
    }
    
    store.lessons = store.lessons.filter((lesson) => lesson.teacherId !== teacherId)
    store.analytics.totalLessons = Math.max(0, (store.analytics.totalLessons || count) - count)
    saveDB(store)
    
    broadcastUpdate('lessonsByTeacherRemoved', { teacherId, count })
    res.json({ message: `${count} lessons removed for teacher`, count })
  })

  // Bulk Delete Messages by User
  app.delete('/api/users/:id/messages', (req, res) => {
    const userId = Number(req.params.id)
    const store = getStore()
    
    if (!store.messages) {
      return res.status(404).json({ error: 'No messages found' })
    }
    
    const messagesToDelete = store.messages.filter((message) => message.senderId === userId)
    const count = messagesToDelete.length
    
    if (count === 0) {
      return res.status(404).json({ error: `No messages found for user ${userId}` })
    }
    
    store.messages = store.messages.filter((message) => message.senderId !== userId)
    store.analytics.totalMessages = Math.max(0, (store.analytics.totalMessages || count) - count)
    saveDB(store)
    
    broadcastUpdate('messagesByUserRemoved', { userId, count })
    res.json({ message: `${count} messages removed for user`, count })
  })
      }

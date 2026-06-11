export type UserRole = 'admin' | 'teacher'

export interface User {
  id: number
  username: string
  name: string
  role: UserRole
  teacherId?: number
}

export interface Programme {
  id: number
  title: string
  description: string
  status: 'upcoming' | 'ongoing' | 'completed'
  startDate: string
  endDate: string
}

export interface Teacher {
  id: number
  name: string
  subject: string
  email: string
  username: string
  password: string
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
}

export interface Message {
  id: number
  senderId: number
  senderName: string
  content: string
  createdAt: string
}

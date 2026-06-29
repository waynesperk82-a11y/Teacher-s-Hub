
// ==================== USER TYPES ====================

export type UserRole = 'admin' | 'teacher'
export type Permission = 
  | 'manage_users'
  | 'manage_teachers'
  | 'manage_programmes'
  | 'manage_lessons'
  | 'manage_all_lessons'
  | 'manage_messages'
  | 'view_analytics'
  | 'clear_timetable'

export interface User {
  id: number
  username: string
  name: string
  role: UserRole
  teacherId: number | null
  permissions: Permission[]
  token?: string
  password?: string // Optional, not sent in responses
}

// ==================== TEACHER TYPES ====================

export interface Teacher {
  id: number
  name: string
  subject: string
  email: string
  username: string
  password?: string // Optional, for creation only
}

export interface TeacherFormData {
  name: string
  subject: string
  email: string
  username: string
  password: string
}

// ==================== PROGRAMME TYPES ====================

export type ProgrammeStatus = 'upcoming' | 'ongoing' | 'completed'

export interface Programme {
  id: number
  title: string
  description: string
  status: ProgrammeStatus
  startDate: string // YYYY-MM-DD format
  endDate: string // YYYY-MM-DD format
  teachers: number[] // Array of teacher IDs
}

export interface ProgrammeFormData {
  title: string
  description: string
  status: ProgrammeStatus
  startDate: string
  endDate: string
  teachers: number[]
}

// ==================== LESSON TYPES ====================

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export interface Lesson {
  id: number
  teacherId: number
  programmeId: number
  subject: string
  day: DayOfWeek | string
  time: string // HH:MM format
  duration: string // e.g., "1 hour", "45 min"
  topic: string
}

export interface LessonFormData {
  teacherId: number
  programmeId: number
  subject: string
  day: string
  time: string
  duration: string
  topic: string
}

// ==================== MESSAGE TYPES ====================

export interface Message {
  id: number
  senderId: number
  senderName: string
  content: string
  role: UserRole
  createdAt: string // ISO datetime string
}

export interface MessageFormData {
  content: string
}

// ==================== ATTENDANCE TYPES ====================

export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface Attendance {
  id: number
  lessonId: number
  userId: number
  status: AttendanceStatus
  timestamp: string // ISO datetime string
}

export interface AttendanceFormData {
  lessonId: number
  userId: number
  status: AttendanceStatus
}

// ==================== ANALYTICS TYPES ====================

export interface Analytics {
  totalLogins: number
  totalTeachers: number
  totalProgrammes: number
  totalLessons: number
  totalUsers: number
  totalMessages: number
  totalAttendance: number
  userBreakdown: {
    admin: number
    teacher: number
  }
  programmeStatus: {
    upcoming: number
    ongoing: number
    completed: number
  }
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
  error?: string
}

export interface LoginResponse {
  id: number
  username: string
  name: string
  role: UserRole
  teacherId: number | null
  permissions: Permission[]
  token: string
}

// ==================== FORM TYPES ====================

export interface LoginFormData {
  username: string
  password: string
}

export interface RegisterFormData {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
  role?: UserRole
}

export interface UserFormData {
  name: string
  username: string
  password: string
  role: UserRole
  teacherId?: number
  permissions?: Permission[]
}

export interface UpdateUserFormData {
  name?: string
  username?: string
  password?: string
  role?: UserRole
  teacherId?: number | null
  permissions?: Permission[]
}

// ==================== SOCKET TYPES ====================

export interface SocketEvents {
  // Server to Client
  'messageAdded': (message: Message) => void
  'messageRemoved': (data: { id: number }) => void
  'teacherAdded': (teacher: Teacher) => void
  'teacherRemoved': (data: { id: number }) => void
  'teacherUpdated': (teacher: Teacher) => void
  'programmeAdded': (programme: Programme) => void
  'programmeRemoved': (data: { id: number }) => void
  'programmeUpdated': (programme: Programme) => void
  'lessonAdded': (lesson: Lesson) => void
  'lessonRemoved': (data: { id: number }) => void
  'lessonUpdated': (lesson: Lesson) => void
  'timetableCleared': (data: {}) => void
  'userAdded': (user: User) => void
  'userRemoved': (data: { id: number }) => void
  'userUpdated': (user: User) => void
  'userPermissionsUpdated': (data: { userId: number; username: string; permissions: Permission[] }) => void
  
  // Client to Server
  'join': (data: { userId: number }) => void
  'leave': (data: { userId: number }) => void
}

// ==================== NAVIGATION TYPES ====================

export type RootStackParamList = {
  Login: undefined
  Main: { user: User }
  Dashboard: undefined
  Schedule: undefined
  Messages: undefined
  Teachers: undefined
  Programmes: undefined
  Attendance: undefined
  Admin: undefined
  Analytics: undefined
  Account: undefined
  LessonForm: { mode: 'create' | 'edit'; lesson?: Lesson }
  LessonDetail: { lessonId: number }
  ProgrammeForm: { mode: 'create' | 'edit'; programme?: Programme }
  ProgrammeDetail: { programmeId: number }
  TeacherForm: { mode: 'create' | 'edit'; teacher?: Teacher }
  TeacherDetail: { teacherId: number }
  UserManagement: undefined
  PermissionManagement: { userId: number }
}

// ==================== COMPONENT PROPS TYPES ====================

export interface BaseScreenProps {
  navigation: any
  route?: any
}

export interface AuthScreenProps extends BaseScreenProps {
  user?: User
}

export interface DashboardScreenProps extends AuthScreenProps {}
export interface ScheduleScreenProps extends AuthScreenProps {}
export interface MessagesScreenProps extends AuthScreenProps {}
export interface TeachersScreenProps extends AuthScreenProps {}
export interface ProgrammesScreenProps extends AuthScreenProps {}
export interface AttendanceScreenProps extends AuthScreenProps {}
export interface AdminScreenProps extends AuthScreenProps {}
export interface AnalyticsScreenProps extends AuthScreenProps {}
export interface AccountScreenProps extends AuthScreenProps {}

// ==================== UTILITY TYPES ====================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// ==================== VALIDATION TYPES ====================

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// ==================== FILTER TYPES ====================

export interface LessonFilters {
  day?: DayOfWeek | string
  teacherId?: number
  programmeId?: number
}

export interface ProgrammeFilters {
  status?: ProgrammeStatus
  teacherId?: number
}

export interface MessageFilters {
  senderId?: number
  startDate?: string
  endDate?: string
}

// ==================== SORT TYPES ====================

export type SortDirection = 'asc' | 'desc'

export interface SortOptions<T = any> {
  field: keyof T
  direction: SortDirection
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ==================== CONSTANTS ====================

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
]

export const PROGRAMME_STATUSES: ProgrammeStatus[] = [
  'upcoming',
  'ongoing',
  'completed'
]

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  'present',
  'absent',
  'late'
]

export const USER_ROLES: UserRole[] = [
  'admin',
  'teacher'
]

export const PERMISSIONS: Permission[] = [
  'manage_users',
  'manage_teachers',
  'manage_programmes',
  'manage_lessons',
  'manage_all_lessons',
  'manage_messages',
  'view_analytics',
  'clear_timetable'
]

// ==================== HELPER FUNCTIONS ====================

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin'
}

export const isTeacher = (user: User | null): boolean => {
  return user?.role === 'teacher'
}

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.permissions?.includes(permission) || false
}

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatTime = (time: string): string => {
  // Convert HH:MM to 12-hour format
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export const getDayFromDate = (date: string): DayOfWeek => {
  const d = new Date(date)
  return DAYS_OF_WEEK[d.getDay() - 1] || 'Monday'
}

export const getDayColor = (day: string): string => {
  const colors: Record<string, string> = {
    'Monday': '#3b82f6',
    'Tuesday': '#10b981',
    'Wednesday': '#f59e0b',
    'Thursday': '#8b5cf6',
    'Friday': '#ef4444',
    'Saturday': '#06b6d4',
    'Sunday': '#ec4899'
  }
  return colors[day] || '#94a3b8'
}

export const getStatusColor = (status: ProgrammeStatus): string => {
  const colors: Record<ProgrammeStatus, string> = {
    'upcoming': '#f59e0b',
    'ongoing': '#10b981',
    'completed': '#3b82f6'
  }
  return colors[status]
}

export const getAttendanceColor = (status: AttendanceStatus): string => {
  const colors: Record<AttendanceStatus, string> = {
    'present': '#10b981',
    'absent': '#ef4444',
    'late': '#f59e0b'
  }
  return colors[status]
}

// ==================== TYPE GUARDS ====================

export const isUser = (obj: any): obj is User => {
  return obj && typeof obj === 'object' && 'id' in obj && 'role' in obj
}

export const isTeacher = (obj: any): obj is Teacher => {
  return obj && typeof obj === 'object' && 'id' in obj && 'subject' in obj
}

export const isProgramme = (obj: any): obj is Programme => {
  return obj && typeof obj === 'object' && 'id' in obj && 'status' in obj
}

export const isLesson = (obj: any): obj is Lesson => {
  return obj && typeof obj === 'object' && 'id' in obj && 'teacherId' in obj
}

export const isMessage = (obj: any): obj is Message => {
  return obj && typeof obj === 'object' && 'id' in obj && 'content' in obj
}

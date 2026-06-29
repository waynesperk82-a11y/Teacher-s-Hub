
export const validators = {
  // User validators
  username: (value: string): string | null => {
    if (!value || value.trim().length === 0) return 'Username is required'
    if (value.trim().length < 3) return 'Username must be at least 3 characters'
    if (value.trim().length > 30) return 'Username must be less than 30 characters'
    if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
      return 'Username can only contain letters, numbers, underscores, and hyphens'
    }
    return null
  },

  name: (value: string): string | null => {
    if (!value || value.trim().length === 0) return 'Name is required'
    if (value.trim().length < 2) return 'Name must be at least 2 characters'
    if (value.trim().length > 50) return 'Name must be less than 50 characters'
    if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {
      return 'Name can only contain letters, spaces, apostrophes, and hyphens'
    }
    return null
  },

  password: (value: string): string | null => {
    if (!value) return 'Password is required'
    if (value.length < 6) return 'Password must be at least 6 characters'
    if (value.length > 100) return 'Password must be less than 100 characters'
    // Optional: Password strength check
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter'
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number'
    return null
  },

  passwordConfirm: (value: string, password: string): string | null => {
    if (!value) return 'Please confirm your password'
    if (value !== password) return 'Passwords do not match'
    return null
  },

  email: (value: string): string | null => {
    if (!value || value.trim().length === 0) return 'Email is required'
    if (value.trim().length > 100) return 'Email must be less than 100 characters'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value.trim())) return 'Please enter a valid email address'
    // Additional validation for common email domains
    const domain = value.trim().split('@')[1]
    if (!domain || !domain.includes('.')) return 'Please enter a valid email address'
    return null
  },

  role: (value: string): string | null => {
    if (!value) return 'Role is required'
    const validRoles = ['admin', 'teacher', 'viewer']
    if (!validRoles.includes(value)) return `Role must be one of: ${validRoles.join(', ')}`
    return null
  },

  // Programme validators
  programmeTitle: (value: string): string | null => {
    if (!value || value.trim().length === 0) return 'Programme title is required'
    if (value.trim().length < 3) return 'Programme title must be at least 3 characters'
    if (value.trim().length > 100) return 'Programme title must be less than 100 characters'
    return null
  },

  programmeDescription: (value: string): string | null => {
    if (!value || value.trim().length === 0) return 'Programme description is required'
    if (value.trim().length < 10) return 'Programme description must be at least 10 characters'
    if (value.trim().length > 500) return 'Programme description must be less than 500 characters'
    return null
  },

  programmeStatus: (value: string): string | null => {
    if (!value) return 'Programme status is required'
    const validStatuses = ['upcoming', 'ongoing', 'completed']
    if (!validStatuses.includes(value)) return `Status must be one of: ${validStatuses.join(', ')}`
    return null
  },

  // Date and time validators
  date: (value: string): string | null => {
    if (!value) return 'Date is required'
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(value)) return 'Date must be in YYYY-MM-DD format'
    const date = new Date(value)
    if (isNaN(date.getTime())) return 'Invalid date'
    // Check if date is not in the past (optional)
    // if (date < new Date()) return 'Date cannot be in the past'
    return null
  },

  dateRange: (startDate: string, endDate: string): string | null => {
    if (!startDate || !endDate) return 'Both start and end dates are required'
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid date format'
    if (end < start) return 'End date must be after start date'
    return null
  },

  time: (value: string): string | null => {
    if (!value) return 'Time is required'
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(value)) return 'Time must be in HH:MM format (e.g., 14:30)'
    return null
  },

  duration: (value: string): string | null => {
    if (!value) return 'Duration is required'
    const durationRegex = /^\d+\s*(min|mins|minutes|hour|hours|hr|hrs)$/i
    if (!durationRegex.test(value)) return 'Duration must be in format: "60 min", "1 hour", etc.'
    // Extract number
    const num = parseInt(value)
    if (isNaN(num) || num < 1) return 'Duration must be at least 1 minute'
    if (num > 480) return 'Duration cannot exceed 8 hours'
    return null
  },

  // Lesson validators
  lessonSubject: (value: string): string | null => {
    if (!value || value.trim().length === 0) return 'Subject is required'
    if (value.trim().length < 2) return 'Subject must be at least 2 characters'
    if (value.trim().length > 50) return 'Subject must be less than 50 characters'
    return null
  },

  lessonTopic: (value: string): string | null => {
    if (!value || value.trim().length === 0) return 'Topic is required'
    if (value.trim().length < 3) return 'Topic must be at least 3 characters'
    if (value.trim().length > 200) return 'Topic must be less than 200 characters'
    return null
  },

  lessonDay: (value: string): string | null => {
    if (!value) return 'Day is required'
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    if (!validDays.includes(value)) return `Day must be one of: ${validDays.join(', ')}`
    return null
  },

  // Message validators
  messageContent: (value: string): string | null => {
    if (!value || value.trim().length === 0) return 'Message cannot be empty'
    if (value.trim().length < 3) return 'Message must be at least 3 characters'
    if (value.trim().length > 1000) return 'Message must be less than 1000 characters'
    return null
  },

  // Teacher validators
  teacherSubject: (value: string): string | null => {
    if (!value || value.trim().length === 0) return 'Subject is required'
    if (value.trim().length < 2) return 'Subject must be at least 2 characters'
    if (value.trim().length > 50) return 'Subject must be less than 50 characters'
    return null
  },

  // ID validators
  id: (value: number): string | null => {
    if (!value || value < 1) return 'Invalid ID'
    return null
  },

  // Number validators
  number: (value: any): string | null => {
    if (value === undefined || value === null) return 'Value is required'
    const num = Number(value)
    if (isNaN(num)) return 'Must be a valid number'
    return null
  },

  numberRange: (value: any, min: number, max: number): string | null => {
    const num = Number(value)
    if (isNaN(num)) return 'Must be a valid number'
    if (num < min) return `Value must be at least ${min}`
    if (num > max) return `Value must be at most ${max}`
    return null
  },

  // URL validator
  url: (value: string): string | null => {
    if (!value) return 'URL is required'
    try {
      new URL(value)
      return null
    } catch {
      return 'Invalid URL'
    }
  },

  // Phone number validator
  phone: (value: string): string | null => {
    if (!value) return 'Phone number is required'
    const phoneRegex = /^\+?[\d\s-]{10,15}$/
    if (!phoneRegex.test(value)) return 'Please enter a valid phone number'
    return null
  },

  // Required field validator
  required: (value: any): string | null => {
    if (value === undefined || value === null || value === '') return 'This field is required'
    if (typeof value === 'string' && value.trim().length === 0) return 'This field is required'
    if (Array.isArray(value) && value.length === 0) return 'At least one item is required'
    return null
  },

  // Select validator
  select: (value: any): string | null => {
    if (value === undefined || value === null || value === '') return 'Please select an option'
    return null
  },

  // File validator
  fileSize: (size: number, maxSize: number): string | null => {
    if (size > maxSize) return `File size must be less than ${maxSize / 1024 / 1024}MB`
    return null
  },

  fileType: (type: string, allowedTypes: string[]): string | null => {
    if (!allowedTypes.includes(type)) return `File type must be one of: ${allowedTypes.join(', ')}`
    return null
  },
}

// Form validation helper
export function validateForm(
  fields: Record<string, any>,
  schema: Record<string, (value: any) => string | null>
): Record<string, string> {
  const errors: Record<string, string> = {}
  
  for (const [key, validator] of Object.entries(schema)) {
    const error = validator(fields[key])
    if (error) errors[key] = error
  }
  
  return errors
}

// Async validation helper
export async function validateFormAsync(
  fields: Record<string, any>,
  schema: Record<string, (value: any) => Promise<string | null>>
): Promise<Record<string, string>> {
  const errors: Record<string, string> = {}
  
  for (const [key, validator] of Object.entries(schema)) {
    const error = await validator(fields[key])
    if (error) errors[key] = error
  }
  
  return errors
}

// Check if form is valid
export function isFormValid(errors: Record<string, string>): boolean {
  return Object.keys(errors).length === 0
}

// Get field error
export function getFieldError(errors: Record<string, string>, field: string): string | null {
  return errors[field] || null
}

// Validation schemas for different forms
export const validationSchemas = {
  // Login form
  login: {
    username: validators.username,
    password: validators.password,
  },

  // Register form
  register: {
    name: validators.name,
    username: validators.username,
    email: validators.email,
    password: validators.password,
    confirmPassword: (value: string, fields: any) => 
      validators.passwordConfirm(value, fields.password),
  },

  // Teacher form
  teacher: {
    name: validators.name,
    subject: validators.teacherSubject,
    email: validators.email,
    username: validators.username,
    password: validators.password,
  },

  // Programme form
  programme: {
    title: validators.programmeTitle,
    description: validators.programmeDescription,
    status: validators.programmeStatus,
    startDate: validators.date,
    endDate: validators.date,
  },

  // Lesson form
  lesson: {
    teacherId: validators.select,
    programmeId: validators.select,
    subject: validators.lessonSubject,
    day: validators.lessonDay,
    time: validators.time,
    duration: validators.duration,
    topic: validators.lessonTopic,
  },

  // Message form
  message: {
    content: validators.messageContent,
  },

  // User form
  user: {
    name: validators.name,
    username: validators.username,
    email: validators.email,
    password: validators.password,
    role: validators.role,
  },
}

// Custom validation for specific scenarios
export const customValidators = {
  // Check if two fields match
  match: (field1: string, field2: string, fieldName: string): string | null => {
    if (field1 !== field2) return `${fieldName} do not match`
    return null
  },

  // Check if value is unique (async - needs API call)
  unique: async (value: string, endpoint: string, field: string): Promise<string | null> => {
    try {
      const response = await fetch(`${process.env.API_URL}/api/${endpoint}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })
      const data = await response.json()
      if (data.exists) return `${field} already exists`
      return null
    } catch {
      return null // If check fails, allow it (better UX)
    }
  },

  // Check if value exists (async)
  exists: async (value: string, endpoint: string, field: string): Promise<string | null> => {
    try {
      const response = await fetch(`${process.env.API_URL}/api/${endpoint}/${value}`)
      if (!response.ok) return `${field} not found`
      return null
    } catch {
      return `Unable to verify ${field}`
    }
  },
}

// Example usage:
/*
const errors = validateForm(
  { username: 'john', password: 'Pass123' },
  validationSchemas.login
)

if (isFormValid(errors)) {
  // Submit form
} else {
  // Show errors
  const usernameError = getFieldError(errors, 'username')
}
*/

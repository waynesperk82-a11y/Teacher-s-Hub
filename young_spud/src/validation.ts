export const validators = {
  username: (value: string): string | null => {
    if (!value || value.length < 3) return 'Username must be at least 3 characters'
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, underscores, and hyphens'
    return null
  },

  password: (value: string): string | null => {
    if (!value || value.length < 6) return 'Password must be at least 6 characters'
    return null
  },

  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value || !emailRegex.test(value)) return 'Invalid email address'
    return null
  },

  programmeTitle: (value: string): string | null => {
    if (!value || value.length < 3) return 'Programme title must be at least 3 characters'
    if (value.length > 100) return 'Programme title must be less than 100 characters'
    return null
  },

  date: (value: string): string | null => {
    if (!value) return 'Date is required'
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(value)) return 'Date must be in YYYY-MM-DD format'
    const date = new Date(value)
    if (isNaN(date.getTime())) return 'Invalid date'
    return null
  },

  time: (value: string): string | null => {
    if (!value) return 'Time is required'
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(value)) return 'Time must be in HH:MM format'
    return null
  },

  messageContent: (value: string): string | null => {
    if (!value || value.trim().length === 0) return 'Message cannot be empty'
    if (value.length > 1000) return 'Message must be less than 1000 characters'
    return null
  }
}

export function validateForm(fields: Record<string, any>, schema: Record<string, (value: any) => string | null>): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const [key, validator] of Object.entries(schema)) {
    const error = validator(fields[key])
    if (error) errors[key] = error
  }
  return errors
}

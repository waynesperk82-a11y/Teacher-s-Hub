import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadTheme()
  }, [])

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app-theme')
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme)
      }
    } catch (error) {
      console.error('Error loading theme:', error)
    } finally {
      setLoaded(true)
    }
  }

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    try {
      await AsyncStorage.setItem('app-theme', newTheme)
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  if (!loaded) return null

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

export const themes = {
  dark: {
    bg: '#020617',
    bgSecondary: '#111827',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    border: '#334155',
    primary: '#38bdf8',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b'
  },
  light: {
    bg: '#f8fafc',
    bgSecondary: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#475569',
    border: '#cbd5e1',
    primary: '#0284c7',
    success: '#059669',
    error: '#dc2626',
    warning: '#d97706'
  }
}

export const getThemeColors = (theme: Theme) => themes[theme]

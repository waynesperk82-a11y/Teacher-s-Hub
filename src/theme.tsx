
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { StatusBar } from 'react-native'

export type Theme = 'dark' | 'light'
export type ThemePreference = Theme | 'system'

interface ThemeColors {
  // Background colors
  background: string
  backgroundSecondary: string
  backgroundTertiary: string
  backgroundCard: string
  backgroundInput: string
  
  // Text colors
  text: string
  textSecondary: string
  textTertiary: string
  textInverse: string
  
  // Border colors
  border: string
  borderLight: string
  borderFocus: string
  
  // Brand colors
  primary: string
  primaryLight: string
  primaryDark: string
  primaryText: string
  
  // Status colors
  success: string
  successLight: string
  successDark: string
  
  error: string
  errorLight: string
  errorDark: string
  
  warning: string
  warningLight: string
  warningDark: string
  
  info: string
  infoLight: string
  infoDark: string
  
  // UI elements
  shadow: string
  overlay: string
  skeleton: string
  skeletonShimmer: string
  
  // Tab bar
  tabBarBackground: string
  tabBarActive: string
  tabBarInactive: string
  
  // Header
  headerBackground: string
  headerText: string
  
  // Card
  cardBackground: string
  cardShadow: string
  
  // Button
  buttonPrimary: string
  buttonPrimaryText: string
  buttonSecondary: string
  buttonSecondaryText: string
  buttonDanger: string
  buttonDangerText: string
  
  // Input
  inputBackground: string
  inputText: string
  inputPlaceholder: string
  inputBorder: string
  inputFocus: string
  inputError: string
  
  // Status bar
  statusBarStyle: 'light' | 'dark'
  statusBarBackground: string
}

interface ThemeContextType {
  theme: Theme
  themePreference: ThemePreference
  colors: ThemeColors
  toggleTheme: () => void
  setThemePreference: (preference: ThemePreference) => void
  isDark: boolean
  isLight: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Dark theme colors
const darkColors: ThemeColors = {
  // Background
  background: '#020617',
  backgroundSecondary: '#0f172a',
  backgroundTertiary: '#1e293b',
  backgroundCard: '#111827',
  backgroundInput: '#0f172a',
  
  // Text
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textInverse: '#020617',
  
  // Border
  border: '#334155',
  borderLight: '#1e293b',
  borderFocus: '#38bdf8',
  
  // Brand
  primary: '#38bdf8',
  primaryLight: '#7dd3fc',
  primaryDark: '#0284c7',
  primaryText: '#020617',
  
  // Status
  success: '#10b981',
  successLight: '#34d399',
  successDark: '#059669',
  
  error: '#ef4444',
  errorLight: '#f87171',
  errorDark: '#dc2626',
  
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  
  info: '#3b82f6',
  infoLight: '#60a5fa',
  infoDark: '#2563eb',
  
  // UI
  shadow: 'rgba(0,0,0,0.5)',
  overlay: 'rgba(0,0,0,0.7)',
  skeleton: '#1e293b',
  skeletonShimmer: '#334155',
  
  // Tab bar
  tabBarBackground: '#0f172a',
  tabBarActive: '#38bdf8',
  tabBarInactive: '#94a3b8',
  
  // Header
  headerBackground: '#1f2937',
  headerText: '#f8fafc',
  
  // Card
  cardBackground: '#111827',
  cardShadow: 'rgba(0,0,0,0.3)',
  
  // Button
  buttonPrimary: '#38bdf8',
  buttonPrimaryText: '#020617',
  buttonSecondary: '#1e293b',
  buttonSecondaryText: '#e2e8f0',
  buttonDanger: '#ef4444',
  buttonDangerText: '#ffffff',
  
  // Input
  inputBackground: '#0f172a',
  inputText: '#e2e8f0',
  inputPlaceholder: '#64748b',
  inputBorder: '#1e293b',
  inputFocus: '#38bdf8',
  inputError: '#ef4444',
  
  // Status bar
  statusBarStyle: 'light',
  statusBarBackground: '#020617',
}

// Light theme colors
const lightColors: ThemeColors = {
  // Background
  background: '#f8fafc',
  backgroundSecondary: '#f1f5f9',
  backgroundTertiary: '#e2e8f0',
  backgroundCard: '#ffffff',
  backgroundInput: '#f8fafc',
  
  // Text
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  textInverse: '#f8fafc',
  
  // Border
  border: '#cbd5e1',
  borderLight: '#e2e8f0',
  borderFocus: '#0284c7',
  
  // Brand
  primary: '#0284c7',
  primaryLight: '#38bdf8',
  primaryDark: '#0369a1',
  primaryText: '#ffffff',
  
  // Status
  success: '#059669',
  successLight: '#10b981',
  successDark: '#047857',
  
  error: '#dc2626',
  errorLight: '#ef4444',
  errorDark: '#b91c1c',
  
  warning: '#d97706',
  warningLight: '#f59e0b',
  warningDark: '#b45309',
  
  info: '#2563eb',
  infoLight: '#3b82f6',
  infoDark: '#1d4ed8',
  
  // UI
  shadow: 'rgba(0,0,0,0.1)',
  overlay: 'rgba(0,0,0,0.5)',
  skeleton: '#e2e8f0',
  skeletonShimmer: '#f1f5f9',
  
  // Tab bar
  tabBarBackground: '#ffffff',
  tabBarActive: '#0284c7',
  tabBarInactive: '#94a3b8',
  
  // Header
  headerBackground: '#ffffff',
  headerText: '#0f172a',
  
  // Card
  cardBackground: '#ffffff',
  cardShadow: 'rgba(0,0,0,0.08)',
  
  // Button
  buttonPrimary: '#0284c7',
  buttonPrimaryText: '#ffffff',
  buttonSecondary: '#f1f5f9',
  buttonSecondaryText: '#0f172a',
  buttonDanger: '#dc2626',
  buttonDangerText: '#ffffff',
  
  // Input
  inputBackground: '#ffffff',
  inputText: '#0f172a',
  inputPlaceholder: '#94a3b8',
  inputBorder: '#cbd5e1',
  inputFocus: '#0284c7',
  inputError: '#dc2626',
  
  // Status bar
  statusBarStyle: 'dark',
  statusBarBackground: '#f8fafc',
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark')
  const [themePreference, setThemePreference] = useState<ThemePreference>('dark')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadThemePreference()
  }, [])

  useEffect(() => {
    // Apply theme to StatusBar
    const colors = theme === 'dark' ? darkColors : lightColors
    StatusBar.setBarStyle(colors.statusBarStyle)
    // StatusBar.setBackgroundColor(colors.statusBarBackground) // For Android
  }, [theme])

  const loadThemePreference = async () => {
    try {
      const savedPreference = await AsyncStorage.getItem('app-theme-preference')
      const savedTheme = await AsyncStorage.getItem('app-theme')
      
      if (savedPreference === 'light' || savedPreference === 'dark' || savedPreference === 'system') {
        setThemePreference(savedPreference)
      }

      // Legacy support for old theme storage
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme)
        if (!savedPreference) {
          setThemePreference(savedTheme)
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error)
    } finally {
      setLoaded(true)
    }
  }

  const applyTheme = (preference: ThemePreference) => {
    let newTheme: Theme = 'dark'
    
    if (preference === 'system') {
      // Detect system theme
      // In React Native, you'd use Appearance API
      // For now, default to dark
      newTheme = 'dark'
    } else {
      newTheme = preference
    }
    
    setTheme(newTheme)
    setThemePreference(preference)
  }

  const toggleTheme = () => {
    const newPreference = theme === 'dark' ? 'light' : 'dark'
    applyTheme(newPreference)
    AsyncStorage.setItem('app-theme-preference', newPreference)
    AsyncStorage.setItem('app-theme', newPreference)
  }

  const setThemePreferenceHandler = (preference: ThemePreference) => {
    applyTheme(preference)
    AsyncStorage.setItem('app-theme-preference', preference)
    AsyncStorage.setItem('app-theme', preference === 'system' ? 'dark' : preference)
  }

  const colors = useMemo(() => {
    return theme === 'dark' ? darkColors : lightColors
  }, [theme])

  const contextValue: ThemeContextType = {
    theme,
    themePreference,
    colors,
    toggleTheme,
    setThemePreference: setThemePreferenceHandler,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  }

  if (!loaded) return null

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

// Convenience hooks
export const useThemeColors = () => {
  const { colors } = useTheme()
  return colors
}

export const useIsDark = () => {
  const { isDark } = useTheme()
  return isDark
}

export const useIsLight = () => {
  const { isLight } = useTheme()
  return isLight
}

// Theme styles helper
export const createThemedStyles = <T extends object>(
  styles: (colors: ThemeColors) => T
): ((colors: ThemeColors) => T) => {
  return (colors: ThemeColors) => styles(colors)
}

// Dynamic styles hook
export const useThemeStyles = <T extends object>(
  styleFn: (colors: ThemeColors) => T
): T => {
  const { colors } = useTheme()
  return useMemo(() => styleFn(colors), [colors, styleFn])
}

// Export theme colors for direct use
export const getThemeColors = (theme: Theme): ThemeColors => {
  return theme === 'dark' ? darkColors : lightColors
}

// Export theme names
export const THEME_NAMES = {
  DARK: 'dark' as Theme,
  LIGHT: 'light' as Theme,
}

// Default export
export default ThemeProvider

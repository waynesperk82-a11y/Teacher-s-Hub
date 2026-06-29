// main.tsx
import React from 'react'
import { registerRootComponent } from 'expo'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as PaperProvider } from 'react-native-paper'
import { AuthProvider } from './src/contexts/AuthContext'
import { ThemeProvider } from './src/contexts/ThemeContext'
import AppNavigator from './src/navigation/AppNavigator'
import { LogBox } from 'react-native'

// Ignore specific warnings if needed
LogBox.ignoreLogs([
  'Warning: ...', // Add specific warnings to ignore
])

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PaperProvider>
          <AuthProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </PaperProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

// Register the root component
registerRootComponent(App)

export default App

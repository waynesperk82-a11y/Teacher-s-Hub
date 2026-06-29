// src/navigation/AppNavigator.tsx
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../contexts/AuthContext'
import LoginScreen from '../screens/auth/LoginScreen'
import MainTabs from './MainTabs'
import { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null // Or a loading screen
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  )
}

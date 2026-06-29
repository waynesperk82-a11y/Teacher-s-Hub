import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ActivityIndicator, View } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

// Import screens
import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import ScheduleScreen from './src/screens/ScheduleScreen'
import MessagesScreen from './src/screens/MessagesScreen'
import AdminScreen from './src/screens/AdminScreen'
import AccountScreen from './src/screens/AccountScreen'
import AttendanceScreen from './src/screens/AttendanceScreen'
import AnalyticsScreen from './src/screens/AnalyticsScreen'

// New screens
import UserManagementScreen from './src/screens/Admin/UserManagementScreen'
import PermissionManagementScreen from './src/screens/Admin/PermissionManagementScreen'
import LessonFormScreen from './src/screens/Lessons/LessonFormScreen'
import LessonDetailScreen from './src/screens/Lessons/LessonDetailScreen'
import ProgrammeFormScreen from './src/screens/Programmes/ProgrammeFormScreen'
import ProgrammeDetailScreen from './src/screens/Programmes/ProgrammeDetailScreen'
import TeacherFormScreen from './src/screens/Teachers/TeacherFormScreen'
import TeacherDetailScreen from './src/screens/Teachers/TeacherDetailScreen'
import TeachersScreen from './src/screens/Teachers/TeachersScreen'
import ProgrammesScreen from './src/screens/Programmes/ProgrammesScreen'

import { User } from './src/types'
import { AuthProvider, useAuth } from './src/contexts/AuthContext'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Main Tabs Component
function MainTabs() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#1f2937' },
        headerTintColor: '#f9fafb',
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#111827' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = ''
          
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline'
              break
            case 'Schedule':
              iconName = focused ? 'calendar' : 'calendar-outline'
              break
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
              break
            case 'Teachers':
              iconName = focused ? 'people' : 'people-outline'
              break
            case 'Programmes':
              iconName = focused ? 'book' : 'book-outline'
              break
            case 'Attendance':
              iconName = focused ? 'clipboard' : 'clipboard-outline'
              break
            case 'Admin':
              iconName = focused ? 'settings' : 'settings-outline'
              break
            case 'Analytics':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline'
              break
            case 'Account':
              iconName = focused ? 'person' : 'person-outline'
              break
            default:
              iconName = 'ellipse'
          }
          
          return <Icon name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Teachers" component={TeachersScreen} />
      <Tab.Screen name="Programmes" component={ProgrammesScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
      
      {isAdmin && (
        <>
          <Tab.Screen name="Admin" component={AdminScreen} />
          <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        </>
      )}
    </Tab.Navigator>
  )
}

// Main App Component
export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const userStr = await AsyncStorage.getItem('user')
      
      if (token && userStr) {
        setUser(JSON.parse(userStr))
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#f9fafb',
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="LessonForm" component={LessonFormScreen} options={{ title: 'Lesson Form' }} />
            <Stack.Screen name="LessonDetail" component={LessonDetailScreen} options={{ title: 'Lesson Details' }} />
            <Stack.Screen name="ProgrammeForm" component={ProgrammeFormScreen} options={{ title: 'Programme Form' }} />
            <Stack.Screen name="ProgrammeDetail" component={ProgrammeDetailScreen} options={{ title: 'Programme Details' }} />
            <Stack.Screen name="TeacherForm" component={TeacherFormScreen} options={{ title: 'Teacher Form' }} />
            <Stack.Screen name="TeacherDetail" component={TeacherDetailScreen} options={{ title: 'Teacher Details' }} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'User Management' }} />
            <Stack.Screen name="PermissionManagement" component={PermissionManagementScreen} options={{ title: 'Manage Permissions' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
                }

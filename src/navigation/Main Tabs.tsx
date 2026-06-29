// src/navigation/MainTabs.tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

// Screens
import DashboardScreen from '../screens/common/DashboardScreen'
import ScheduleScreen from '../screens/common/ScheduleScreen'
import MessagesScreen from '../screens/common/MessagesScreen'
import TeachersScreen from '../screens/common/TeachersScreen'
import ProgrammesScreen from '../screens/common/ProgrammesScreen'
import AttendanceScreen from '../screens/common/AttendanceScreen'
import AccountScreen from '../screens/common/AccountScreen'
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen'
import AnalyticsScreen from '../screens/common/AnalyticsScreen'

const Tab = createBottomTabNavigator()

export default function MainTabs() {
  const { user } = useAuth()
  const { colors } = useTheme()
  const isAdmin = user?.role === 'admin'

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.headerBackground,
        },
        headerTintColor: colors.headerText,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'circle'
          
          switch (route.name) {
            case 'Dashboard':
              iconName = 'home'
              break
            case 'Schedule':
              iconName = 'calendar'
              break
            case 'Messages':
              iconName = 'message-circle'
              break
            case 'Teachers':
              iconName = 'users'
              break
            case 'Programmes':
              iconName = 'book-open'
              break
            case 'Attendance':
              iconName = 'clipboard'
              break
            case 'Admin':
              iconName = 'settings'
              break
            case 'Analytics':
              iconName = 'bar-chart-2'
              break
            case 'Account':
              iconName = 'user'
              break
          }
          
          return <Feather name={iconName as any} size={size} color={color} />
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
          <Tab.Screen name="Admin" component={AdminDashboardScreen} />
          <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        </>
      )}
    </Tab.Navigator>
  )
}

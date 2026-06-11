import { useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import DashboardScreen from './src/screens/DashboardScreen'
import ScheduleScreen from './src/screens/ScheduleScreen'
import MessagesScreen from './src/screens/MessagesScreen'
import AdminScreen from './src/screens/AdminScreen'
import AccountScreen from './src/screens/AccountScreen'
import AttendanceScreen from './src/screens/AttendanceScreen'
import AnalyticsScreen from './src/screens/AnalyticsScreen'
import LoginScreen from './src/screens/LoginScreen'
import { User } from './src/types'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs({ user, setUser }: { user: User; setUser: (user: User) => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1f2937' },
        headerTintColor: '#f9fafb',
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#111827' }
      }}
    >
      <Tab.Screen name="Dashboard">
        {(props) => <DashboardScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Schedule">
        {(props) => <ScheduleScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Messages">
        {(props) => <MessagesScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Attendance">
        {(props) => <AttendanceScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Account">
        {(props) => <AccountScreen {...props} user={user} setUser={setUser} />}
      </Tab.Screen>
      {user.role === 'admin' && (
        <Tab.Screen name="Admin">
          {(props) => <AdminScreen {...props} user={user} />}
        </Tab.Screen>
      )}
      {user.role === 'admin' && (
        <Tab.Screen name="Analytics">
          {(props) => <AnalyticsScreen {...props} />}
        </Tab.Screen>
      )}
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#f9fafb' }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

function MainScreen({ route }: { route: { params: { user: User } } }) {
  const [currentUser, setCurrentUser] = useState<User>(route.params.user)
  return <MainTabs user={currentUser} setUser={setCurrentUser} />
}

import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../api'
import { User } from '../types'
import { useAuth } from '../contexts/AuthContext'

export default function AccountScreen({ navigation }: any) {
  const { user, logout, hasPermission, isAdmin } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [userDetails, setUserDetails] = useState<User | null>(null)

  useEffect(() => {
    loadUserDetails()
  }, [])

  const loadUserDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserDetails(data)
        setUsername(data.username)
        setName(data.name)
      }
    } catch (error) {
      console.error('Error loading user details:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadUserDetails()
    setRefreshing(false)
  }

  const updateAccount = async () => {
    if (!username.trim() && !password.trim() && !name.trim()) {
      Alert.alert('Error', 'Please enter a new username, name, or password to update.')
      return
    }

    if (password.trim() && !currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password to set a new password.')
      return
    }

    setSaving(true)
    try {
      const token = await AsyncStorage.getItem('token')
      const updateData: any = {}

      if (username.trim() && username.trim() !== user?.username) {
        updateData.username = username.trim()
      }

      if (name.trim() && name.trim() !== user?.name) {
        updateData.name = name.trim()
      }

      if (password.trim()) {
        updateData.password = password.trim()
        // In a real app, you'd send current password for verification
        // updateData.currentPassword = currentPassword.trim()
      }

      if (Object.keys(updateData).length === 0) {
        Alert.alert('Info', 'No changes to update.')
        setSaving(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const payload = await response.json()

      if (!response.ok) {
        Alert.alert('Error', payload.error || 'Unable to update account.')
        setSaving(false)
        return
      }

      // Update local user data
      const updatedUser = { ...user, ...payload }
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser))
      
      setPassword('')
      setCurrentPassword('')
      Alert.alert('Success', 'Your account information has been updated.')
      
      // Reload user details
      await loadUserDetails()
    } catch (error) {
      Alert.alert('Error', 'Failed to update account. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout()
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
          }
        }
      ]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token')
              const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              })

              if (response.ok) {
                await logout()
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
                Alert.alert('Success', 'Account deleted successfully')
              } else {
                const result = await response.json()
                Alert.alert('Error', result.error || 'Failed to delete account')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account')
            }
          }
        }
      ]
    )
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading account...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userRole}>
          {user.role === 'admin' ? ' Administrator' : ' Teacher'}
        </Text>
        <Text style={styles.userUsername}>@{user.username}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Update Profile</Text>
        
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password to change"
          placeholderTextColor="#94a3b8"
          secureTextEntry
        />

        <Text style={styles.label}>New Password (optional)</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={updateAccount}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#020617" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>User ID</Text>
          <Text style={styles.detailValue}>#{user.id}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role</Text>
          <Text style={[styles.detailValue, styles.roleValue]}>
            {user.role === 'admin' ? 'Administrator' : 'Teacher'}
          </Text>
        </View>

        {user.role === 'teacher' && user.teacherId && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Teacher ID</Text>
            <Text style={styles.detailValue}>#{user.teacherId}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Permissions</Text>
          <Text style={styles.detailValue}>
            {user.permissions && user.permissions.length > 0
              ? `${user.permissions.length} permissions`
              : user.role === 'admin' ? 'Full Access' : 'No special permissions'}
          </Text>
        </View>

        {user.permissions && user.permissions.length > 0 && (
          <View style={styles.permissionsContainer}>
            {user.permissions.map((perm, index) => (
              <View key={index} style={styles.permissionBadge}>
                <Text style={styles.permissionText}>{perm}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {isAdmin && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Controls</Text>
          <TouchableOpacity
            style={[styles.adminButton, styles.adminUserButton]}
            onPress={() => navigation.navigate('UserManagement')}
          >
            <Text style={styles.adminButtonText}>👥 Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminButton, styles.adminPermissionButton]}
            onPress={() => navigation.navigate('PermissionManagement', { userId: user.id })}
          >
            <Text style={styles.adminButtonText}> Manage Permissions</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Danger Zone</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}> Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>School Management System v1.0.0</Text>
        <Text style={styles.footerSubtext}>Logged in as {user.username}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#111827',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#020617',
  },
  userName: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userRole: {
    color: '#38bdf8',
    fontSize: 14,
    marginTop: 4,
  },
  userUsername: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#020617',
    fontWeight: '700',
    fontSize: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  detailValue: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  roleValue: {
    color: '#38bdf8',
  },
  permissionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  permissionBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  permissionText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500',
  },
  adminButton: {
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  adminUserButton: {
    backgroundColor: '#3b82f6',
  },
  adminPermissionButton: {
    backgroundColor: '#8b5cf6',
  },
  adminButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  footerSubtext: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
  },
})

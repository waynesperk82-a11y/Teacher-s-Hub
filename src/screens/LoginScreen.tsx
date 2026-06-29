import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../api'
import { useAuth } from '../contexts/AuthContext'

const AccountScreen = ({ navigation }: any) => {
  const { user, logout, isAdmin } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState(user?.name || '')
  const [editUsername, setEditUsername] = useState(user?.username || '')
  const [editPassword, setEditPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')

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

  const handleUpdateProfile = async () => {
    if (!editName.trim() && !editUsername.trim() && !editPassword.trim()) {
      Alert.alert('Error', 'Please enter at least one field to update.')
      return
    }

    if (editPassword.trim() && !currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password to set a new password.')
      return
    }

    setLoading(true)
    try {
      const token = await AsyncStorage.getItem('token')
      const updateData: any = {}

      if (editName.trim() && editName.trim() !== user?.name) {
        updateData.name = editName.trim()
      }
      if (editUsername.trim() && editUsername.trim() !== user?.username) {
        updateData.username = editUsername.trim()
      }
      if (editPassword.trim()) {
        updateData.password = editPassword.trim()
      }

      if (Object.keys(updateData).length === 0) {
        Alert.alert('Info', 'No changes to update.')
        setLoading(false)
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
        Alert.alert('Error', payload.error || 'Unable to update profile.')
        setLoading(false)
        return
      }

      // Update local user data
      const updatedUser = { ...user, ...payload }
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser))
      
      setEditPassword('')
      setCurrentPassword('')
      setShowEditModal(false)
      Alert.alert('Success', 'Profile updated successfully!')
      
      // Reload the screen
      navigation.replace('Account')
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
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

  const MenuItem = ({ icon, title, onPress, color = '#38bdf8', badge }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={20} color="#94a3b8" />
    </TouchableOpacity>
  )

  const StatItem = ({ icon, label, value, color }: any) => (
    <View style={styles.statItem}>
      <Feather name={icon} size={16} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )

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
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true)
            setTimeout(() => setRefreshing(false), 1000)
          }}
          tintColor="#38bdf8"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={styles.roleContainer}>
          <Feather name={user?.role === 'admin' ? 'shield' : 'user-check'} size={14} color="#38bdf8" />
          <Text style={styles.userRole}>
            {user?.role === 'admin' ? 'Administrator' : 'Teacher'}
          </Text>
        </View>
        <Text style={styles.userUsername}>@{user?.username}</Text>
        
        <View style={styles.statsRow}>
          <StatItem
            icon="users"
            label="Role"
            value={user?.role === 'admin' ? 'Admin' : 'Teacher'}
            color="#38bdf8"
          />
          <StatItem
            icon="hash"
            label="User ID"
            value={`#${user?.id}`}
            color="#8b5cf6"
          />
          <StatItem
            icon="key"
            label="Permissions"
            value={user?.permissions?.length || 0}
            color="#10b981"
          />
        </View>
      </View>

      {/* Menu */}
      <View style={styles.card}>
        <MenuItem
          icon="edit-2"
          title="Edit Profile"
          color="#38bdf8"
          onPress={() => {
            setEditName(user?.name || '')
            setEditUsername(user?.username || '')
            setEditPassword('')
            setCurrentPassword('')
            setShowEditModal(true)
          }}
        />

        <View style={styles.divider} />

        <MenuItem
          icon="shield"
          title="My Permissions"
          color="#8b5cf6"
          badge={user?.permissions?.length || 0}
          onPress={() => {
            const perms = user?.permissions?.length 
              ? user?.permissions?.join(', ') 
              : 'No special permissions'
            Alert.alert('My Permissions', perms)
          }}
        />

        <View style={styles.divider} />

        <MenuItem
          icon="lock"
          title="Security"
          color="#f59e0b"
          onPress={() => Alert.alert('Security', 'Your account is secure with authentication.')}
        />

        {isAdmin && (
          <>
            <View style={styles.divider} />
            <MenuItem
              icon="users"
              title="Manage Users"
              color="#f59e0b"
              onPress={() => navigation.navigate('UserManagement')}
            />
            <MenuItem
              icon="bar-chart-2"
              title="Analytics"
              color="#10b981"
              onPress={() => navigation.navigate('Analytics')}
            />
          </>
        )}

        <View style={styles.divider} />

        <MenuItem
          icon="info"
          title="About"
          color="#94a3b8"
          onPress={() => Alert.alert(
            'About',
            'School Management System v1.0.0\n\nBuilt with React Native & Expo\n© 2024 All rights reserved.'
          )}
        />
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerCard}>
        <View style={styles.dangerHeader}>
          <Feather name="alert-triangle" size={16} color="#ef4444" />
          <Text style={styles.dangerTitle}>Danger Zone</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Feather name="trash-2" size={20} color="#ef4444" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Feather name="clock" size={12} color="#64748b" />
        <Text style={styles.footerText}>
          Last login: {new Date().toLocaleString()}
        </Text>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Feather name="x" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your full name"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.modalLabel}>Username</Text>
              <TextInput
                style={styles.modalInput}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Enter username"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
              />

              <Text style={styles.modalLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#64748b"
                secureTextEntry
              />

              <Text style={styles.modalLabel}>New Password (optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={editPassword}
                onChangeText={setEditPassword}
                placeholder="Enter new password"
                placeholderTextColor="#64748b"
                secureTextEntry
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSaveButton]}
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#020617" />
                  ) : (
                    <>
                      <Feather name="save" size={16} color="#020617" />
                      <Text style={styles.modalSaveText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
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
    padding: 24,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#111827',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#020617',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#38bdf8',
  },
  userUsername: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#020617',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
  },
  dangerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dangerTitle: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 8,
    marginBottom: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 8,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  footerText: {
    color: '#64748b',
    fontSize: 11,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalBody: {
    gap: 8,
  },
  modalLabel: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modalCancelButton: {
    backgroundColor: '#1f2937',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: '#38bdf8',
  },
  modalSaveText: {
    color: '#020617',
    fontWeight: '600',
  },
})

export default AccountScreen

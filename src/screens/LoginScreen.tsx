import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { Card, IconButton, Divider } from 'react-native-paper'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../contexts/AuthContext'

const AccountScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth()

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

  const MenuItem = ({ icon, title, onPress, color = '#38bdf8' }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <IconButton icon={icon} size={24} color={color} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <IconButton icon="chevron-right" size={24} color="#94a3b8" />
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>
          {user?.role === 'admin' ? 'Administrator' : 'Teacher'}
        </Text>
        <Text style={styles.userUsername}>@{user?.username}</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <MenuItem
            icon="account-edit"
            title="Edit Profile"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
          />
          <Divider style={styles.divider} />
          <MenuItem
            icon="shield-account"
            title="My Permissions"
            onPress={() => {
              const perms = user?.permissions?.join(', ') || 'No special permissions'
              Alert.alert('My Permissions', perms)
            }}
          />
          {user?.role === 'admin' && (
            <>
              <Divider style={styles.divider} />
              <MenuItem
                icon="account-group"
                title="Manage Users"
                color="#f59e0b"
                onPress={() => navigation.navigate('UserManagement')}
              />
            </>
          )}
          <Divider style={styles.divider} />
          <MenuItem
            icon="information"
            title="About"
            color="#8b5cf6"
            onPress={() => Alert.alert('About', 'School Management System v1.0.0')}
          />
        </Card.Content>
      </Card>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <IconButton icon="logout" size={24} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>School Management System v1.0.0</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
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
    color: '#0f172a',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  userRole: {
    fontSize: 14,
    color: '#38bdf8',
    marginTop: 4,
  },
  userUsername: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  card: {
    margin: 16,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuIcon: {
    borderRadius: 8,
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#f9fafb',
  },
  divider: {
    backgroundColor: '#374151',
    marginVertical: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
  },
})

export default AccountScreen

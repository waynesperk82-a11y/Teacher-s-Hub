import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { API_BASE_URL } from '../api'
import { User } from '../types'

export default function AccountScreen({ user, setUser }: { user: User; setUser: (user: User) => void }) {
  const [username, setUsername] = useState(user.username)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const updateAccount = async () => {
    if (!username.trim() && !password.trim()) {
      Alert.alert('Error', 'Please enter a new username or password to update.')
      return
    }
    setSaving(true)
    const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: password.trim() })
    })
    const payload = await response.json()
    setSaving(false)
    if (!response.ok) {
      Alert.alert('Error', payload.error || 'Unable to update account.')
      return
    }
    setPassword('')
    setUser(payload as User)
    Alert.alert('Saved', 'Your account information has been updated.')
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>My Account</Text>
      <Text style={styles.subtitle}>Update your username or password after login.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Text style={styles.label}>New password</Text>
        <TextInput style={styles.input} value={password} secureTextEntry onChangeText={setPassword} />
        <TouchableOpacity style={styles.button} onPress={updateAccount} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account details</Text>
        <Text style={styles.meta}>Name: {user.name}</Text>
        <Text style={styles.meta}>Role: {user.role}</Text>
        {user.role === 'teacher' && <Text style={styles.meta}>Teacher ID: {user.teacherId}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617', padding: 20 },
  title: { color: '#e2e8f0', fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#94a3b8', fontSize: 15, marginBottom: 20 },
  card: { backgroundColor: '#111827', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  label: { color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', color: '#e2e8f0', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  button: { backgroundColor: '#38bdf8', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#020617', fontWeight: '700' },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  meta: { color: '#94a3b8', marginBottom: 8 }
})

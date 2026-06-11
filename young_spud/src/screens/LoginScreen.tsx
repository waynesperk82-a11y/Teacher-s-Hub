import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { API_BASE_URL } from '../api'
import { User } from '../types'

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const signIn = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Login failed', 'Please enter both username and password.')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password })
      })
      const payload = await response.json()
      setLoading(false)

      if (!response.ok) {
        Alert.alert('Login failed', payload.error || 'Invalid username or password.')
        return
      }

      navigation.reset({ index: 0, routes: [{ name: 'Main', params: { user: payload as User } }] })
    } catch (error) {
      setLoading(false)
      Alert.alert('Login failed', 'Unable to connect to the server.')
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Login as admin or teacher to access Teacher's Hub.</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#94a3b8"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={signIn} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', padding: 20 },
  title: { color: '#e2e8f0', fontSize: 36, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: '#94a3b8', fontSize: 16, marginBottom: 28 },
  card: { backgroundColor: '#111827', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: '#334155' },
  input: { backgroundColor: '#0f172a', color: '#e2e8f0', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#1e293b' },
  button: { backgroundColor: '#38bdf8', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  buttonText: { fontWeight: '700', color: '#020617' }
})

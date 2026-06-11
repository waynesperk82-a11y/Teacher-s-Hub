import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { API_BASE_URL } from '../api'
import { User, Message } from '../types'

export default function MessagesScreen({ user }: { user: User }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')

  const loadMessages = async () => {
    const response = await fetch(`${API_BASE_URL}/api/messages`)
    const data = await response.json()
    setMessages(data)
  }

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [])

  const sendMessage = async () => {
    if (!messageText.trim()) {
      Alert.alert('Error', 'Please enter a message.')
      return
    }
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: user.id, senderName: user.name, content: messageText.trim() })
    })
    const payload = await response.json()
    if (!response.ok) {
      Alert.alert('Error', payload.error || 'Unable to send message.')
      return
    }
    setMessageText('')
    loadMessages()
    Alert.alert('Sent', 'Your message was delivered to admin.')
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>Send updates, complaints, or suggestions to the admin.</Text>

      <View style={styles.card}>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your message here..."
          placeholderTextColor="#94a3b8"
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={sendMessage}>
          <Text style={styles.buttonText}>Send to Admin</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent messages</Text>
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>No messages yet.</Text>
        ) : (
          messages.map((message) => (
            <View key={message.id} style={styles.messageRow}>
              <Text style={styles.messageAuthor}>{message.senderName}</Text>
              <Text style={styles.messageText}>{message.content}</Text>
              <Text style={styles.meta}>{new Date(message.createdAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#020617' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: '#e2e8f0', fontSize: 32, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#94a3b8', fontSize: 16, marginBottom: 20 },
  card: { backgroundColor: '#111827', borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  input: { backgroundColor: '#0f172a', color: '#e2e8f0', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1e293b', marginBottom: 12 },
  button: { backgroundColor: '#38bdf8', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#020617', fontWeight: '700' },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  emptyText: { color: '#64748b', fontSize: 14 },
  messageRow: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  messageAuthor: { color: '#38bdf8', fontWeight: '700' },
  messageText: { color: '#e2e8f0', marginTop: 6 },
  meta: { color: '#94a3b8', marginTop: 8, fontSize: 12 }
})

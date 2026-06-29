import { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { API_BASE_URL } from '../api'
import { User, Message } from '../types'
import { useAuth } from '../contexts/AuthContext'
import io from 'socket.io-client'

const SOCKET_URL = API_BASE_URL.replace('/api', '')

export default function MessagesScreen() {
  const { user, hasPermission } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [socket, setSocket] = useState<any>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    })
    setSocket(newSocket)

    // Listen for new messages
    newSocket.on('messageAdded', (newMessage: Message) => {
      setMessages(prev => [newMessage, ...prev])
      // Scroll to top to show new message
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    })

    // Load initial messages
    loadMessages()

    // Cleanup on unmount
    return () => {
      newSocket.disconnect()
    }
  }, [])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/messages`)
      if (!response.ok) throw new Error('Failed to load messages')
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error loading messages:', error)
      Alert.alert('Error', 'Failed to load messages')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadMessages()
  }

  const sendMessage = async () => {
    if (!messageText.trim()) {
      Alert.alert('Error', 'Please enter a message.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id,
          senderName: user?.name,
          content: messageText.trim()
        })
      })

      const payload = await response.json()
      
      if (!response.ok) {
        Alert.alert('Error', payload.error || 'Unable to send message.')
        return
      }

      setMessageText('')
      Alert.alert('Sent', 'Your message was sent successfully!')
    } catch (error) {
      console.error('Error sending message:', error)
      Alert.alert('Error', 'Failed to send message. Please try again.')
    }
  }

  const deleteMessage = async (messageId: number) => {
    if (!hasPermission('manage_messages') && user?.role !== 'admin') {
      Alert.alert('Permission Denied', 'You do not have permission to delete messages')
      return
    }

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
                }
              })
              
              if (!response.ok) throw new Error('Failed to delete message')
              
              setMessages(prev => prev.filter(m => m.id !== messageId))
              Alert.alert('Success', 'Message deleted successfully')
            } catch (error) {
              console.error('Error deleting message:', error)
              Alert.alert('Error', 'Failed to delete message')
            }
          }
        }
      ]
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const isOwnMessage = (message: Message) => {
    return message.senderId === user?.id
  }

  const getMessageStyle = (message: Message) => {
    if (isOwnMessage(message)) {
      return styles.ownMessage
    }
    if (message.role === 'admin') {
      return styles.adminMessage
    }
    return styles.otherMessage
  }

  const renderMessage = (message: Message) => {
    const isOwn = isOwnMessage(message)
    const isAdmin = message.role === 'admin'
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageWrapper,
          isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper,
        ]}
      >
        <View style={[styles.messageBubble, getMessageStyle(message)]}>
          <View style={styles.messageHeader}>
            <Text style={[
              styles.senderName,
              isAdmin && styles.adminName,
              isOwn && styles.ownName
            ]}>
              {message.senderName}
              {isAdmin && ' 👑'}
            </Text>
            <Text style={styles.messageTime}>{formatTime(message.createdAt)}</Text>
          </View>
          
          <Text style={[
            styles.messageContent,
            isOwn && styles.ownMessageContent
          ]}>
            {message.content}
          </Text>
          
          {(user?.role === 'admin' || hasPermission('manage_messages')) && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteMessage(message.id)}
            >
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isAdmin && !isOwn && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Messages</Text>
        <Text style={styles.headerSubtitle}>
          {messages.length} messages • {new Date().toLocaleDateString()}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          inverted
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!messageText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingTop: 8,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  ownMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    position: 'relative',
  },
  ownMessage: {
    backgroundColor: '#38bdf8',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: 4,
  },
  adminMessage: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  adminName: {
    color: '#f59e0b',
  },
  ownName: {
    color: '#0f172a',
  },
  messageTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 8,
  },
  messageContent: {
    fontSize: 15,
    color: '#f9fafb',
    lineHeight: 20,
  },
  ownMessageContent: {
    color: '#0f172a',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  deleteText: {
    fontSize: 14,
  },
  adminBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 8,
  },
  adminBadgeText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: '#374151',
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
})

// Add AsyncStorage import at the top
import AsyncStorage from '@react-native-async-storage/async-storage'

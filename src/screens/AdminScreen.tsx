import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../api'
import { User, Programme, Teacher, Lesson, Message } from '../types'
import { useAuth } from '../contexts/AuthContext'

const emptyTeacher = { name: '', subject: '', email: '', username: '', password: '' }
const emptyProgramme = {
  title: '',
  description: '',
  status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed',
  startDate: '',
  endDate: '',
  teachers: [] as number[]
}
const emptyLesson = {
  teacherId: 0,
  programmeId: 0,
  subject: '',
  day: '',
  time: '',
  duration: '',
  topic: ''
}

export default function AdminScreen() {
  const { user, hasPermission, isAdmin } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'teacher' as 'admin' | 'teacher',
    permissions: [] as string[]
  })

  const [teacherForm, setTeacherForm] = useState(emptyTeacher)
  const [programmeForm, setProgrammeForm] = useState(emptyProgramme)
  const [lessonForm, setLessonForm] = useState(emptyLesson)
  const [editingProgrammeId, setEditingProgrammeId] = useState<number | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)

  // Available permissions
  const AVAILABLE_PERMISSIONS = {
    'manage_users': 'Manage Users',
    'manage_teachers': 'Manage Teachers',
    'manage_programmes': 'Manage Programmes',
    'manage_lessons': 'Manage Lessons',
    'manage_all_lessons': 'Delete Any Lesson',
    'manage_messages': 'Delete Messages',
    'view_analytics': 'View Analytics',
    'clear_timetable': 'Clear Timetable'
  }

  const loadDashboard = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [teacherData, programmeData, lessonData, messageData, userData] = await Promise.all([
        fetch(`${API_BASE_URL}/api/teachers`, { headers }).then((res) => res.json()),
        fetch(`${API_BASE_URL}/api/programmes`, { headers }).then((res) => res.json()),
        fetch(`${API_BASE_URL}/api/lessons`, { headers }).then((res) => res.json()),
        fetch(`${API_BASE_URL}/api/messages`, { headers }).then((res) => res.json()),
        fetch(`${API_BASE_URL}/api/users`, { headers }).then((res) => res.json())
      ])

      setTeachers(teacherData)
      setProgrammes(programmeData)
      setLessons(lessonData)
      setMessages(messageData)
      setUsers(userData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      Alert.alert('Error', 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboard()
  }

  // ==================== USER MANAGEMENT ====================

  const createUser = async () => {
    if (!userForm.name || !userForm.username || !userForm.password) {
      Alert.alert('Error', 'Please fill in all user fields')
      return
    }

    try {
      const token = await AsyncStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      })

      const result = await response.json()
      if (!response.ok) {
        Alert.alert('Error', result.error || 'Failed to create user')
        return
      }

      setUserForm({ name: '', username: '', password: '', role: 'teacher', permissions: [] })
      setShowUserModal(false)
      loadDashboard()
      Alert.alert('Success', `User '${result.name}' created successfully`)
    } catch (error) {
      Alert.alert('Error', 'Failed to create user')
    }
  }

  const deleteUser = async (userId: number, userName: string) => {
    if (userId === user?.id) {
      Alert.alert('Error', 'You cannot delete your own account')
      return
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token')
              const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              })

              if (response.ok) {
                loadDashboard()
                Alert.alert('Success', 'User deleted successfully')
              } else {
                const result = await response.json()
                Alert.alert('Error', result.error || 'Failed to delete user')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user')
            }
          }
        }
      ]
    )
  }

  // ==================== TEACHER MANAGEMENT ====================

  const saveTeacher = async () => {
    if (!teacherForm.name || !teacherForm.subject || !teacherForm.email || !teacherForm.username || !teacherForm.password) {
      Alert.alert('Error', 'Please fill in all teacher fields.')
      return
    }

    try {
      const token = await AsyncStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/teachers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teacherForm)
      })

      const result = await response.json()
      if (!response.ok) {
        Alert.alert('Error', result.error || 'Unable to add teacher.')
        return
      }

      setTeacherForm(emptyTeacher)
      loadDashboard()
      Alert.alert('Success', `Teacher '${result.name}' added.`)
    } catch (error) {
      Alert.alert('Error', 'Failed to add teacher')
    }
  }

  const deleteTeacher = async (id: number, name: string) => {
    Alert.alert(
      'Delete Teacher',
      `Are you sure you want to delete ${name}? This will also remove the associated user account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token')
              const response = await fetch(`${API_BASE_URL}/api/teachers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              })

              if (response.ok) {
                loadDashboard()
                Alert.alert('Success', 'Teacher removed.')
              } else {
                const result = await response.json()
                Alert.alert('Error', result.error || 'Failed to delete teacher')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete teacher')
            }
          }
        }
      ]
    )
  }

  // ==================== PROGRAMME MANAGEMENT ====================

  const saveProgramme = async () => {
    if (!programmeForm.title || !programmeForm.description || !programmeForm.startDate || !programmeForm.endDate) {
      Alert.alert('Error', 'Please fill in all programme fields.')
      return
    }

    try {
      const token = await AsyncStorage.getItem('token')
      const method = editingProgrammeId ? 'PUT' : 'POST'
      const url = editingProgrammeId
        ? `${API_BASE_URL}/api/programmes/${editingProgrammeId}`
        : `${API_BASE_URL}/api/programmes`

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(programmeForm)
      })

      const item = await response.json()
      if (!response.ok) {
        Alert.alert('Error', item.error || 'Unable to save programme.')
        return
      }

      setProgrammeForm(emptyProgramme)
      setEditingProgrammeId(null)
      loadDashboard()
      Alert.alert('Success', editingProgrammeId ? 'Programme updated.' : 'Programme added.')
    } catch (error) {
      Alert.alert('Error', 'Failed to save programme')
    }
  }

  const deleteProgramme = async (id: number, title: string) => {
    Alert.alert(
      'Delete Programme',
      `Are you sure you want to delete "${title}"? All associated lessons will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token')
              const response = await fetch(`${API_BASE_URL}/api/programmes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              })

              if (response.ok) {
                loadDashboard()
                Alert.alert('Success', 'Programme removed.')
              } else {
                const result = await response.json()
                Alert.alert('Error', result.error || 'Failed to delete programme')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete programme')
            }
          }
        }
      ]
    )
  }

  const editProgramme = (programme: Programme) => {
    setEditingProgrammeId(programme.id)
    setProgrammeForm({
      title: programme.title,
      description: programme.description,
      status: programme.status,
      startDate: programme.startDate,
      endDate: programme.endDate,
      teachers: programme.teachers
    })
  }

  // ==================== LESSON MANAGEMENT ====================

  const saveLesson = async () => {
    if (!lessonForm.teacherId || !lessonForm.programmeId || !lessonForm.subject || !lessonForm.day || !lessonForm.time || !lessonForm.duration || !lessonForm.topic) {
      Alert.alert('Error', 'Please fill in all lesson fields.')
      return
    }

    try {
      const token = await AsyncStorage.getItem('token')
      const method = editingLessonId ? 'PUT' : 'POST'
      const url = editingLessonId
        ? `${API_BASE_URL}/api/lessons/${editingLessonId}`
        : `${API_BASE_URL}/api/lessons`

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lessonForm)
      })

      const item = await response.json()
      if (!response.ok) {
        Alert.alert('Error', item.error || 'Unable to save lesson.')
        return
      }

      setLessonForm(emptyLesson)
      setEditingLessonId(null)
      loadDashboard()
      Alert.alert('Success', editingLessonId ? 'Lesson updated.' : 'Lesson added.')
    } catch (error) {
      Alert.alert('Error', 'Failed to save lesson')
    }
  }

  const deleteLesson = async (id: number) => {
    Alert.alert(
      'Delete Lesson',
      'Remove this lesson from the schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token')
              const response = await fetch(`${API_BASE_URL}/api/lessons/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              })

              if (response.ok) {
                loadDashboard()
                Alert.alert('Success', 'Lesson removed.')
              } else {
                const result = await response.json()
                Alert.alert('Error', result.error || 'Failed to delete lesson')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete lesson')
            }
          }
        }
      ]
    )
  }

  const editLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id)
    setLessonForm({
      teacherId: lesson.teacherId,
      programmeId: lesson.programmeId,
      subject: lesson.subject,
      day: lesson.day,
      time: lesson.time,
      duration: lesson.duration,
      topic: lesson.topic
    })
  }

  // ==================== TIMETABLE OPERATIONS ====================

  const clearTimetable = async () => {
    if (!hasPermission('clear_timetable') && !isAdmin) {
      Alert.alert('Permission Denied', 'You do not have permission to clear the timetable')
      return
    }

    Alert.alert(
      'Clear Timetable',
      'Remove all lessons? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token')
              const response = await fetch(`${API_BASE_URL}/api/timetable/clear`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              })

              if (response.ok) {
                loadDashboard()
                Alert.alert('Success', 'All lessons cleared.')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to clear timetable')
            }
          }
        }
      ]
    )
  }

  const programmesByStatus = useMemo(
    () => ({
      upcoming: programmes.filter((item) => item.status === 'upcoming'),
      ongoing: programmes.filter((item) => item.status === 'ongoing'),
      completed: programmes.filter((item) => item.status === 'completed')
    }),
    [programmes]
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>
        Live control for teachers, programmes, lessons, and support requests.
      </Text>

      {/* User Management Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>User Management</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{users.filter(u => u.role === 'admin').length}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{users.filter(u => u.role === 'teacher').length}</Text>
            <Text style={styles.statLabel}>Teachers</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => setShowUserModal(true)}>
          <Text style={styles.buttonText}>Create New User</Text>
        </TouchableOpacity>
        {users.length > 0 && (
          <View style={styles.userList}>
            {users.map((u) => (
              <View key={u.id} style={styles.userRow}>
                <View>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userMeta}>@{u.username} • {u.role}</Text>
                </View>
                {u.id !== user?.id && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteUser(u.id, u.name)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Add Teacher Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Teacher Account</Text>
        <TextInput
          placeholder="Name"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={teacherForm.name}
          onChangeText={(text) => setTeacherForm((prev) => ({ ...prev, name: text }))}
        />
        <TextInput
          placeholder="Subject"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={teacherForm.subject}
          onChangeText={(text) => setTeacherForm((prev) => ({ ...prev, subject: text }))}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={teacherForm.email}
          keyboardType="email-address"
          onChangeText={(text) => setTeacherForm((prev) => ({ ...prev, email: text }))}
        />
        <TextInput
          placeholder="Username"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={teacherForm.username}
          onChangeText={(text) => setTeacherForm((prev) => ({ ...prev, username: text }))}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={teacherForm.password}
          secureTextEntry
          onChangeText={(text) => setTeacherForm((prev) => ({ ...prev, password: text }))}
        />
        <TouchableOpacity style={styles.button} onPress={saveTeacher}>
          <Text style={styles.buttonText}>Save Teacher</Text>
        </TouchableOpacity>
      </View>

      {/* Programme Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingProgrammeId ? 'Edit Programme' : 'Create Programme'}</Text>
        <TextInput
          placeholder="Title"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={programmeForm.title}
          onChangeText={(text) => setProgrammeForm((prev) => ({ ...prev, title: text }))}
        />
        <TextInput
          placeholder="Description"
          placeholderTextColor="#94a3b8"
          style={[styles.input, styles.textArea]}
          value={programmeForm.description}
          multiline
          onChangeText={(text) => setProgrammeForm((prev) => ({ ...prev, description: text }))}
        />
        <TextInput
          placeholder="Start date (YYYY-MM-DD)"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={programmeForm.startDate}
          onChangeText={(text) => setProgrammeForm((prev) => ({ ...prev, startDate: text }))}
        />
        <TextInput
          placeholder="End date (YYYY-MM-DD)"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={programmeForm.endDate}
          onChangeText={(text) => setProgrammeForm((prev) => ({ ...prev, endDate: text }))}
        />
        <View style={styles.statusRow}>
          {(['upcoming', 'ongoing', 'completed'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusButton, programmeForm.status === status && styles.statusButtonActive]}
              onPress={() => setProgrammeForm((prev) => ({ ...prev, status }))}
            >
              <Text style={[styles.statusText, programmeForm.status === status && styles.statusTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={saveProgramme}>
          <Text style={styles.buttonText}>{editingProgrammeId ? 'Update Programme' : 'Add Programme'}</Text>
        </TouchableOpacity>
      </View>

      {/* Lesson Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingLessonId ? 'Edit Lesson' : 'Add Lesson'}</Text>
        <TextInput
          placeholder="Teacher ID"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          keyboardType="number-pad"
          value={lessonForm.teacherId ? lessonForm.teacherId.toString() : ''}
          onChangeText={(text) => setLessonForm((prev) => ({ ...prev, teacherId: Number(text) }))}
        />
        <TextInput
          placeholder="Programme ID"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          keyboardType="number-pad"
          value={lessonForm.programmeId ? lessonForm.programmeId.toString() : ''}
          onChangeText={(text) => setLessonForm((prev) => ({ ...prev, programmeId: Number(text) }))}
        />
        <TextInput
          placeholder="Subject"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={lessonForm.subject}
          onChangeText={(text) => setLessonForm((prev) => ({ ...prev, subject: text }))}
        />
        <TextInput
          placeholder="Day (Monday, Tuesday, etc.)"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={lessonForm.day}
          onChangeText={(text) => setLessonForm((prev) => ({ ...prev, day: text }))}
        />
        <TextInput
          placeholder="Time (e.g., 09:00)"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={lessonForm.time}
          onChangeText={(text) => setLessonForm((prev) => ({ ...prev, time: text }))}
        />
        <TextInput
          placeholder="Duration (e.g., 1 hour)"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={lessonForm.duration}
          onChangeText={(text) => setLessonForm((prev) => ({ ...prev, duration: text }))}
        />
        <TextInput
          placeholder="Topic"
          placeholderTextColor="#94a3b8"
          style={[styles.input, styles.textArea]}
          value={lessonForm.topic}
          multiline
          onChangeText={(text) => setLessonForm((prev) => ({ ...prev, topic: text }))}
        />
        <TouchableOpacity style={styles.button} onPress={saveLesson}>
          <Text style={styles.buttonText}>{editingLessonId ? 'Update Lesson' : 'Add Lesson'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxNumber}>{teachers.length}</Text>
            <Text style={styles.statBoxLabel}>Teachers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxNumber}>{programmes.length}</Text>
            <Text style={styles.statBoxLabel}>Programmes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxNumber}>{lessons.length}</Text>
            <Text style={styles.statBoxLabel}>Lessons</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxNumber}>{messages.length}</Text>
            <Text style={styles.statBoxLabel}>Messages</Text>
          </View>
        </View>
      </View>

      {/* Manage Teachers */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manage Teachers</Text>
        {teachers.length === 0 ? (
          <Text style={styles.meta}>No teachers yet.</Text>
        ) : (
          teachers.map((teacher) => (
            <View key={teacher.id} style={styles.manageRow}>
              <View>
                <Text style={styles.manageName}>{teacher.name}</Text>
                <Text style={styles.meta}>{teacher.subject} • @{teacher.username}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTeacher(teacher.id, teacher.name)}
              >
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Manage Lessons */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manage Lessons</Text>
        {lessons.length === 0 ? (
          <Text style={styles.meta}>No lessons yet.</Text>
        ) : (
          lessons.map((lesson) => (
            <View key={lesson.id} style={styles.manageRow}>
              <View>
                <Text style={styles.manageName}>{lesson.subject}</Text>
                <Text style={styles.meta}>{lesson.day} • {lesson.time} • {lesson.topic}</Text>
              </View>
              <View style={styles.manageActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editLesson(lesson)}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteLesson(lesson.id)}
                >
                  <Text style={styles.deleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <TouchableOpacity style={styles.clearButton} onPress={clearTimetable}>
          <Text style={styles.clearText}>🗑️ Clear All Lessons</Text>
        </TouchableOpacity>
      </View>

      {/* Manage Programmes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manage Programmes</Text>
        {programmes.length === 0 ? (
          <Text style={styles.meta}>No programmes yet.</Text>
        ) : (
          programmes.map((programme) => (
            <View key={programme.id} style={styles.manageRow}>
              <View>
                <Text style={styles.manageName}>{programme.title}</Text>
                <Text style={styles.meta}>{programme.status} • {programme.teachers.length} teachers</Text>
              </View>
              <View style={styles.manageActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => editProgramme(programme)}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteProgramme(programme.id, programme.title)}
                >
                  <Text style={styles.deleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Create User Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUserModal}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New User</Text>

            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              value={userForm.name}
              onChangeText={(text) => setUserForm(prev => ({ ...prev, name: text }))}
            />

            <TextInput
              placeholder="Username"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              value={userForm.username}
              onChangeText={(text) => setUserForm(prev => ({ ...prev, username: text }))}
              autoCapitalize="none"
            />

            <TextInput
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              style={styles.modalInput}
              value={userForm.password}
              onChangeText={(text) => setUserForm(prev => ({ ...prev, password: text }))}
              secureTextEntry
            />

            <View style={styles.modalRoleRow}>
              <Text style={styles.modalLabel}>Role:</Text>
              <TouchableOpacity
                style={[styles.modalRoleButton, userForm.role === 'admin' && styles.modalRoleActive]}
                onPress={() => setUserForm(prev => ({ ...prev, role: 'admin' }))}
              >
                <Text style={[styles.modalRoleText, userForm.role === 'admin' && styles.modalRoleTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalRoleButton, userForm.role === 'teacher' && styles.modalRoleActive]}
                onPress={() => setUserForm(prev => ({ ...prev, role: 'teacher' }))}
              >
                <Text style={[styles.modalRoleText, userForm.role === 'teacher' && styles.modalRoleTextActive]}>
                  Teacher
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowUserModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCreateButton]}
                onPress={createUser}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#020617' },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16
  },
  title: { color: '#e2e8f0', fontSize: 32, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#94a3b8', fontSize: 16, marginBottom: 20 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    fontSize: 15
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  button: {
    marginTop: 8,
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonText: { color: '#020617', fontWeight: '700', fontSize: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
    alignItems: 'center'
  },
  statusButtonActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  statusText: { color: '#94a3b8', fontWeight: '600' },
  statusTextActive: { color: '#f8fafc' },
  meta: { color: '#94a3b8', marginTop: 4, fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    color: '#e2e8f0',
    fontSize: 24,
    fontWeight: 'bold'
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  userList: {
    marginTop: 12
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937'
  },
  userName: {
    color: '#e2e8f0',
    fontWeight: '600'
  },
  userMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  manageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937'
  },
  manageName: { color: '#e2e8f0', fontWeight: '700', fontSize: 15 },
  manageActions: {
    flexDirection: 'row',
    gap: 8
  },
  editButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 6
  },
  editText: {
    color: '#020617',
    fontWeight: '600',
    fontSize: 12
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  deleteText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },
  clearButton: {
    marginTop: 12,
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  clearText: { color: '#020617', fontWeight: '700', fontSize: 14 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statBox: {
    width: '48%',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center'
  },
  statBoxNumber: {
    color: '#38bdf8',
    fontSize: 28,
    fontWeight: 'bold'
  },
  statBoxLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 24
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  modalInput: {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 15
  },
  modalRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  modalLabel: {
    color: '#94a3b8',
    marginRight: 12,
    fontSize: 14
  },
  modalRoleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8
  },
  modalRoleActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8'
  },
  modalRoleText: {
    color: '#94a3b8',
    fontWeight: '600'
  },
  modalRoleTextActive: {
    color: '#020617'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center'
  },
  modalCancelButton: {
    backgroundColor: '#374151'
  },
  modalCreateButton: {
    backgroundColor: '#38bdf8'
  },
  modalButtonText: {
    fontWeight: '600',
    color: '#f8fafc'
  }
})

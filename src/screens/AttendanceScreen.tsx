import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../api'
import { useAuth } from '../contexts/AuthContext'

interface Lesson {
  id: number
  subject: string
  day: string
  time: string
  duration: string
  topic: string
  teacherId: number
}

interface AttendanceRecord {
  id: number
  lessonId: number
  userId: number
  status: 'present' | 'absent' | 'late'
  timestamp: string
}

export default function AttendanceScreen() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([])

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [lessonsData, attendanceData] = await Promise.all([
        fetch(`${API_BASE_URL}/api/lessons`, { headers }).then((res) => res.json()),
        fetch(`${API_BASE_URL}/api/attendance`, { headers }).then((res) => res.json())
      ])

      setLessons(lessonsData)
      setAttendance(attendanceData)

      // Filter today's lessons
      const today = new Date().toLocaleString('en', { weekday: 'long' })
      const todayFiltered = lessonsData.filter((l: Lesson) => l.day === today)
      setTodayLessons(todayFiltered)

      // Auto-select first today's lesson if available
      if (todayFiltered.length > 0 && !selectedLesson) {
        setSelectedLesson(todayFiltered[0])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      Alert.alert('Error', 'Failed to load attendance data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const markAttendance = async (status: 'present' | 'absent' | 'late') => {
    if (!selectedLesson) {
      Alert.alert('Error', 'Please select a lesson first.')
      return
    }

    try {
      const token = await AsyncStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          userId: user?.id,
          status
        })
      })

      if (response.ok) {
        await loadData()
        const statusEmoji = status === 'present' ? '✅' : status === 'late' ? '⏰' : '❌'
        Alert.alert('Success', `${statusEmoji} Attendance marked as ${status.toUpperCase()}`)
      } else {
        const error = await response.json()
        Alert.alert('Error', error.error || 'Unable to mark attendance.')
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to mark attendance. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10b981'
      case 'late': return '#f59e0b'
      case 'absent': return '#ef4444'
      default: return '#94a3b8'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return 'check-circle'
      case 'late': return 'clock'
      case 'absent': return 'x-circle'
      default: return 'circle'
    }
  }

  const getAttendanceStatus = (lessonId: number) => {
    const record = attendance.find(a => a.lessonId === lessonId && a.userId === user?.id)
    return record?.status || null
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loaderText}>Loading attendance...</Text>
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
        <View style={styles.headerLeft}>
          <Feather name="clipboard" size={28} color="#38bdf8" />
          <Text style={styles.title}>Attendance</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {todayLessons.length > 0 
          ? `📅 ${todayLessons.length} lesson(s) today` 
          : 'No lessons scheduled for today'}
      </Text>

      {/* Today's Lessons */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="calendar" size={18} color="#38bdf8" />
          <Text style={styles.cardTitle}>Today's Lessons</Text>
        </View>

        {todayLessons.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={40} color="#374151" />
            <Text style={styles.emptyText}>No lessons today</Text>
            <Text style={styles.emptySubtext}>Enjoy your day off! 🎉</Text>
          </View>
        ) : (
          todayLessons.map((lesson) => {
            const status = getAttendanceStatus(lesson.id)
            const isSelected = selectedLesson?.id === lesson.id

            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonButton,
                  isSelected && styles.lessonButtonActive,
                  status && { borderLeftColor: getStatusColor(status), borderLeftWidth: 4 }
                ]}
                onPress={() => setSelectedLesson(lesson)}
              >
                <View style={styles.lessonContent}>
                  <View style={styles.lessonInfo}>
                    <Text style={[styles.lessonTitle, isSelected && styles.lessonTitleActive]}>
                      {lesson.subject}
                    </Text>
                    <Text style={styles.lessonTopic}>{lesson.topic}</Text>
                    <View style={styles.lessonMeta}>
                      <Feather name="clock" size={12} color="#94a3b8" />
                      <Text style={styles.lessonMetaText}>{lesson.time}</Text>
                      <Feather name="clock" size={12} color="#94a3b8" style={styles.metaSpacer} />
                      <Text style={styles.lessonMetaText}>{lesson.duration}</Text>
                    </View>
                  </View>
                  
                  {status && (
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                      <Feather name={getStatusIcon(status)} size={14} color="#fff" />
                      <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
                    </View>
                  )}
                  
                  {!status && isSelected && (
                    <Feather name="chevron-right" size={20} color="#38bdf8" />
                  )}
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </View>

      {/* Mark Attendance */}
      {selectedLesson && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="user-check" size={18} color="#38bdf8" />
            <Text style={styles.cardTitle}>Mark Attendance</Text>
          </View>

          <View style={styles.selectedLessonInfo}>
            <Text style={styles.selectedLessonTitle}>{selectedLesson.subject}</Text>
            <Text style={styles.selectedLessonTopic}>{selectedLesson.topic}</Text>
            <View style={styles.selectedLessonMeta}>
              <Feather name="calendar" size={14} color="#94a3b8" />
              <Text style={styles.selectedLessonMetaText}>{selectedLesson.day}</Text>
              <Feather name="clock" size={14} color="#94a3b8" style={styles.metaSpacer} />
              <Text style={styles.selectedLessonMetaText}>{selectedLesson.time}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.statusButton, styles.presentButton]}
              onPress={() => markAttendance('present')}
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={styles.statusButtonText}>Present</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusButton, styles.lateButton]}
              onPress={() => markAttendance('late')}
            >
              <Feather name="clock" size={20} color="#fff" />
              <Text style={styles.statusButtonText}>Late</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusButton, styles.absentButton]}
              onPress={() => markAttendance('absent')}
            >
              <Feather name="x-circle" size={20} color="#fff" />
              <Text style={styles.statusButtonText}>Absent</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Attendance Summary */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="pie-chart" size={18} color="#38bdf8" />
          <Text style={styles.cardTitle}>Attendance Summary</Text>
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.summaryLabel}>Present</Text>
            <Text style={styles.summaryValue}>
              {attendance.filter(a => a.userId === user?.id && a.status === 'present').length}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.summaryLabel}>Late</Text>
            <Text style={styles.summaryValue}>
              {attendance.filter(a => a.userId === user?.id && a.status === 'late').length}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.summaryLabel}>Absent</Text>
            <Text style={styles.summaryValue}>
              {attendance.filter(a => a.userId === user?.id && a.status === 'absent').length}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: '#38bdf8' }]} />
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>
              {attendance.filter(a => a.userId === user?.id).length}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Feather name="clock" size={12} color="#64748b" />
        <Text style={styles.footerText}>
          Last updated: {new Date().toLocaleString()}
        </Text>
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
  loaderContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 32,
    fontWeight: '800',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#1f2937',
    borderRadius: 10,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 8,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  lessonButton: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  lessonButtonActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#1a2744',
  },
  lessonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 16,
  },
  lessonTitleActive: {
    color: '#38bdf8',
  },
  lessonTopic: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  lessonMetaText: {
    color: '#64748b',
    fontSize: 12,
    marginLeft: 4,
  },
  metaSpacer: {
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  selectedLessonInfo: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  selectedLessonTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  selectedLessonTopic: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  selectedLessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  selectedLessonMetaText: {
    color: '#94a3b8',
    fontSize: 13,
    marginLeft: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  presentButton: {
    backgroundColor: '#10b981',
  },
  lateButton: {
    backgroundColor: '#f59e0b',
  },
  absentButton: {
    backgroundColor: '#ef4444',
  },
  statusButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    gap: 8,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 12,
    flex: 1,
  },
  summaryValue: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 12,
  },
  footerText: {
    color: '#64748b',
    fontSize: 11,
  },
})

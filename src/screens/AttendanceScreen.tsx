import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { API_BASE_URL } from '../api'

interface Lesson {
  id: number
  subject: string
  day: string
  time: string
  duration: string
  topic: string
}

interface AttendanceRecord {
  id: number
  lessonId: number
  userId: number
  status: 'present' | 'absent' | 'late'
  timestamp: string
}

export default function AttendanceScreen({ user }: { user: any }) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [lessonsData, attendanceData] = await Promise.all([
        fetch(`${API_BASE_URL}/api/lessons`).then((res) => res.json()),
        fetch(`${API_BASE_URL}/api/attendance`).then((res) => res.json())
      ])
      setLessons(lessonsData)
      setAttendance(attendanceData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  const markAttendance = async (status: 'present' | 'absent' | 'late') => {
    if (!selectedLesson) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: selectedLesson.id, userId: user.id, status })
      })
      if (response.ok) {
        loadData()
        Alert.alert('Marked', `Attendance recorded as ${status}.`)
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to mark attendance.')
    }
  }

  if (loading) return <ActivityIndicator size="large" color="#38bdf8" style={styles.loader} />

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Attendance</Text>
      <Text style={styles.subtitle}>Mark attendance for lessons.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select a lesson</Text>
        {lessons.length === 0 ? (
          <Text style={styles.emptyText}>No lessons available.</Text>
        ) : (
          lessons.map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={[styles.lessonButton, selectedLesson?.id === lesson.id && styles.lessonButtonActive]}
              onPress={() => setSelectedLesson(lesson)}
            >
              <Text style={styles.lessonTitle}>{lesson.subject}</Text>
              <Text style={styles.lessonMeta}>{lesson.time}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {selectedLesson && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mark attendance</Text>
          <Text style={styles.lessonDetail}>{selectedLesson.subject}</Text>
          <Text style={styles.lessonDetail}>{selectedLesson.topic}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.statusButton, styles.presentButton]} onPress={() => markAttendance('present')}>
              <Text style={styles.statusButtonText}>Present</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statusButton, styles.lateButton]} onPress={() => markAttendance('late')}>
              <Text style={styles.statusButtonText}>Late</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statusButton, styles.absentButton]} onPress={() => markAttendance('absent')}>
              <Text style={styles.statusButtonText}>Absent</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#020617' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: '#e2e8f0', fontSize: 32, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#94a3b8', fontSize: 16, marginBottom: 20 },
  loader: { marginTop: 50 },
  card: { backgroundColor: '#111827', borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  emptyText: { color: '#64748b', fontSize: 14 },
  lessonButton: { backgroundColor: '#0f172a', borderRadius: 14, padding: 14, marginBottom: 10 },
  lessonButtonActive: { backgroundColor: '#38bdf8', borderWidth: 2, borderColor: '#0ea5e9' },
  lessonTitle: { color: '#e2e8f0', fontWeight: '700' },
  lessonMeta: { color: '#94a3b8', marginTop: 6, fontSize: 12 },
  lessonDetail: { color: '#cbd5e1', marginBottom: 8 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  statusButton: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  presentButton: { backgroundColor: '#10b981' },
  lateButton: { backgroundColor: '#f59e0b' },
  absentButton: { backgroundColor: '#ef4444' },
  statusButtonText: { color: '#ffffff', fontWeight: '700' }
})

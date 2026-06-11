import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { API_BASE_URL } from '../api'
import { User, Lesson, Programme } from '../types'

export default function ScheduleScreen({ user }: { user: User }) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(true)

  const loadSchedule = async () => {
    setLoading(true)
    const teacherId = user.role === 'teacher' ? user.teacherId : undefined
    const queryString = teacherId ? `?teacherId=${teacherId}` : ''
    const [lessonData, programmeData] = await Promise.all([
      fetch(`${API_BASE_URL}/api/lessons${queryString}`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/api/programmes`).then((res) => res.json())
    ])
    setLessons(lessonData)
    setProgrammes(programmeData)
    setLoading(false)
  }

  useEffect(() => {
    loadSchedule()
    const interval = setInterval(loadSchedule, 10000)
    return () => clearInterval(interval)
  }, [])

  const findProgrammeTitle = (programmeId: number) => programmes.find((p) => p.id === programmeId)?.title || 'Unknown programme'

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Daily Schedule</Text>
      <Text style={styles.subtitle}>Live lesson schedule powered by internet updates.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#38bdf8" style={styles.loader} />
      ) : lessons.length === 0 ? (
        <Text style={styles.emptyText}>No lessons available yet.</Text>
      ) : (
        lessons.map((lesson) => (
          <View key={lesson.id} style={styles.card}>
            <Text style={styles.cardTitle}>{lesson.subject}</Text>
            <Text style={styles.cardMeta}>{findProgrammeTitle(lesson.programmeId)}</Text>
            <Text style={styles.body}>{lesson.topic}</Text>
            <Text style={styles.meta}>{lesson.day} · {lesson.time} · {lesson.duration}</Text>
          </View>
        ))
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
  cardTitle: { color: '#38bdf8', fontSize: 18, fontWeight: '700' },
  cardMeta: { color: '#94a3b8', marginTop: 10, marginBottom: 6 },
  body: { color: '#e2e8f0', marginTop: 4 },
  meta: { color: '#64748b', marginTop: 10 },
  emptyText: { color: '#64748b', fontSize: 14 }
})

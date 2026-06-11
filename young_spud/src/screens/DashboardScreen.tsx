import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { API_BASE_URL } from '../api'
import { User } from '../types'

interface Programme {
  id: number
  title: string
  description: string
  status: 'upcoming' | 'ongoing' | 'completed'
  startDate: string
  endDate: string
}

interface Teacher {
  id: number
  name: string
  subject: string
}

const formatDay = (date: string) => new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

export default function DashboardScreen({ user }: { user: User }) {
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [programmesData, teachersData] = await Promise.all([
        fetch(`${API_BASE_URL}/api/programmes`).then((res) => res.json()),
        fetch(`${API_BASE_URL}/api/teachers`).then((res) => res.json())
      ])
      setProgrammes(programmesData)
      setTeachers(teachersData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const groupedProgrammes = useMemo(
    () => ({
      upcoming: programmes.filter((program) => program.status === 'upcoming'),
      ongoing: programmes.filter((program) => program.status === 'ongoing'),
      completed: programmes.filter((program) => program.status === 'completed')
    }),
    [programmes]
  )

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Teacher's Hub</Text>
      <Text style={styles.subtitle}>Live programme updates and schedule visibility for your role.</Text>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Hello, {user.name}</Text>
        <Text style={styles.welcomeMeta}>{user.role === 'admin' ? 'You can manage the school schedule and user accounts.' : 'Access your daily lessons and send updates to the admin.'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#38bdf8" style={styles.loader} />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ongoing Programmes</Text>
            {groupedProgrammes.ongoing.length === 0 ? (
              <Text style={styles.emptyText}>No ongoing programmes</Text>
            ) : (
              groupedProgrammes.ongoing.map((program) => (
                <View key={program.id} style={styles.programmeItem}>
                  <Text style={styles.programmeTitle}>{program.title}</Text>
                  <Text style={styles.programmeBody}>{program.description}</Text>
                  <Text style={styles.meta}>{program.startDate} · {program.endDate}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upcoming Programmes</Text>
            {groupedProgrammes.upcoming.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming programmes</Text>
            ) : (
              groupedProgrammes.upcoming.map((program) => (
                <View key={program.id} style={styles.programmeItem}>
                  <Text style={styles.programmeTitle}>{program.title}</Text>
                  <Text style={styles.programmeBody}>{program.description}</Text>
                  <Text style={styles.meta}>{program.startDate} · {program.endDate}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Teacher Accounts</Text>
            {teachers.length === 0 ? (
              <Text style={styles.emptyText}>No teacher accounts available.</Text>
            ) : (
              teachers.map((teacher) => (
                <TouchableOpacity
                  key={teacher.id}
                  style={[styles.tag, selectedTeacher?.id === teacher.id ? styles.tagActive : undefined]}
                  onPress={() => setSelectedTeacher(teacher)}
                >
                  <Text style={[styles.tagText, selectedTeacher?.id === teacher.id ? styles.tagTextActive : undefined]}>{teacher.name}</Text>
                  <Text style={styles.tagLabel}>{teacher.subject}</Text>
                </TouchableOpacity>
              ))
            )}
            {selectedTeacher ? (
              <Text style={styles.meta}>Selected: {selectedTeacher.name} — {selectedTeacher.subject}</Text>
            ) : (
              <Text style={styles.emptyText}>Tap a teacher to review their profile.</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#020617' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: '#e2e8f0', fontSize: 32, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#94a3b8', fontSize: 16, marginBottom: 20 },
  welcomeCard: { backgroundColor: '#111827', borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  welcomeTitle: { color: '#f8fafc', fontSize: 22, fontWeight: '700' },
  welcomeMeta: { color: '#94a3b8', marginTop: 8 },
  loader: { marginTop: 50 },
  card: { backgroundColor: '#111827', borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  programmeItem: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  programmeTitle: { color: '#38bdf8', fontSize: 16, fontWeight: '700' },
  programmeBody: { color: '#cbd5e1', marginTop: 4 },
  meta: { color: '#94a3b8', marginTop: 6, fontSize: 13 },
  emptyText: { color: '#64748b', fontSize: 14 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: '#1e293b', padding: 14, borderRadius: 18, marginRight: 10, marginBottom: 10 },
  tagActive: { backgroundColor: '#0ea5e9' },
  tagText: { color: '#cbd5e1', fontWeight: '700' },
  tagLabel: { color: '#94a3b8', marginTop: 4, fontSize: 12 },
  tagTextActive: { color: '#ffffff' }
})

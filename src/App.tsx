// App.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from './src/api'

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

interface Lesson {
  id: number
  teacherId: number
  programmeId: number
  subject: string
  day: string
  time: string
  duration: string
  topic: string
}

const formatDay = (date: string) => {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export default function App() {
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  // Load lessons when teacher or date changes
  useEffect(() => {
    if (selectedTeacherId) {
      loadLessons()
    } else {
      setLessons([])
    }
  }, [selectedTeacherId, selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = await AsyncStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      const [programmesRes, teachersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/programmes`, { headers }),
        fetch(`${API_BASE_URL}/api/teachers`, { headers }),
      ])

      const programmesData = await programmesRes.json()
      const teachersData = await teachersRes.json()

      setProgrammes(programmesData)
      setTeachers(teachersData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadLessons = async () => {
    if (!selectedTeacherId) return

    try {
      const token = await AsyncStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch(
        `${API_BASE_URL}/api/teachers/${selectedTeacherId}/lessons?day=${selectedDate}`,
        { headers }
      )
      const data = await response.json()
      setLessons(data)
    } catch (error) {
      console.error('Error loading lessons:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    if (selectedTeacherId) {
      await loadLessons()
    }
  }

  const groupedProgrammes = useMemo(() => {
    return programmes.reduce(
      (acc, programme) => {
        acc[programme.status].push(programme)
        return acc
      },
      { upcoming: [] as Programme[], ongoing: [] as Programme[], completed: [] as Programme[] }
    )
  }, [programmes])

  const todayLabel = formatDay(selectedDate)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return '#10b981'
      case 'upcoming':
        return '#f59e0b'
      case 'completed':
        return '#3b82f6'
      default:
        return '#94a3b8'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'play-circle'
      case 'upcoming':
        return 'clock'
      case 'completed':
        return 'check-circle'
      default:
        return 'circle'
    }
  }

  const ProgrammeCard = ({ programme }: { programme: Programme }) => (
    <View style={styles.programmeCard}>
      <View style={styles.programmeHeader}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(programme.status) }]} />
        <Text style={styles.programmeTitle}>{programme.title}</Text>
      </View>
      <Text style={styles.programmeDescription}>{programme.description}</Text>
      <View style={styles.programmeMeta}>
        <Feather name="calendar" size={12} color="#94a3b8" />
        <Text style={styles.metaText}>
          {formatDay(programme.startDate)} - {formatDay(programme.endDate)}
        </Text>
      </View>
    </View>
  )

  const LessonCard = ({ lesson }: { lesson: Lesson }) => (
    <View style={styles.lessonCard}>
      <View style={styles.lessonHeader}>
        <View style={styles.timeBadge}>
          <Feather name="clock" size={14} color="#38bdf8" />
          <Text style={styles.timeText}>{lesson.time}</Text>
        </View>
        <Text style={styles.lessonSubject}>{lesson.subject}</Text>
      </View>
      <Text style={styles.lessonTopic}>{lesson.topic}</Text>
      <View style={styles.lessonFooter}>
        <Feather name="clock" size={12} color="#94a3b8" />
        <Text style={styles.lessonDuration}>Duration: {lesson.duration}</Text>
      </View>
    </View>
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
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="book-open" size={28} color="#38bdf8" />
          <Text style={styles.title}>School Planner</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Track upcoming programmes, ongoing activities, and teacher lessons for the selected day.
      </Text>

      {/* Programme Dashboard */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Feather name="bar-chart-2" size={20} color="#38bdf8" />
          <Text style={styles.panelTitle}>Programme Dashboard</Text>
        </View>

        {/* Ongoing Programmes */}
        <View style={styles.programmeSection}>
          <View style={styles.sectionHeader}>
            <Feather name="play-circle" size={16} color="#10b981" />
            <Text style={styles.sectionTitle}>Ongoing</Text>
            <View style={[styles.countBadge, { backgroundColor: '#10b981' }]}>
              <Text style={styles.countText}>{groupedProgrammes.ongoing.length}</Text>
            </View>
          </View>
          {groupedProgrammes.ongoing.length === 0 ? (
            <Text style={styles.emptyText}>No ongoing programmes</Text>
          ) : (
            groupedProgrammes.ongoing.map((programme) => (
              <ProgrammeCard key={programme.id} programme={programme} />
            ))
          )}
        </View>

        {/* Upcoming Programmes */}
        <View style={styles.programmeSection}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={16} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <View style={[styles.countBadge, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.countText}>{groupedProgrammes.upcoming.length}</Text>
            </View>
          </View>
          {groupedProgrammes.upcoming.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming programmes</Text>
          ) : (
            groupedProgrammes.upcoming.map((programme) => (
              <ProgrammeCard key={programme.id} programme={programme} />
            ))
          )}
        </View>
      </View>

      {/* Teacher Day Planner */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Feather name="calendar" size={20} color="#38bdf8" />
          <Text style={styles.panelTitle}>Teacher Day Planner</Text>
        </View>

        {/* Teacher Selection */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowTeacherModal(true)}
          >
            <Feather name="user" size={18} color="#94a3b8" />
            <Text style={styles.selectButtonText}>
              {selectedTeacherId
                ? teachers.find((t) => t.id === selectedTeacherId)?.name || 'Select teacher'
                : 'Select teacher'}
            </Text>
            <Feather name="chevron-down" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Feather name="calendar" size={18} color="#94a3b8" />
            <Text style={styles.dateButtonText}>{formatDay(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* Lessons List */}
        <View style={styles.lessonsContainer}>
          <Text style={styles.lessonsTitle}>
            {selectedTeacherId
              ? `Lessons for ${todayLabel}`
              : 'Pick a teacher to view their lessons'}
          </Text>

          {selectedTeacherId && lessons.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="calendar" size={40} color="#374151" />
              <Text style={styles.emptyStateText}>
                No lessons scheduled for this teacher on the selected day.
              </Text>
            </View>
          )}

          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </View>
      </View>

      {/* Teacher Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTeacherModal}
        onRequestClose={() => setShowTeacherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Teacher</Text>
              <TouchableOpacity onPress={() => setShowTeacherModal(false)}>
                <Feather name="x" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={teachers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.teacherOption,
                    selectedTeacherId === item.id && styles.teacherOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedTeacherId(item.id)
                    setShowTeacherModal(false)
                  }}
                >
                  <View style={styles.teacherOptionContent}>
                    <Text style={styles.teacherOptionName}>{item.name}</Text>
                    <Text style={styles.teacherOptionSubject}>{item.subject}</Text>
                  </View>
                  {selectedTeacherId === item.id && (
                    <Feather name="check-circle" size={20} color="#38bdf8" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No teachers available</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Feather name="x" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.dateInput}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
            />

            <TouchableOpacity
              style={styles.dateConfirmButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.dateConfirmText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
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
    fontSize: 28,
    fontWeight: '800',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#1f2937',
    borderRadius: 10,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15,
    marginBottom: 20,
  },
  panel: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  panelTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  programmeSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  programmeCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  programmeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  programmeTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  programmeDescription: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 6,
  },
  programmeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#64748b',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  selectButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  selectButtonText: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  dateButtonText: {
    color: '#f8fafc',
    fontSize: 13,
  },
  lessonsContainer: {
    marginTop: 4,
  },
  lessonsTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12,
  },
  lessonCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1a2744',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  lessonSubject: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  lessonTopic: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 6,
  },
  lessonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonDuration: {
    color: '#64748b',
    fontSize: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    paddingVertical: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
  },
  teacherOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8,
  },
  teacherOptionSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#1a2744',
  },
  teacherOptionContent: {
    flex: 1,
  },
  teacherOptionName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  teacherOptionSubject: {
    color: '#94a3b8',
    fontSize: 13,
  },
  dateInput: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    fontSize: 16,
    marginBottom: 16,
  },
  dateConfirmButton: {
    backgroundColor: '#38bdf8',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateConfirmText: {
    color: '#020617',
    fontWeight: '700',
    fontSize: 16,
  },
})

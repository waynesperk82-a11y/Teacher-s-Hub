import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../api'
import { User, Lesson, Programme } from '../types'
import { useAuth } from '../contexts/AuthContext'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ScheduleScreen() {
  const { user, hasPermission } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toLocaleString('en', { weekday: 'long' })
  )

  const loadSchedule = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const teacherId = user?.role === 'teacher' ? user?.teacherId : undefined
      const dayParam = selectedDay ? `day=${selectedDay}` : ''
      const teacherParam = teacherId ? `teacherId=${teacherId}` : ''
      const queryString = [dayParam, teacherParam].filter(Boolean).join('&')
      
      const [lessonData, programmeData] = await Promise.all([
        fetch(`${API_BASE_URL}/api/lessons${queryString ? `?${queryString}` : ''}`, { headers })
          .then((res) => res.json()),
        fetch(`${API_BASE_URL}/api/programmes`, { headers })
          .then((res) => res.json())
      ])

      setLessons(lessonData)
      setProgrammes(programmeData)
    } catch (error) {
      console.error('Error loading schedule:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadSchedule()
    const interval = setInterval(loadSchedule, 30000)
    return () => clearInterval(interval)
  }, [selectedDay])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadSchedule()
  }

  const findProgrammeTitle = (programmeId: number) => 
    programmes.find((p) => p.id === programmeId)?.title || 'Unknown programme'

  const getDayColor = (day: string) => {
    const colors: any = {
      Monday: '#3b82f6',
      Tuesday: '#10b981',
      Wednesday: '#f59e0b',
      Thursday: '#8b5cf6',
      Friday: '#ef4444',
      Saturday: '#06b6d4',
      Sunday: '#ec4899',
    }
    return colors[day] || '#94a3b8'
  }

  const getDayIcon = (day: string) => {
    const icons: any = {
      Monday: 'calendar',
      Tuesday: 'calendar',
      Wednesday: 'calendar',
      Thursday: 'calendar',
      Friday: 'calendar',
      Saturday: 'calendar',
      Sunday: 'calendar',
    }
    return icons[day] || 'calendar'
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loaderText}>Loading schedule...</Text>
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
          <Feather name="calendar" size={28} color="#38bdf8" />
          <Text style={styles.title}>Schedule</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {user?.role === 'teacher' 
          ? 'Your daily lesson schedule' 
          : 'Complete schedule overview'}
      </Text>

      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDay === day && styles.dayButtonActive,
              { borderColor: selectedDay === day ? getDayColor(day) : '#1e293b' }
            ]}
            onPress={() => setSelectedDay(day)}
          >
            <Feather 
              name={getDayIcon(day)} 
              size={14} 
              color={selectedDay === day ? '#fff' : '#94a3b8'} 
            />
            <Text style={[
              styles.dayButtonText,
              selectedDay === day && styles.dayButtonTextActive
            ]}>
              {day.substring(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Feather name="book-open" size={16} color="#38bdf8" />
          <Text style={styles.statValue}>{lessons.length}</Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>
        <View style={styles.statItem}>
          <Feather name="clock" size={16} color="#10b981" />
          <Text style={styles.statValue}>
            {lessons.reduce((total, l) => {
              const hours = parseInt(l.duration) || 1
              return total + hours
            }, 0)}
          </Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
        <View style={styles.statItem}>
          <Feather name="users" size={16} color="#8b5cf6" />
          <Text style={styles.statValue}>
            {new Set(lessons.map(l => l.teacherId)).size}
          </Text>
          <Text style={styles.statLabel}>Teachers</Text>
        </View>
      </View>

      {/* Lessons List */}
      {lessons.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="calendar" size={60} color="#374151" />
          <Text style={styles.emptyTitle}>No lessons scheduled</Text>
          <Text style={styles.emptySubtext}>
            {selectedDay === new Date().toLocaleString('en', { weekday: 'long' })
              ? 'Enjoy your day off! 🎉'
              : `No lessons for ${selectedDay}`}
          </Text>
        </View>
      ) : (
        lessons.map((lesson) => {
          const dayColor = getDayColor(lesson.day)
          return (
            <View key={lesson.id} style={[styles.card, { borderLeftColor: dayColor }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <View style={[styles.subjectDot, { backgroundColor: dayColor }]} />
                  <Text style={styles.cardTitle}>{lesson.subject}</Text>
                </View>
                <View style={[styles.timeBadge, { backgroundColor: dayColor + '20' }]}>
                  <Feather name="clock" size={12} color={dayColor} />
                  <Text style={[styles.timeBadgeText, { color: dayColor }]}>
                    {lesson.time}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardMeta}>
                <Feather name="book" size={12} color="#94a3b8" />
                {' '}{findProgrammeTitle(lesson.programmeId)}
              </Text>

              <Text style={styles.body}>
                <Feather name="file-text" size={12} color="#94a3b8" />
                {' '}{lesson.topic}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Feather name="calendar" size={12} color="#94a3b8" />
                  <Text style={styles.meta}>{lesson.day}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Feather name="clock" size={12} color="#94a3b8" />
                  <Text style={styles.meta}>{lesson.duration}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Feather name="user" size={12} color="#94a3b8" />
                  <Text style={styles.meta}>Teacher #{lesson.teacherId}</Text>
                </View>
              </View>
            </View>
          )
        })
      )}

      {/* Footer */}
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
    marginBottom: 16,
  },
  daySelector: {
    marginBottom: 16,
  },
  daySelectorContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  dayButtonActive: {
    backgroundColor: '#1a2744',
    borderWidth: 2,
  },
  dayButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardMeta: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 6,
  },
  body: {
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    color: '#64748b',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 12,
  },
  footerText: {
    color: '#64748b',
    fontSize: 11,
  },
})

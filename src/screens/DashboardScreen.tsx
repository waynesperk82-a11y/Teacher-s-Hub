import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../api'
import { User } from '../types'
import { useAuth } from '../contexts/AuthContext'

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

const formatDay = (date: string) => 
  new Date(date).toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  })

export default function DashboardScreen() {
  const { user } = useAuth()
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [programmesData, teachersData] = await Promise.all([
        fetch(`${API_BASE_URL}/api/programmes`, { headers }).then((res) => res.json()),
        fetch(`${API_BASE_URL}/api/teachers`, { headers }).then((res) => res.json())
      ])
      setProgrammes(programmesData)
      setTeachers(teachersData)
    } catch (error) {
      console.error('Error loading data:', error)
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

  const groupedProgrammes = useMemo(
    () => ({
      upcoming: programmes.filter((program) => program.status === 'upcoming'),
      ongoing: programmes.filter((program) => program.status === 'ongoing'),
      completed: programmes.filter((program) => program.status === 'completed')
    }),
    [programmes]
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return '#10b981'
      case 'upcoming': return '#f59e0b'
      case 'completed': return '#3b82f6'
      default: return '#94a3b8'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ongoing': return 'play-circle'
      case 'upcoming': return 'clock'
      case 'completed': return 'check-circle'
      default: return 'circle'
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loaderText}>Loading dashboard...</Text>
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
          <Feather name="home" size={28} color="#38bdf8" />
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Live programme updates and schedule visibility for your role.
      </Text>

      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeTitle}>Hello, {user?.name}</Text>
            <View style={styles.roleBadge}>
              <Feather name={user?.role === 'admin' ? 'shield' : 'user-check'} size={12} color="#0f172a" />
              <Text style={styles.roleText}>
                {user?.role === 'admin' ? 'Administrator' : 'Teacher'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.welcomeMeta}>
          {user?.role === 'admin' 
            ? 'You can manage the school schedule and user accounts.' 
            : 'Access your daily lessons and send updates to the admin.'}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statOngoing]}>
          <Feather name="play-circle" size={20} color="#10b981" />
          <Text style={styles.statNumber}>{groupedProgrammes.ongoing.length}</Text>
          <Text style={styles.statLabel}>Ongoing</Text>
        </View>
        <View style={[styles.statCard, styles.statUpcoming]}>
          <Feather name="clock" size={20} color="#f59e0b" />
          <Text style={styles.statNumber}>{groupedProgrammes.upcoming.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={[styles.statCard, styles.statCompleted]}>
          <Feather name="check-circle" size={20} color="#3b82f6" />
          <Text style={styles.statNumber}>{groupedProgrammes.completed.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, styles.statTeachers]}>
          <Feather name="users" size={20} color="#8b5cf6" />
          <Text style={styles.statNumber}>{teachers.length}</Text>
          <Text style={styles.statLabel}>Teachers</Text>
        </View>
      </View>

      {/* Ongoing Programmes */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="play-circle" size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Ongoing Programmes</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{groupedProgrammes.ongoing.length}</Text>
          </View>
        </View>

        {groupedProgrammes.ongoing.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={32} color="#374151" />
            <Text style={styles.emptyText}>No ongoing programmes</Text>
          </View>
        ) : (
          groupedProgrammes.ongoing.map((program) => (
            <View key={program.id} style={styles.programmeItem}>
              <View style={styles.programmeHeader}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(program.status) }]} />
                <Text style={styles.programmeTitle}>{program.title}</Text>
              </View>
              <Text style={styles.programmeBody}>{program.description}</Text>
              <View style={styles.programmeMeta}>
                <Feather name="calendar" size={12} color="#94a3b8" />
                <Text style={styles.metaText}>{formatDay(program.startDate)}</Text>
                <Feather name="arrow-right" size={12} color="#94a3b8" style={styles.metaSpacer} />
                <Feather name="calendar" size={12} color="#94a3b8" />
                <Text style={styles.metaText}>{formatDay(program.endDate)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Upcoming Programmes */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="clock" size={18} color="#f59e0b" />
          <Text style={styles.cardTitle}>Upcoming Programmes</Text>
          <View style={[styles.countBadge, styles.countBadgeUpcoming]}>
            <Text style={styles.countText}>{groupedProgrammes.upcoming.length}</Text>
          </View>
        </View>

        {groupedProgrammes.upcoming.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={32} color="#374151" />
            <Text style={styles.emptyText}>No upcoming programmes</Text>
          </View>
        ) : (
          groupedProgrammes.upcoming.map((program) => (
            <View key={program.id} style={styles.programmeItem}>
              <View style={styles.programmeHeader}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(program.status) }]} />
                <Text style={styles.programmeTitle}>{program.title}</Text>
              </View>
              <Text style={styles.programmeBody}>{program.description}</Text>
              <View style={styles.programmeMeta}>
                <Feather name="calendar" size={12} color="#94a3b8" />
                <Text style={styles.metaText}>{formatDay(program.startDate)}</Text>
                <Feather name="arrow-right" size={12} color="#94a3b8" style={styles.metaSpacer} />
                <Feather name="calendar" size={12} color="#94a3b8" />
                <Text style={styles.metaText}>{formatDay(program.endDate)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Teacher Accounts */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="users" size={18} color="#8b5cf6" />
          <Text style={styles.cardTitle}>Teachers</Text>
          <View style={[styles.countBadge, styles.countBadgeTeachers]}>
            <Text style={styles.countText}>{teachers.length}</Text>
          </View>
        </View>

        {teachers.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="user-x" size={32} color="#374151" />
            <Text style={styles.emptyText}>No teacher accounts available</Text>
          </View>
        ) : (
          <View style={styles.teacherGrid}>
            {teachers.map((teacher) => (
              <TouchableOpacity
                key={teacher.id}
                style={[
                  styles.teacherCard,
                  selectedTeacher?.id === teacher.id && styles.teacherCardActive
                ]}
                onPress={() => setSelectedTeacher(teacher)}
              >
                <View style={styles.teacherAvatar}>
                  <Text style={styles.teacherAvatarText}>{teacher.name.charAt(0)}</Text>
                </View>
                <Text style={[
                  styles.teacherName,
                  selectedTeacher?.id === teacher.id && styles.teacherNameActive
                ]}>
                  {teacher.name}
                </Text>
                <View style={styles.teacherSubjectBadge}>
                  <Text style={styles.teacherSubject}>{teacher.subject}</Text>
                </View>
                {selectedTeacher?.id === teacher.id && (
                  <Feather name="check-circle" size={16} color="#38bdf8" style={styles.selectedCheck} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedTeacher && (
          <View style={styles.selectedTeacherInfo}>
            <Feather name="user-check" size={16} color="#38bdf8" />
            <Text style={styles.selectedTeacherText}>
              Selected: <Text style={styles.selectedTeacherName}>{selectedTeacher.name}</Text>
              {' '}· {selectedTeacher.subject}
            </Text>
          </View>
        )}
      </View>

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
    marginBottom: 20,
  },
  welcomeCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#020617',
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  roleText: {
    color: '#020617',
    fontSize: 10,
    fontWeight: '700',
  },
  welcomeMeta: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statOngoing: {
    borderBottomColor: '#10b981',
    borderBottomWidth: 3,
  },
  statUpcoming: {
    borderBottomColor: '#f59e0b',
    borderBottomWidth: 3,
  },
  statCompleted: {
    borderBottomColor: '#3b82f6',
    borderBottomWidth: 3,
  },
  statTeachers: {
    borderBottomColor: '#8b5cf6',
    borderBottomWidth: 3,
  },
  statNumber: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
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
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeUpcoming: {
    backgroundColor: '#f59e0b',
  },
  countBadgeTeachers: {
    backgroundColor: '#8b5cf6',
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
  },
  programmeItem: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  programmeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  programmeTitle: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700',
  },
  programmeBody: {
    color: '#cbd5e1',
    marginTop: 4,
    fontSize: 13,
  },
  programmeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 4,
  },
  metaSpacer: {
    marginHorizontal: 6,
  },
  teacherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teacherCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: '30%',
    borderWidth: 1,
    borderColor: '#1e293b',
    position: 'relative',
  },
  teacherCardActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#1a2744',
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  teacherAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#020617',
  },
  teacherName: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  teacherNameActive: {
    color: '#38bdf8',
  },
  teacherSubjectBadge: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  teacherSubject: {
    color: '#94a3b8',
    fontSize: 9,
  },
  selectedCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  selectedTeacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 12,
  },
  selectedTeacherText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  selectedTeacherName: {
    color: '#f8fafc',
    fontWeight: '600',
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

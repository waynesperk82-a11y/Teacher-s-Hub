import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { API_BASE_URL } from '../api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../contexts/AuthContext'

interface Analytics {
  totalLogins: number
  totalMessages: number
  totalTeachers: number
  totalProgrammes: number
  totalLessons: number
  totalAttendance: number
  totalUsers?: number
  userBreakdown?: {
    admin: number
    teacher: number
  }
  programmeStatus?: {
    upcoming: number
    ongoing: number
    completed: number
  }
}

export default function AnalyticsScreen() {
  const { user, hasPermission, isAdmin } = useAuth()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const token = await AsyncStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin || hasPermission('view_analytics')) {
      loadAnalytics()
      const interval = setInterval(loadAnalytics, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  if (!isAdmin && !hasPermission('view_analytics')) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Feather name="lock" size={60} color="#ef4444" />
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedText}>
          You don't have permission to view analytics.
        </Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loaderText}>Loading analytics...</Text>
      </View>
    )
  }

  if (!analytics) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={60} color="#ef4444" />
        <Text style={styles.errorText}>Unable to load analytics</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
          <Feather name="refresh-cw" size={16} color="#020617" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const totalUsers = analytics.totalUsers || 0
  const adminCount = analytics.userBreakdown?.admin || 0
  const teacherCount = analytics.userBreakdown?.teacher || 0
  const engagementRate = analytics.totalLogins && totalUsers 
    ? ((analytics.totalLogins / (totalUsers * 30)) * 100).toFixed(1) 
    : '0'
  const completionRate = analytics.totalProgrammes 
    ? (((analytics.programmeStatus?.completed || 0) / analytics.totalProgrammes) * 100).toFixed(1)
    : '0'

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="bar-chart-2" size={28} color="#38bdf8" />
          <Text style={styles.title}>Analytics</Text>
        </View>
        <TouchableOpacity onPress={loadAnalytics} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>School-wide activity and engagement metrics</Text>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <View style={[styles.card, styles.cardPrimary]}>
          <Feather name="users" size={24} color="#60a5fa" />
          <Text style={styles.cardNumber}>{analytics.totalTeachers || 0}</Text>
          <Text style={styles.cardLabel}>Teachers</Text>
        </View>
        <View style={[styles.card, styles.cardSuccess]}>
          <Feather name="book-open" size={24} color="#34d399" />
          <Text style={styles.cardNumber}>{analytics.totalProgrammes || 0}</Text>
          <Text style={styles.cardLabel}>Programmes</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={[styles.card, styles.cardWarning]}>
          <Feather name="calendar" size={24} color="#fbbf24" />
          <Text style={styles.cardNumber}>{analytics.totalLessons || 0}</Text>
          <Text style={styles.cardLabel}>Lessons</Text>
        </View>
        <View style={[styles.card, styles.cardError]}>
          <Feather name="clipboard" size={24} color="#f87171" />
          <Text style={styles.cardNumber}>{analytics.totalAttendance || 0}</Text>
          <Text style={styles.cardLabel}>Attendance</Text>
        </View>
      </View>

      {/* User Activity */}
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Feather name="activity" size={20} color="#38bdf8" />
          <Text style={styles.detailCardTitle}>User Activity</Text>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Feather name="log-in" size={16} color="#94a3b8" />
            <Text style={styles.detailLabel}>Total logins</Text>
          </View>
          <Text style={styles.detailValue}>{analytics.totalLogins || 0}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Feather name="message-circle" size={16} color="#94a3b8" />
            <Text style={styles.detailLabel}>Total messages</Text>
          </View>
          <Text style={styles.detailValue}>{analytics.totalMessages || 0}</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Feather name="users" size={16} color="#94a3b8" />
            <Text style={styles.detailLabel}>Total users</Text>
          </View>
          <Text style={styles.detailValue}>{totalUsers}</Text>
        </View>
      </View>

      {/* Programme Status */}
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Feather name="pie-chart" size={20} color="#38bdf8" />
          <Text style={styles.detailCardTitle}>Programme Status</Text>
        </View>
        
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusUpcoming]} />
            <Text style={styles.statusLabel}>Upcoming</Text>
          </View>
          <Text style={styles.statusValue}>{analytics.programmeStatus?.upcoming || 0}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusOngoing]} />
            <Text style={styles.statusLabel}>Ongoing</Text>
          </View>
          <Text style={styles.statusValue}>{analytics.programmeStatus?.ongoing || 0}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusCompleted]} />
            <Text style={styles.statusLabel}>Completed</Text>
          </View>
          <Text style={styles.statusValue}>{analytics.programmeStatus?.completed || 0}</Text>
        </View>
      </View>

      {/* User Breakdown */}
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Feather name="pie-chart" size={20} color="#38bdf8" />
          <Text style={styles.detailCardTitle}>User Breakdown</Text>
        </View>
        
        <View style={styles.userRow}>
          <View style={styles.userItem}>
            <Feather name="shield" size={16} color="#60a5fa" />
            <Text style={styles.userLabel}>Admins</Text>
          </View>
          <Text style={styles.userValue}>{adminCount}</Text>
        </View>
        
        <View style={styles.userRow}>
          <View style={styles.userItem}>
            <Feather name="user-check" size={16} color="#34d399" />
            <Text style={styles.userLabel}>Teachers</Text>
          </View>
          <Text style={styles.userValue}>{teacherCount}</Text>
        </View>
      </View>

      {/* Quick Insights */}
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Feather name="trending-up" size={20} color="#f59e0b" />
          <Text style={styles.detailCardTitle}>Quick Insights</Text>
        </View>
        
        <View style={styles.insightRow}>
          <Feather name="bar-chart" size={16} color="#94a3b8" />
          <Text style={styles.insightText}>
            Avg lessons per teacher:{' '}
            <Text style={styles.insightValue}>
              {(analytics.totalLessons / Math.max(analytics.totalTeachers || 1, 1)).toFixed(1)}
            </Text>
          </Text>
        </View>
        
        <View style={styles.insightRow}>
          <Feather name="trending-up" size={16} color="#94a3b8" />
          <Text style={styles.insightText}>
            Engagement rate:{' '}
            <Text style={styles.insightValue}>{engagementRate}%</Text>
          </Text>
        </View>
        
        <View style={styles.insightRow}>
          <Feather name="check-circle" size={16} color="#94a3b8" />
          <Text style={styles.insightText}>
            Programme completion:{' '}
            <Text style={styles.insightValue}>{completionRate}%</Text>
          </Text>
        </View>

        <View style={styles.insightRow}>
          <Feather name="users" size={16} color="#94a3b8" />
          <Text style={styles.insightText}>
            Teacher to user ratio:{' '}
            <Text style={styles.insightValue}>
              {totalUsers > 0 ? `1:${Math.round(totalUsers / Math.max(analytics.totalTeachers || 1, 1))}` : 'N/A'}
            </Text>
          </Text>
        </View>
      </View>

      {/* Timestamp */}
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
    backgroundColor: '#020617' 
  },
  content: { 
    padding: 20, 
    paddingBottom: 40 
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  retryText: {
    color: '#020617',
    fontWeight: '700',
    fontSize: 14,
  },
  unauthorizedContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  unauthorizedTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  unauthorizedText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
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
    fontWeight: '800' 
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#1f2937',
    borderRadius: 10,
  },
  subtitle: { 
    color: '#94a3b8', 
    fontSize: 16, 
    marginBottom: 20 
  },
  grid: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 16 
  },
  card: { 
    flex: 1, 
    borderRadius: 20, 
    padding: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardPrimary: { 
    backgroundColor: '#0c4a6e' 
  },
  cardSuccess: { 
    backgroundColor: '#064e3b' 
  },
  cardWarning: { 
    backgroundColor: '#78350f' 
  },
  cardError: { 
    backgroundColor: '#7f1d1d' 
  },
  cardNumber: { 
    color: '#ffffff', 
    fontSize: 36, 
    fontWeight: '800',
    marginTop: 8,
  },
  cardLabel: { 
    color: '#cbd5e1', 
    marginTop: 4, 
    fontSize: 14,
    fontWeight: '500',
  },
  detailCard: { 
    backgroundColor: '#111827', 
    borderRadius: 24, 
    padding: 18, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailCardTitle: { 
    color: '#f8fafc', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1f2937' 
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: { 
    color: '#94a3b8',
    fontSize: 14,
  },
  detailValue: { 
    color: '#38bdf8', 
    fontWeight: '700',
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusUpcoming: {
    backgroundColor: '#fbbf24',
  },
  statusOngoing: {
    backgroundColor: '#60a5fa',
  },
  statusCompleted: {
    backgroundColor: '#34d399',
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  statusValue: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 14,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  userValue: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 14,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  insightText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  insightValue: {
    color: '#38bdf8',
    fontWeight: '700',
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

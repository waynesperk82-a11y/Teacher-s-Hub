import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { API_BASE_URL } from '../api'

interface Analytics {
  totalLogins: number
  totalMessages: number
  totalTeachers: number
  totalProgrammes: number
  totalLessons: number
  totalAttendance: number
}

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
    const interval = setInterval(loadAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <ActivityIndicator size="large" color="#38bdf8" style={styles.loader} />
  if (!analytics) return <Text style={styles.error}>Unable to load analytics</Text>

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin Analytics</Text>
      <Text style={styles.subtitle}>School-wide activity and engagement metrics.</Text>

      <View style={styles.grid}>
        <View style={[styles.card, styles.cardPrimary]}>
          <Text style={styles.cardNumber}>{analytics.totalTeachers}</Text>
          <Text style={styles.cardLabel}>Teachers</Text>
        </View>
        <View style={[styles.card, styles.cardSuccess]}>
          <Text style={styles.cardNumber}>{analytics.totalProgrammes}</Text>
          <Text style={styles.cardLabel}>Programmes</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={[styles.card, styles.cardWarning]}>
          <Text style={styles.cardNumber}>{analytics.totalLessons}</Text>
          <Text style={styles.cardLabel}>Lessons</Text>
        </View>
        <View style={[styles.card, styles.cardError]}>
          <Text style={styles.cardNumber}>{analytics.totalAttendance}</Text>
          <Text style={styles.cardLabel}>Attendance</Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailCardTitle}>User Activity</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total logins:</Text>
          <Text style={styles.detailValue}>{analytics.totalLogins}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total messages:</Text>
          <Text style={styles.detailValue}>{analytics.totalMessages}</Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailCardTitle}>Quick insights</Text>
        <Text style={styles.insight}>• Average lessons per teacher: {(analytics.totalLessons / (analytics.totalTeachers || 1)).toFixed(1)}</Text>
        <Text style={styles.insight}>• Engagement rate: {((analytics.totalMessages + analytics.totalAttendance) / Math.max(analytics.totalLogins, 1) * 100).toFixed(0)}%</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#020617' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: '#e2e8f0', fontSize: 32, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#94a3b8', fontSize: 16, marginBottom: 20 },
  loader: { marginTop: 50 },
  error: { color: '#ef4444', padding: 20 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: { flex: 1, borderRadius: 20, padding: 20, alignItems: 'center' },
  cardPrimary: { backgroundColor: '#0c4a6e' },
  cardSuccess: { backgroundColor: '#064e3b' },
  cardWarning: { backgroundColor: '#78350f' },
  cardError: { backgroundColor: '#7f1d1d' },
  cardNumber: { color: '#ffffff', fontSize: 36, fontWeight: '800' },
  cardLabel: { color: '#cbd5e1', marginTop: 8, fontSize: 14 },
  detailCard: { backgroundColor: '#111827', borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  detailCardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  detailLabel: { color: '#94a3b8' },
  detailValue: { color: '#38bdf8', fontWeight: '700' },
  insight: { color: '#cbd5e1', marginBottom: 8, lineHeight: 22 }
})

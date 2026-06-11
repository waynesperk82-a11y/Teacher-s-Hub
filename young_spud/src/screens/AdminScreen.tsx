import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { API_BASE_URL } from '../api'
import { User, Programme, Teacher, Lesson, Message } from '../types'

const emptyTeacher = { name: '', subject: '', email: '', username: '', password: '' }
const emptyProgramme = { title: '', description: '', status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed', startDate: '', endDate: '', teachers: [] as number[] }
const emptyLesson = { teacherId: 0, programmeId: 0, subject: '', day: '', time: '', duration: '', topic: '' }

export default function AdminScreen({ user }: { user: User }) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [teacherForm, setTeacherForm] = useState(emptyTeacher)
  const [programmeForm, setProgrammeForm] = useState(emptyProgramme)
  const [lessonForm, setLessonForm] = useState(emptyLesson)
  const [editingProgrammeId, setEditingProgrammeId] = useState<number | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)

  const loadDashboard = async () => {
    const [teacherData, programmeData, lessonData, messageData] = await Promise.all([
      fetch(`${API_BASE_URL}/api/teachers`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/api/programmes`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/api/lessons`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/api/messages`).then((res) => res.json())
    ])
    setTeachers(teacherData)
    setProgrammes(programmeData)
    setLessons(lessonData)
    setMessages(messageData)
  }

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 10000)
    return () => clearInterval(interval)
  }, [])

  const saveTeacher = async () => {
    if (!teacherForm.name || !teacherForm.subject || !teacherForm.email || !teacherForm.username || !teacherForm.password) {
      Alert.alert('Error', 'Please fill in all teacher fields.')
      return
    }
    const response = await fetch(`${API_BASE_URL}/api/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  }

  const saveProgramme = async () => {
    if (!programmeForm.title || !programmeForm.description || !programmeForm.startDate || !programmeForm.endDate) {
      Alert.alert('Error', 'Please fill in all programme fields.')
      return
    }
    const method = editingProgrammeId ? 'PUT' : 'POST'
    const url = editingProgrammeId ? `${API_BASE_URL}/api/programmes/${editingProgrammeId}` : `${API_BASE_URL}/api/programmes`
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
  }

  const saveLesson = async () => {
    if (!lessonForm.teacherId || !lessonForm.programmeId || !lessonForm.subject || !lessonForm.day || !lessonForm.time || !lessonForm.duration || !lessonForm.topic) {
      Alert.alert('Error', 'Please fill in all lesson fields.')
      return
    }
    const method = editingLessonId ? 'PUT' : 'POST'
    const url = editingLessonId ? `${API_BASE_URL}/api/lessons/${editingLessonId}` : `${API_BASE_URL}/api/lessons`
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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

  const deleteTeacher = async (id: number) => {
    Alert.alert('Delete teacher', 'Are you sure? This will also remove the associated user account.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          const response = await fetch(`${API_BASE_URL}/api/teachers/${id}`, { method: 'DELETE' })
          if (response.ok) {
            loadDashboard()
            Alert.alert('Deleted', 'Teacher removed.')
          }
        }
      }
    ])
  }

  const deleteUser = async (id: number) => {
    Alert.alert('Delete user', 'Are you sure? This action cannot be undone.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          const response = await fetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE' })
          if (response.ok) {
            loadDashboard()
            Alert.alert('Deleted', 'User removed.')
          }
        }
      }
    ])
  }

  const deleteLesson = async (id: number) => {
    Alert.alert('Delete lesson', 'Remove this lesson from the schedule?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          const response = await fetch(`${API_BASE_URL}/api/lessons/${id}`, { method: 'DELETE' })
          if (response.ok) {
            loadDashboard()
            Alert.alert('Deleted', 'Lesson removed.')
          }
        }
      }
    ])
  }

  const deleteProgramme = async (id: number) => {
    Alert.alert('Delete programme', 'Are you sure? All associated lessons will be deleted.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          const response = await fetch(`${API_BASE_URL}/api/programmes/${id}`, { method: 'DELETE' })
          if (response.ok) {
            loadDashboard()
            Alert.alert('Deleted', 'Programme removed.')
          }
        }
      }
    ])
  }

  const clearTimetable = async () => {
    Alert.alert('Clear timetable', 'Remove all lessons? This cannot be undone.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Clear all',
        onPress: async () => {
          const response = await fetch(`${API_BASE_URL}/api/timetable/clear`, { method: 'POST' })
          if (response.ok) {
            loadDashboard()
            Alert.alert('Cleared', 'All lessons removed.')
          }
        }
      }
    ])
  }

  const programmesByStatus = useMemo(
    () => ({
      upcoming: programmes.filter((item) => item.status === 'upcoming'),
      ongoing: programmes.filter((item) => item.status === 'ongoing'),
      completed: programmes.filter((item) => item.status === 'completed')
    }),
    [programmes]
  )

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Live control for teachers, programmes, lessons, and support requests.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add teacher account</Text>
        <TextInput placeholder="Name" placeholderTextColor="#94a3b8" style={styles.input} value={teacherForm.name} onChangeText={(text) => setTeacherForm((prev) => ({ ...prev, name: text }))} />
        <TextInput placeholder="Subject" placeholderTextColor="#94a3b8" style={styles.input} value={teacherForm.subject} onChangeText={(text) => setTeacherForm((prev) => ({ ...prev, subject: text }))} />
        <TextInput placeholder="Email" placeholderTextColor="#94a3b8" style={styles.input} value={teacherForm.email} keyboardType="email-address" onChangeText={(text) => setTeacherForm((prev) => ({ ...prev, email: text }))} />
        <TextInput placeholder="Username" placeholderTextColor="#94a3b8" style={styles.input} value={teacherForm.username} onChangeText={(text) => setTeacherForm((prev) => ({ ...prev, username: text }))} autoCapitalize="none" />
        <TextInput placeholder="Password" placeholderTextColor="#94a3b8" style={styles.input} value={teacherForm.password} secureTextEntry onChangeText={(text) => setTeacherForm((prev) => ({ ...prev, password: text }))} />
        <TouchableOpacity style={styles.button} onPress={saveTeacher}>
          <Text style={styles.buttonText}>Save Teacher</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingProgrammeId ? 'Edit programme' : 'Create programme'}</Text>
        <TextInput placeholder="Title" placeholderTextColor="#94a3b8" style={styles.input} value={programmeForm.title} onChangeText={(text) => setProgrammeForm((prev) => ({ ...prev, title: text }))} />
        <TextInput placeholder="Description" placeholderTextColor="#94a3b8" style={[styles.input, styles.textArea]} value={programmeForm.description} multiline onChangeText={(text) => setProgrammeForm((prev) => ({ ...prev, description: text }))} />
        <TextInput placeholder="Start date (YYYY-MM-DD)" placeholderTextColor="#94a3b8" style={styles.input} value={programmeForm.startDate} onChangeText={(text) => setProgrammeForm((prev) => ({ ...prev, startDate: text }))} />
        <TextInput placeholder="End date (YYYY-MM-DD)" placeholderTextColor="#94a3b8" style={styles.input} value={programmeForm.endDate} onChangeText={(text) => setProgrammeForm((prev) => ({ ...prev, endDate: text }))} />
        <View style={styles.statusRow}>
          {(['upcoming', 'ongoing', 'completed'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusButton, programmeForm.status === status && styles.statusButtonActive]}
              onPress={() => setProgrammeForm((prev) => ({ ...prev, status }))}
            >
              <Text style={[styles.statusText, programmeForm.status === status && styles.statusTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={saveProgramme}>
          <Text style={styles.buttonText}>{editingProgrammeId ? 'Update Programme' : 'Add Programme'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{editingLessonId ? 'Edit lesson' : 'Add lesson'}</Text>
        <TextInput placeholder="Teacher ID" placeholderTextColor="#94a3b8" style={styles.input} keyboardType="number-pad" value={lessonForm.teacherId ? lessonForm.teacherId.toString() : ''} onChangeText={(text) => setLessonForm((prev) => ({ ...prev, teacherId: Number(text) }))} />
        <TextInput placeholder="Programme ID" placeholderTextColor="#94a3b8" style={styles.input} keyboardType="number-pad" value={lessonForm.programmeId ? lessonForm.programmeId.toString() : ''} onChangeText={(text) => setLessonForm((prev) => ({ ...prev, programmeId: Number(text) }))} />
        <TextInput placeholder="Subject" placeholderTextColor="#94a3b8" style={styles.input} value={lessonForm.subject} onChangeText={(text) => setLessonForm((prev) => ({ ...prev, subject: text }))} />
        <TextInput placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#94a3b8" style={styles.input} value={lessonForm.day} onChangeText={(text) => setLessonForm((prev) => ({ ...prev, day: text }))} />
        <TextInput placeholder="Time" placeholderTextColor="#94a3b8" style={styles.input} value={lessonForm.time} onChangeText={(text) => setLessonForm((prev) => ({ ...prev, time: text }))} />
        <TextInput placeholder="Duration" placeholderTextColor="#94a3b8" style={styles.input} value={lessonForm.duration} onChangeText={(text) => setLessonForm((prev) => ({ ...prev, duration: text }))} />
        <TextInput placeholder="Topic" placeholderTextColor="#94a3b8" style={[styles.input, styles.textArea]} value={lessonForm.topic} multiline onChangeText={(text) => setLessonForm((prev) => ({ ...prev, topic: text }))} />
        <TouchableOpacity style={styles.button} onPress={saveLesson}>
          <Text style={styles.buttonText}>{editingLessonId ? 'Update Lesson' : 'Add Lesson'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live overview</Text>
        <Text style={styles.meta}>Teachers: {teachers.length}</Text>
        <Text style={styles.meta}>Programmes: {programmes.length}</Text>
        <Text style={styles.meta}>Lessons: {lessons.length}</Text>
        <Text style={styles.meta}>Pending messages: {messages.length}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick programme edit</Text>
        {programmesByStatus.ongoing.map((item) => (
          <TouchableOpacity key={item.id} style={styles.summaryRow} onPress={() => editProgramme(item)}>
            <Text style={styles.programmeTitle}>{item.title}</Text>
            <Text style={styles.meta}>Tap to load into form</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manage teachers</Text>
        {teachers.length === 0 ? (
          <Text style={styles.meta}>No teachers yet.</Text>
        ) : (
          teachers.map((teacher) => (
            <View key={teacher.id} style={styles.manageRow}>
              <View>
                <Text style={styles.manageName}>{teacher.name}</Text>
                <Text style={styles.meta}>{teacher.subject}</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTeacher(teacher.id)}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manage lessons</Text>
        {lessons.length === 0 ? (
          <Text style={styles.meta}>No lessons yet.</Text>
        ) : (
          lessons.map((lesson) => (
            <View key={lesson.id} style={styles.manageRow}>
              <View>
                <Text style={styles.manageName}>{lesson.subject}</Text>
                <Text style={styles.meta}>{lesson.day} • {lesson.time}</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteLesson(lesson.id)}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <TouchableOpacity style={styles.clearButton} onPress={clearTimetable}>
          <Text style={styles.clearText}>Clear all lessons</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manage programmes</Text>
        {programmes.length === 0 ? (
          <Text style={styles.meta}>No programmes yet.</Text>
        ) : (
          programmes.map((programme) => (
            <View key={programme.id} style={styles.manageRow}>
              <View>
                <Text style={styles.manageName}>{programme.title}</Text>
                <Text style={styles.meta}>{programme.status}</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProgramme(programme.id)}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#020617' },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: '#e2e8f0', fontSize: 32, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#94a3b8', fontSize: 16, marginBottom: 20 },
  card: { backgroundColor: '#111827', borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: '#0f172a', color: '#e2e8f0', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  textArea: { height: 90, textAlignVertical: 'top' },
  button: { marginTop: 8, backgroundColor: '#38bdf8', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#020617', fontWeight: '700' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statusButton: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginRight: 8, alignItems: 'center' },
  statusButtonActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  statusText: { color: '#94a3b8', fontWeight: '600' },
  statusTextActive: { color: '#f8fafc' },
  meta: { color: '#94a3b8', marginTop: 6 },
  summaryRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  programmeTitle: { color: '#38bdf8', fontSize: 16, fontWeight: '700' },
  manageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  manageName: { color: '#e2e8f0', fontWeight: '700' },
  deleteButton: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  deleteText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  clearButton: { marginTop: 12, backgroundColor: '#f59e0b', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  clearText: { color: '#020617', fontWeight: '700' }

  summaryRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  programmeTitle: { color: '#38bdf8', fontSize: 16, fontWeight: '700' }
})

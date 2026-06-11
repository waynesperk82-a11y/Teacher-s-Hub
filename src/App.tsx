import { useEffect, useMemo, useState } from 'react'

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

const formatDay = (date: string) => new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

function App() {
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  })

  useEffect(() => {
    fetch('/api/programmes').then((res) => res.json()).then(setProgrammes)
    fetch('/api/teachers').then((res) => res.json()).then(setTeachers)
  }, [])

  useEffect(() => {
    if (selectedTeacherId === null) {
      setLessons([])
      return
    }
    fetch(`/api/teachers/${selectedTeacherId}/lessons?day=${selectedDate}`)
      .then((res) => res.json())
      .then(setLessons)
  }, [selectedTeacherId, selectedDate])

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

  return (
    <div className="app-shell">
      <header>
        <h1>School Programme &amp; Teacher Planner</h1>
        <p>Track upcoming programmes, ongoing activities, and teacher lessons for the selected day.</p>
      </header>

      <section className="main-grid">
        <div className="panel">
          <h2>Programme Dashboard</h2>
          <div className="programme-lists">
            <div>
              <h3>Ongoing</h3>
              {groupedProgrammes.ongoing.length ? (
                groupedProgrammes.ongoing.map((item) => (
                  <article key={item.id} className="programme-card">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <p className="meta">{item.startDate} — {item.endDate}</p>
                  </article>
                ))
              ) : (
                <p className="empty">No ongoing programmes</p>
              )}
            </div>

            <div>
              <h3>Upcoming</h3>
              {groupedProgrammes.upcoming.length ? (
                groupedProgrammes.upcoming.map((item) => (
                  <article key={item.id} className="programme-card">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <p className="meta">{item.startDate} — {item.endDate}</p>
                  </article>
                ))
              ) : (
                <p className="empty">No upcoming programmes</p>
              )}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>Teacher Day Planner</h2>
          <div className="teacher-controls">
            <label>
              Select teacher
              <select value={selectedTeacherId ?? ''} onChange={(event) => setSelectedTeacherId(event.target.value ? Number(event.target.value) : null)}>
                <option value="">-- Select teacher --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} — {teacher.subject}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
          </div>

          <div className="lesson-list">
            <h3>{selectedTeacherId ? `Lessons for ${todayLabel}` : 'Pick a teacher to view their lessons'}</h3>
            {selectedTeacherId && lessons.length === 0 && <p className="empty">No lessons scheduled for this teacher on the selected day.</p>}
            {lessons.map((lesson) => (
              <article key={lesson.id} className="lesson-card">
                <div className="lesson-header">
                  <span>{lesson.time}</span>
                  <strong>{lesson.subject}</strong>
                </div>
                <p>{lesson.topic}</p>
                <p className="meta">Duration: {lesson.duration}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default App

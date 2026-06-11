# Teacher's Hub

An Expo app for teachers and administrators with live updates, admin account control, teacher login, and support messaging. The app works on mobile devices and PC browsers via Expo web.

## Features

- Expo mobile UI with login and fixed navigation
- Admin dashboard for adding teachers, programmes, lessons, and live updates
- Teacher schedule screen for daily lessons
- Support message channel for feedback and complaints
- Express backend API for authentication and real-time data updates

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the backend server:

```bash
npm run server:dev
```

3. Start the Expo app:

```bash
npm run start
```

4. Open the Expo development UI and run on your device or emulator.

## Backend API endpoints

- `POST /api/login` - authenticate a user
- `PATCH /api/users/:id` - update username and/or password
- `GET /api/teachers` - list teachers
- `POST /api/teachers` - add a teacher account
- `GET /api/programmes` - list programmes
- `POST /api/programmes` - add a programme
- `PUT /api/programmes/:id` - update a programme
- `GET /api/lessons` - list lessons with optional `teacherId` and `day`
- `POST /api/lessons` - add a lesson
- `PUT /api/lessons/:id` - update a lesson
- `GET /api/messages` - list admin messages
- `POST /api/messages` - send a support message

## admin credentials

- username: `ADMIN-username`
- password: `young_spud`

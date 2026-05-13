# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities
- Role-based login for admin, faculty, and students
- Protected signup and unregister actions based on user role

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - Web app: http://localhost:8000/static/index.html
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## Authentication

The app now supports login with role-based access control. Use one of the sample accounts in `src/users.json`.

### Sample accounts

- Admin: `admin@mergington.edu` / `adminpass`
- Faculty: `teacher@mergington.edu` / `teachpass`
- Student: `student@mergington.edu` / `studentpass`

Students can sign up only for themselves. Faculty and admin users can manage signups for any student.

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/login`                                                          | Authenticate and receive a bearer token                            |
| POST   | `/logout`                                                         | Log out the current user                                             |
| GET    | `/me`                                                             | Get the current authenticated user's profile                       |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up for an activity (requires login)                            |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student from an activity (requires login)             |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Role

All data is stored in memory, which means activity signups and active sessions reset when the server restarts.

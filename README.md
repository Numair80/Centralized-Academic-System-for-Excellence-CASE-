<<<<<<< HEAD
# Centralized-Academic-System-for-Excellence-CASE-
Centralized Academic System for Excellence (CASE) — a scalable, modular academic management platform integrating students, faculty, parents, and administrators with role-based dashboards.
=======
***C.A.S.E – Centralized Academic System for Excellence***

***Overview***

•	C.A.S.E.(Centralized Academic System for Excellence) is a full-stack web application developed to digitize, simplify, and enhance the academic and administrative operations of educational institutions. The platform serves as a unified digital system that connects students, staff, parents, and administrators, ensuring efficient workflows, transparency, and improved communication.

***Features***

•	Role-based authentication system for Admin, Staff, Students, and Parents.

•	Admin dashboard for institutional management, including departments, courses, and system-wide data.

•	Staff portal for profile management, student supervision, and academic coordination.

•	Student dashboard with access to attendance, timetable, academic records, and learning materials.

•	Parent dashboard for monitoring student progress, attendance, and communication with staff.

•	Semester-wise notes repository for structured academic material.

•	Real-time announcements and event management.

•	AI-powered chatbot for handling queries and FAQs.

•	Scalable architecture with database synchronization across all portals.


***Technology Stack***

**Frontend:**

•	React.js

•	Next.js (server-side rendering and API routes)

•	Tailwind CSS (styling)

•	Framer Motion (animations)

**Backend::**

•	Next.js API routes (server-side logic and data handling)

•	JWT-based authentication

•	Database

•	PostgreSQL with multiple schemas for role-specific data

•	Prisma ORM for database management

**APIs:**

•	Authentication API: /api/auth/login, /api/auth/me, /api/auth/logout

•	Student APIs: /api/student/details, /api/student/attendance, /api/student/notes

•	Staff APIs: /api/staff/details, /api/staff/update, /api/staff/availability

•	Parent APIs: /api/parent/details, /api/parent/student-progress, /api/parent/feedback

•	Notes Repository API: /api/notes/semester/:id

•	Events API: /api/events/upcoming, /api/events/create

•	Feedback API: /api/feedback/submit

***CASE HOMEPAGE***

<img width="871" height="381" alt="image" src="https://github.com/user-attachments/assets/91100c2f-99bd-435b-bd2d-150dcc1e27b9" />

***NOTES REPOSITORY***

<img width="878" height="419" alt="image" src="https://github.com/user-attachments/assets/af0cc73f-d087-4c76-b717-4b475e5ecff2" />

***LOGIN***

<img width="878" height="422" alt="image" src="https://github.com/user-attachments/assets/9bc59b38-290a-4060-babd-12618d09737d" />

***AI CHATBOT***

<img width="860" height="410" alt="image" src="https://github.com/user-attachments/assets/e6257b57-739c-48c9-9b90-d497cd6d9bd4" />

***ADMIN PORTAL***

<img width="873" height="419" alt="image" src="https://github.com/user-attachments/assets/4a772ff3-7b38-4776-9a37-52518c13b7fc" />

***Dashboards***

**Admin Dashboard:**

•	Manage institution-wide data, including departments, staff, and student records.

•	Approve or update announcements and events.

•	Oversee overall system operations and analytics.

**Staff Portal:**

•	Access and update staff profile details.

•	Manage student academic data, attendance, and departmental information.

•	Upload and update semester-wise notes.

•	Communicate with parents and students through the system.

**Student Dashboard:**

•	View personal details, academic records, and attendance.

•	Access semester-wise notes repository.

•	Check timetables, notifications, and announcements.

•	Interact with the AI chatbot for academic queries.

**Parent Dashboard:**

•	Monitor student attendance, grades, and academic progress.

•	Receive updates on events, announcements, and schedules.

•	Submit feedback to the institution or communicate with staff.

•	View performance reports and learning resources shared with the student.

***Installation and Setup:***

•	Clone the repository:

•	git clone https://github.com/your-username/CASE.git

•	cd CASE

**Install dependencies:**

* npm install

**Run database migrations using Prisma:**

* npx prisma migrate dev

**Start the development server:**

* npm run dev

**The application will be available at http://localhost:3000.**
>>>>>>> 500ff62 (Create README.md)

1. Core Entities & Relationships (ER Model)

Think of it like the blueprint of the database:

User (generic auth entity, students & staff extend it)

1:1 → StudentProfile

1:1 → StaffProfile

Hostel

1 → many Buildings

1 → many Rooms

Room

Belongs to Building

Has many Beds

Constraint: Beds ≤ Room capacity

Bed

Belongs to Room

1:1 with Allocation (at most one student per bed at a time)

StudentProfile

Belongs to User

Can have many Payments

1:1 with Allocation (a student can only occupy one bed at a time)

Can create many Complaints, LeaveRequests

Payment

Belongs to StudentProfile

1 payment → may result in 1 Allocation (if success)

Immutable after success (except refunds)

Allocation

Links StudentProfile → Bed

Has start/end dates

Active flag (for current stay)

LeaveRequest

Belongs to StudentProfile

Has status (pending, approved, rejected)

Approved/rejected by StaffProfile

Complaint

Belongs to StudentProfile

Reviewed/resolved by StaffProfile

ER Diagram (conceptual)
User ──1─1── StudentProfile ──1──1── Allocation ──1──1── Bed ──*── Room ──*── Building ──*── Hostel
   │                       │                            │
   │                       └─*── Payment                 └─ (capacity constraint)
   │                       └─*── Complaint
   │                       └─*── LeaveRequest
   │
   └─1─1── StaffProfile (warden/admin)

2. Business Flows
🔹 Student lifecycle

Student signs up → profile created.

Student applies for hostel seat → initiates Payment.

If Payment success → system/admin allocates a Bed.

After this point: student cannot withdraw.

Receipt is emailed.

Student is now “active resident”.

🔹 Allocation flow

Beds tracked at the lowest granularity (one student per bed).

Allocation is exclusive:

A Bed can only have one active Allocation.

A Student can only have one active Allocation.

Admin/warden can reallocate (with audit log).

🔹 Complaints & Maintenance

Student raises Complaint → staff marks status → resolved.

Useful for tracking hostel issues (water, electricity, wifi, etc.).

🔹 Leave management

Student files a LeaveRequest (dates, reason).

Warden reviews → approve/reject.

Records stored for audit & discipline.

🔹 Staff/Admin dashboard

See all allocations, occupancy rates.

Approve/reject leaves.

Resolve complaints.

Manage payments & reports.

Export CSV/PDF reports.

3. API Endpoints (by role)
Auth

POST /auth/register → student register

POST /auth/login → token login

POST /auth/logout

Student endpoints

Profile

GET /students/me → view profile

PUT /students/me → update profile

Payment

POST /payments/ → initiate payment (pending)

GET /payments/me → list my payments

(Webhook updates payment status → success/fail)

Allocation

GET /allocations/me → check my bed allocation

Complaints

POST /complaints/ → create

GET /complaints/me → list my complaints

Leave requests

POST /leaves/ → apply for leave

GET /leaves/me → view my leave history

Staff/Warden endpoints

Student management

GET /students/ → list all students

GET /students/{id} → student detail

PATCH /students/{id}/status → activate/deactivate

Payments

GET /payments/ → view all

POST /payments/{id}/mark-success → confirm manually (or webhook)

Allocations

GET /allocations/ → all allocations

POST /allocations/ → manually allocate student to bed

PATCH /allocations/{id}/end → end allocation

Complaints

GET /complaints/ → all complaints

PATCH /complaints/{id} → update status

Leave management

GET /leaves/ → all leave requests

PATCH /leaves/{id}/approve

PATCH /leaves/{id}/reject

Admin endpoints

(Superuser + reporting)

GET /reports/occupancy → occupancy statistics

GET /reports/revenue → total fees collected

POST /beds/bulk-create → add multiple beds/rooms at once

PATCH /users/{id}/make-staff → promote user to staff/warden

4. Advanced Considerations

Scalability

Separate app modules: users, hostels, payments, allocations, complaints, leaves.

Keep Payment as a bounded context with external integrations (Stripe/Razorpay).

Use PostgreSQL for relational constraints & transactions.

Extensibility

Can extend to multiple hostels, each with buildings/rooms.

Add role-based access control (RBAC) for more granular permissions.

Add attendance tracking (students entering/leaving hostel).

Add inventory (mess items, maintenance requests).

Audit & Logs

Every allocation/reallocation logged (who did it, when).

Every complaint/leave decision logged with staff ID.

Payment status updates logged with transaction references.

Reports

Vacancy reports per building.

Revenue collection trends.

Complaint resolution times.

Leave statistics.

⚡ So in short:

Entities: Users, Students, Staff, Hostel → Building → Room → Bed, Payment, Allocation, Complaint, Leave.

Flows: Enrollment (with payment & allocation), Complaints, Leave, Admin dashboards.

Endpoints: CRUD for each entity, plus special actions (allocate, approve, resolve).

Rules: No withdrawal after payment success, bed capacity enforced, one allocation per student at a time.
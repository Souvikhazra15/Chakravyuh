# API Endpoints Reference

## Base URL
```
http://127.0.0.1:8000
```

---

## PEON DASHBOARD

### Submit Weekly Condition Report
```
POST /api/v1/reports/submit
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "school_id": "SCHOOL_001",
  "category": "Plumbing",
  "condition": "Minor Issue",
  "notes": "Water leak in main hallway",
  "submitted_by": "peon_user_id"
}

Response:
{
  "success": true,
  "report_id": "REPORT_12345",
  "timestamp": "2024-04-18T10:30:00Z"
}
```

---

## PRINCIPAL DASHBOARD

### Fetch School Issues
```
GET /api/v1/school/issues
Authorization: Bearer {token}

Response:
{
  "school_id": "SCHOOL_001",
  "issues": [
    {
      "id": "ISSUE_001",
      "category": "Plumbing",
      "condition": "Major Issue",
      "risk_score": 0.85,
      "priority_level": "Critical",
      "priority_score": 3.75,
      "days_to_failure": 15,
      "reported_date": "2024-04-10"
    }
  ]
}
```

### Approve Repair
```
POST /api/v1/principal/approve-repair
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "issue_id": "ISSUE_001",
  "approved_by": "principal_user_id"
}

Response:
{
  "success": true,
  "status": "Approved"
}
```

---

## DEO DASHBOARD (MOST IMPORTANT)

### Fetch District Maintenance Queue
```
GET /api/v1/deo/queue
Authorization: Bearer {token}

Response:
{
  "queue": [
    {
      "id": "QUEUE_001",
      "school_id": "SCHOOL_001",
      "category": "Girls Toilet",
      "priority_level": "Critical",
      "priority_score": 3.75,
      "risk_score": 0.85,
      "days_to_failure": 15,
      "reason": "Structural damage affecting student safety",
      "status": "Pending",
      "assigned_contractor": null
    },
    {
      "id": "QUEUE_002",
      "school_id": "SCHOOL_002",
      "category": "Electrical",
      "priority_level": "High",
      "priority_score": 2.93,
      "risk_score": 0.65,
      "days_to_failure": 20,
      "reason": "Electrical hazard in classroom",
      "status": "Pending",
      "assigned_contractor": null
    }
  ],
  "total_issues": 45,
  "critical_count": 5,
  "high_count": 12,
  "stats": {
    "processed_records": 45,
    "critical_issues": 5,
    "high_priority_issues": 12,
    "medium_priority_issues": 18,
    "low_priority_issues": 10
  }
}
```

### Assign Contractor to Work Order
```
POST /api/v1/deo/assign-contractor
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "queue_id": "QUEUE_001",
  "contractor_id": "CONTRACTOR_001",
  "assigned_by": "deo_user_id"
}

Response:
{
  "success": true,
  "work_order_id": "WO_001",
  "status": "Assigned"
}
```

---

## CONTRACTOR DASHBOARD

### Fetch Assigned Work Orders
```
GET /api/v1/contractor/work-orders
Authorization: Bearer {token}

Response:
{
  "work_orders": [
    {
      "id": "WO_001",
      "school_id": "SCHOOL_001",
      "category": "Plumbing",
      "issue": "Water leak in main hallway",
      "priority_level": "Critical",
      "assigned_date": "2024-04-15",
      "status": "Pending",
      "expected_completion": "2024-04-20"
    }
  ]
}
```

### Complete Work Order
```
POST /api/v1/contractor/complete-work
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
{
  "work_order_id": "WO_001",
  "contractor_id": "CONTRACTOR_001",
  "notes": "Replaced broken pipe with new copper pipe",
  "photo": <image_file>,
  "latitude": "40.7128",
  "longitude": "-74.0060"
}

Response:
{
  "success": true,
  "work_order_id": "WO_001",
  "status": "Completed",
  "completion_date": "2024-04-18"
}
```

---

## AUTHENTICATION

### Login
```
POST /api/v1/auth/login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "principal",
    "school_id": "SCHOOL_001"
  }
}
```

---

## ROUTES HIERARCHY

```
/
├── /login (public)
├── /architecture (public)
├── /dashboard/peon (protected, peon role)
├── /dashboard/principal (protected, principal role)
├── /dashboard/deo (protected, deo role)
└── /dashboard/contractor (protected, contractor role)
```

---

## USER ROLES

1. **peon**: Submits weekly facility reports
2. **principal**: Approves repairs, views school status
3. **deo**: Views district-wide maintenance queue, assigns contractors
4. **contractor**: Manages assigned work orders

---

## ERROR HANDLING

All endpoints return errors in this format:
```json
{
  "error": true,
  "message": "Error description",
  "status_code": 400
}
```

Common status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

# Requirements, Roles, Workflows & Invariants

## 1. Objective
The system manages multi-stage administrative approval and compliance workflows[cite: 8]. Applicants submit compliance requests with supporting attachments, reviewers evaluate requests across sequential stages (requesting clarifications, approving, or rejecting), and administrators assign reviewers and audit all state transitions[cite: 8].

---

## 2. Actors & Permissions (RBAC)
1. **Applicant (`APPLICANT`)**
   * Creates draft administrative requests and attaches supporting documents/metadata[cite: 8].
   * Submits requests into the review pipeline[cite: 8].
   * Edits and resubmits their own requests **only** when status is `DRAFT` or `NEEDS_INFO`[cite: 8, 9].
   * Views status and review feedback for their own requests only[cite: 8].
2. **Reviewer (`REVIEWER`)**
   * Views requests assigned to them or eligible for their review stage[cite: 8].
   * Evaluates requests by requesting clarifications (`NEEDS_INFO`), approving the current stage (`IN_REVIEW` $\rightarrow$ next stage or `APPROVED`), or rejecting (`REJECTED`) with a mandatory written reason[cite: 8, 9].
   * Cannot modify applicant-submitted content or delete previous review decisions[cite: 8].
3. **Administrator (`ADMIN`)**
   * Assigns or reassigns reviewers to submitted requests[cite: 8].
   * Views summary status reports across all requests[cite: 8].
   * Inspects the complete, immutable `AuditLog` timeline for any request or user (`AUD` package)[cite: 8].

---

## 3. User Workflows & Acceptance Criteria

### Workflow 1: Request Creation, Attachment & Submission
* **Actor:** `APPLICANT`[cite: 8]
* **Steps:**
  1. Applicant fills out the request form (`title`, `description`, `category`, tax/registration reference ID) and attaches supporting metadata/files[cite: 8].
  2. System validates inputs and invokes the External Compliance Pre-Check service.
  3. Applicant submits the request (`DRAFT` $\rightarrow$ `SUBMITTED`)[cite: 8].
* **Acceptance Criteria:**
  * Submitting a valid request sets `status = SUBMITTED`, `currentStage = 1`, returns `201 Created`, and atomically writes a `REQUEST_SUBMITTED` entry in `AuditLogs`[cite: 8, 9].
  * Submitting with missing required fields returns `400 Bad Request` with field-level validation errors[cite: 10].

### Workflow 2: Multi-Stage Evaluation & Clarification Loop
* **Actors:** `REVIEWER`, `APPLICANT`[cite: 8]
* **Steps:**
  1. Assigned Reviewer inspects a `SUBMITTED` request at Stage 1 (Formal Compliance).
  2. Reviewer selects `NEEDS_INFO` with a written clarification note $\rightarrow$ Applicant updates the request and resubmits (`SUBMITTED`)[cite: 8, 9].
  3. Reviewer approves Stage 1 (`currentStage` advances from `1` to `2`, `status = IN_REVIEW`)[cite: 9].
  4. Stage 2 Reviewer issues final decision: `APPROVED` or `REJECTED` (with mandatory reason)[cite: 8, 9].
* **Acceptance Criteria:**
  * Every decision creates an immutable `ReviewDecision` record and an `AuditLog` entry in the same database transaction[cite: 8].
  * Rejecting or requesting clarifications without a `reason` returns `400 Bad Request`[cite: 9].
  * Once `APPROVED` or `REJECTED`, any further edit or review attempt returns `422 Unprocessable Entity`[cite: 9].

### Workflow 3: Reviewer Assignment & Audit Timeline Reconstruction
* **Actor:** `ADMIN`[cite: 8]
* **Steps:**
  1. Admin filters unassigned `SUBMITTED` requests and assigns a `REVIEWER` (`PATCH /api/requests/:id/assign`)[cite: 8].
  2. Admin opens a request's audit view (`GET /api/audit-logs?requestId=:id`) to reconstruct the full chronological sequence of creation, assignments, edits, and stage decisions[cite: 8].
* **Acceptance Criteria:**
  * Non-admin users (`APPLICANT`, `REVIEWER`) attempting to access `/api/audit-logs` or `/assign` receive `403 Forbidden`[cite: 8, 9].
  * The audit timeline lists every state change in chronological order with actor ID, role, timestamp, `previousState`, and `newState`[cite: 8, 9].

---

## 4. Critical Business Invariants (Server & DB Enforced)
1. **Stage & Role Authorization:** Only a `REVIEWER` assigned to the request (and matching the active stage) may submit a decision; an `APPLICANT` can never evaluate their own request (`applicantId !== reviewerId`)[cite: 8, 9].
2. **Decision & Reason Immutability:** Editing a request after `NEEDS_INFO` updates the request fields, but never overwrites, alters, or deletes existing `ReviewDecisions` rows or their `reason` text[cite: 8].
3. **Atomic Audit Persistence:** Every state transition on `Requests` is wrapped in a Sequelize transaction together with `AuditLog.create(...)`; if audit logging fails, the state change rolls back[cite: 8].
4. **Terminal State Lock:** `APPROVED` and `REJECTED` are terminal states; no transitions or edits are allowed afterward[cite: 9].
5. **Append-Only Audit Trail:** No `PUT`, `PATCH`, or `DELETE` endpoints exist for `AuditLogs`[cite: 9].

---

## 5. External Service Integration Contract
* **Service:** Simulated External Registry / Compliance Verification Service (`POST /api/mock-compliance/verify`)[cite: 10].
* **Purpose:** Verifies whether an applicant's organization registration code (`registryCode`) is active and free of compliance holds before final approval[cite: 10].
* **Request JSON:** `{ "registryCode": "RO12345678", "category": "ENVIRONMENTAL_PERMIT" }`
* **Response JSON (`200 OK`):** `{ "registryCode": "RO12345678", "valid": true, "checkedAt": "2026-11-22T18:00:00Z" }`
* **Failure Handling:** Supports simulated timeout/503 mode (`?simulateError=true`) to verify graceful error handling (`502 Bad Gateway` / retryable status without corrupting request state)[cite: 10].

# Corporate Agenda Quickstart Guide

> **Build a Professional Corporate Agenda App with User Management and Calendar Sync (Outlook & Google) using r2pde-ai**

This guide simulates a real, detailed journey to create a robust corporate agenda application, with fully filled-out examples, best practices, and step-by-step CLI usage. Use it as a reference, inspiration, or onboarding material for your team.

---

## 1. Project Initialization

```bash
mkdir corporate-agenda
cd corporate-agenda
git init
r2pde-ai init
```

**Recommended answers for prompts:**
- Project name: `Corporate Agenda`
- Project type: `Dashboard`
- Architecture: `Monolith`
- Code pattern: `Clean Code`
- Maturity: `Production`
- Language for artifacts: `English`

---

## 2. Environment Health Check

```bash
r2pde-ai doctor
```

---

## 3. Defining Manifests (Guiding Principles)

### 3.1 UI Principles
```bash
r2pde-ai manifest:create
```
- Name: `UI Principles`
- Scope: `UI`
- Description: `All user interfaces must be intuitive, responsive, and accessible. Mobile-first design is mandatory. Consistent color palette and typography across all screens.`
- Change type: `feat`

### 3.2 Security Philosophy
```bash
r2pde-ai manifest:create
```
- Name: `Security Philosophy`
- Scope: `Security`
- Description: `User data privacy is a core value. All authentication and sensitive operations must use secure protocols. No passwords or tokens are ever logged.`
- Change type: `feat`

### 3.3 Integration Policy
```bash
r2pde-ai manifest:create
```
- Name: `Integration Policy`
- Scope: `Integration`
- Description: `All third-party calendar integrations must use OAuth2, respect user consent, and provide clear opt-in/out. No data is shared without explicit permission.`
- Change type: `feat`

---

## 4. Defining Contracts (Non-negotiable Rules)

### 4.1 API Security
```bash
r2pde-ai contract:create
```
- Name: `API Security`
- Type: `Security`
- Enforcement: `Mandatory`
- Description: `All API endpoints require JWT authentication. Tokens must be validated on every request. No endpoint exposes sensitive data without proper authorization.`
- Change type: `feat`

### 4.2 Calendar Sync Consistency
```bash
r2pde-ai contract:create
```
- Name: `Calendar Sync Consistency`
- Type: `Integration`
- Enforcement: `Mandatory`
- Description: `All events must be synced bidirectionally with Outlook and Google calendars. Conflicts are resolved using last-write-wins. Sync failures are logged and retried automatically.`
- Change type: `feat`

### 4.3 User Data Protection
```bash
r2pde-ai contract:create
```
- Name: `User Data Protection`
- Type: `Security`
- Enforcement: `Mandatory`
- Description: `All user data is encrypted at rest and in transit. No sensitive data is stored in logs or analytics. Data retention policies comply with LGPD/GDPR.`
- Change type: `feat`

---

## 5. Defining Requirements (Functional, Non-functional, Business)

### 5.1 User Registration
```bash
r2pde-ai requirement:create
```
- Name: `User Registration`
- Type: `Functional`
- Priority: `High`
- Description: `Allow new users to register with email, password, and full name. Email verification is required before first login.`
- Change type: `feat`
- Acceptance criteria:
  - Registration form with email, password, full name
  - Email format and password strength validation
  - Verification email sent on registration
  - User cannot log in before verifying email

### 5.2 User Login
```bash
r2pde-ai requirement:create
```
- Name: `User Login`
- Type: `Functional`
- Priority: `High`
- Description: `Registered users can log in using email and password. JWT is issued on successful login. Failed attempts are rate-limited.`
- Change type: `feat`
- Acceptance criteria:
  - Login form with email and password
  - JWT issued on success
  - 5 failed attempts lock account for 10 minutes

### 5.3 Calendar Event CRUD
```bash
r2pde-ai requirement:create
```
- Name: `Calendar Event CRUD`
- Type: `Functional`
- Priority: `High`
- Description: `Users can create, read, update, and delete calendar events. Events have title, description, start/end time, location, and attendees.`
- Change type: `feat`
- Acceptance criteria:
  - Event list and detail views
  - Create/edit/delete event forms
  - Validation for overlapping events

### 5.4 Outlook Calendar Sync
```bash
r2pde-ai requirement:create
```
- Name: `Outlook Calendar Sync`
- Type: `Integration`
- Priority: `High`
- Description: `Users can connect their Outlook account. Events are synced both ways. OAuth2 is used for authentication.`
- Change type: `feat`
- Acceptance criteria:
  - Connect Outlook button
  - OAuth2 consent flow
  - Events appear in both systems within 1 minute

### 5.5 Google Calendar Sync
```bash
r2pde-ai requirement:create
```
- Name: `Google Calendar Sync`
- Type: `Integration`
- Priority: `High`
- Description: `Users can connect their Google account. Events are synced both ways. OAuth2 is used for authentication.`
- Change type: `feat`
- Acceptance criteria:
  - Connect Google button
  - OAuth2 consent flow
  - Events appear in both systems within 1 minute

### 5.6 Responsive UI
```bash
r2pde-ai requirement:create
```
- Name: `Responsive UI`
- Type: `Non-functional`
- Priority: `High`
- Description: `The application must be fully usable on desktop, tablet, and mobile. All screens adapt to different resolutions.`
- Change type: `feat`
- Acceptance criteria:
  - Layout adapts to screen size
  - Touch-friendly controls
  - No horizontal scroll on mobile

### 5.7 Data Encryption at Rest
```bash
r2pde-ai requirement:create
```
- Name: `Data Encryption at Rest`
- Type: `Non-functional`
- Priority: `High`
- Description: `All user and event data is encrypted in the database. Encryption keys are rotated every 90 days.`
- Change type: `feat`
- Acceptance criteria:
  - All sensitive fields encrypted
  - Key rotation policy documented

---

## 6. Review and Adjust Artifacts

- Edit `.r2pde-ai/manifests/`, `.r2pde-ai/contracts/`, `.r2pde-ai/requirements/` for clarity, completeness, and compliance.
- Use `changeType: fix` for corrections (e.g. bug, logic adjustment) and `improve` for enhancements (e.g. extra validation, better UX).
- Example: To add password complexity, run `r2pde-ai requirement:create` and use changeType `improve`.

---

## 7. Generating Project Context and Prompt

```bash
r2pde-ai wave:prompt
```
- Select the current wave (start with Framework, then Architecture, Core, etc.)
- Copy the generated prompt and paste it into GitHub Copilot or your AI assistant.
- The prompt will include all artifacts and their changeType, guiding the AI to generate code aligned with your intent.

---

## 8. Implementation and Iteration

- Use the AI-generated code as a starting point.
- As new needs arise, repeat steps 3–7 to add or refine artifacts.
- Use `r2pde-ai score` to check project health and resolve warnings or errors.
- All changes are logged in `.r2pde-ai/logs/` for traceability.

---

## 9. Best Practices

- Keep artifacts up to date and versioned in git.
- Use `changeType` to clarify the intent of each change for both humans and AI.
- Prefer small, incremental waves for easier review and rollback.
- Review the audit log regularly.
- Involve stakeholders in reviewing artifacts.
- Use API mode for optimized prompts if available.

---

## 10. Going Further

- Add contracts for compliance (e.g. LGPD/GDPR, audit logging).
- Integrate CI/CD to validate artifacts before deploy.
- Expand requirements for notifications, recurring events, analytics.
- Consult GUIDE.md and README.md for detailed explanations and examples.

---

**Suggested file name:** `CORPORATE-AGENDA-QUICKSTART.md`

This guide is your realistic and complete playbook for building a professional corporate agenda with r2pde-ai. Copy, paste, and answer each prompt to get the most out of the framework. Share it with your team to evangelize best practices and accelerate adoption!

---

# Onboarding Quickstart Guide: Corporate Agenda Example

This guide demonstrates, step by step, how to use `r2pde-ai` to bootstrap a real-world corporate agenda application. All commands are ready to copy and paste.

---

## 1. Create and initialize your project

```bash
mkdir agenda-app && cd agenda-app
npm init -y
```

## 2. Initialize git

```bash
git init
```

## 3. Initialize r2pde-ai

```bash
r2pde-ai init
```

## 4. Check environment health

```bash
r2pde-ai doctor
```

## 5. Create guiding manifests

```bash
r2pde-ai manifest:create
r2pde-ai manifest:create
r2pde-ai manifest:create
```

## 6. Create contracts

```bash
r2pde-ai contract:create
r2pde-ai contract:create
r2pde-ai contract:create
```

## 7. Create requirements

```bash
r2pde-ai requirement:create
r2pde-ai requirement:create
r2pde-ai requirement:create
r2pde-ai requirement:create
r2pde-ai requirement:create
r2pde-ai requirement:create
r2pde-ai requirement:create
```

## 8. Evaluate quality score

```bash
r2pde-ai score
```

---

> All commands above are non-destructive and can be run multiple times. Artifacts are versioned and tracked in git.

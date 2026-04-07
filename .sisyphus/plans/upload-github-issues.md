# Upload User Stories to GitHub Issues

## TL;DR

> Upload 21 user stories to GitHub as properly labeled issues using the `gh` CLI.
> 
> **Deliverables**: 21 GitHub issues with priority labels (`must-have`, `should-have`, `could-have`)
> **Approach**: Use `gh issue create` with --title, --body, and --label flags
> **Labels Created**: 3 priority labels
> **Time Estimate**: Quick (15-20 minutes)

---

## Context

### Original Request
Upload user stories from LaTeX document to GitHub Issues using `gh` CLI, organized by priority (Must/Should/Could have).

### Decisions Made
- **No milestones** - organize by labels only
- **No subtasks** - regular issues only
- **No assignments** - team will assign later
- **No breakdown in titles** - team will handle in GitHub comments
- **Priority labels only**: `must-have`, `should-have`, `could-have`

### ID Conflicts Detected
The LaTeX source has duplicate IDs that need unique numbering:
- req11: appears as both EventOrganizer and TripOrganizer stories
- req12: appears as both EventOrganizer and TripOrganizer stories  
- req7/req17: both are "TripParticipant create events" (req17 is duplicate)

**Resolution**: Use sequential numbering (REQ-1 through REQ-21) to avoid conflicts.

---

## Work Objectives

### Core Objective
Create 21 GitHub issues from the provided user stories, tagged with appropriate priority labels for easy task management.

### Concrete Deliverables
- 10 issues labeled `must-have`
- 7 issues labeled `should-have`
- 4 issues labeled `could-have`
- 3 new labels created in the repository

### Definition of Done
- [ ] All 21 issues created
- [ ] Each issue has correct priority label
- [ ] Issues appear in GitHub with clear titles
- [ ] Team can filter by label in GitHub

---

## Execution Strategy

### Step-by-Step Commands

#### Step 1: Create Labels First

```bash
# Create the three priority labels
gh label create "must-have" --color "FF0000" --description "Critical features - must be implemented"
gh label create "should-have" --description "Important features - implement if time permits"
gh label create "could-have" --color "CCCCCC" --description "Nice to have features - implement if resources allow"
```

#### Step 2: Create Must-Have Issues (10 issues)

```bash
# REQ-1: Create a trip
gh issue create --title "[REQ-1] Create a trip" --body "As a **LoggedInUser**, I want to **create a trip**, so that I can **organize my traveling plans**.

## Context
Original requirement ID: req:req1
Category: Must Have

## Notes
- Team will break this down in comments" --label "must-have"

# REQ-2: Update profile
gh issue create --title "[REQ-2] Update profile" --body "As a **LoggedInUser**, I want to **update my profile**, so that **my personal information is up to date**.

## Context
Original requirement ID: req:req2
Category: Must Have

## Notes
- Team will break this down in comments" --label "must-have"

# REQ-3: Create invite
gh issue create --title "[REQ-3] Create an invite" --body "As a **TripOrganizer**, I want to **create an invite**, so that **I can invite others to my trip**.

## Context
Original requirement ID: req:req3
Category: Must Have

## Notes
- Team will break this down in comments" --label "must-have"

# REQ-4: View invite
gh issue create --title "[REQ-4] View an invite" --body "As a **Guest**, I want to **view an invite**, so that **I can decide whether to join the trip**.

## Context
Original requirement ID: req:req4
Category: Must Have

## Notes
- Team will break this down in comments" --label "must-have"

# REQ-5: Create tasks
gh issue create --title "[REQ-5] Create tasks for participants" --body "As a **TripOrganizer**, I want to **create tasks for the TripParticipants**, so that **they are prepared for the trip**.

## Context
Original requirement ID: req:req5
Category: Must Have

## Notes
- Team will break this down in comments" --label "must-have"

# REQ-6: Check off tasks
gh issue create --title "[REQ-6] Check off assigned tasks" --body "As a **TripParticipant**, I want to **check off tasks assigned to me**, so that **the TripOrganizer knows I have completed them**.

## Context
Original requirement ID: req:req6
Category: Must Have

## Notes
- Team will break this down in comments" --label "must-have"

# REQ-7: Create events
gh issue create --title "[REQ-7] Create events" --body "As a **TripParticipant**, I want to **create events**, so that **other TripParticipants know what is going to happen**.

## Context
Original requirement ID: req:req7
Category: Must Have

## Notes
- Team will break this down in comments" --label "must-have"

# REQ-8: Join event
gh issue create --title "[REQ-8] Join an event" --body "As a **TripParticipant**, I want to **join an event**, so that **others can see that I will attend**.

## Context
Original requirement ID: req:req8
Category: Must Have

## Notes
- Team will break this down in comments" --label "must-have"

# REQ-9: Global chat
gh issue create --title "[REQ-9] Global chat for trip" --body "As a **TripOrganizer**, I want **a global chat**, so that **all participants can communicate easily**.

## Context
Original requirement ID: req:req9
Category: Must Have

## Notes
- Team will break this down in comments" --label "must-have"

# REQ-10: Send chat messages
gh issue create --title "[REQ-10] Send chat messages" --body "As a **TripParticipant**, I want to **send chat messages**, so that **I can communicate with others in the trip**.

## Context
Original requirement ID: req:req10
Category: Must Have

## Notes
- Team will break this down in comments" --label "must-have"
```

#### Step 3: Create Should-Have Issues (7 issues)

```bash
# REQ-11: Update event information
gh issue create --title "[REQ-11] Update event information" --body "As an **EventOrganizer**, I want to **update event information**, so that **participants receive correct details**.

## Context
Original requirement ID: req:req11 (EventOrganizer)
Category: Should Have

## Notes
- Team will break this down in comments" --label "should-have"

# REQ-12: Delete event
gh issue create --title "[REQ-12] Delete an event" --body "As an **EventOrganizer**, I want to **delete an event**, so that **I can remove cancelled or incorrect events**.

## Context
Original requirement ID: req:req12 (EventOrganizer)
Category: Should Have

## Notes
- Team will break this down in comments" --label "should-have"

# REQ-13: Leave event
gh issue create --title "[REQ-13] Leave an event" --body "As an **EventParticipant**, I want to **leave an event**, so that **I can update my attendance**.

## Context
Original requirement ID: req:req13
Category: Should Have

## Notes
- Team will break this down in comments" --label "should-have"

# REQ-14: Event chat messages
gh issue create --title "[REQ-14] Send messages in event chat" --body "As an **EventParticipant**, I want to **send messages in an event chat**, so that **I can communicate with other event participants**.

## Context
Original requirement ID: req:req14
Category: Should Have

## Notes
- Team will break this down in comments" --label "should-have"

# REQ-15: View trip attendees
gh issue create --title "[REQ-15] See trip attendees" --body "As a **TripParticipant**, I want to **see who else is attending the trip**, so that **I understand the group composition**.

## Context
Original requirement ID: req:req15
Category: Should Have

## Notes
- Team will break this down in comments" --label "should-have"

# REQ-16: Disable participant event creation
gh issue create --title "[REQ-16] Disable participant event creation" --body "As a **TripOrganizer**, I want to **be able to completely disable TripParticipants from creating events**, so that **no events can be added without my control**.

## Context
Original requirement ID: req:req11 (TripOrganizer)
Category: Should Have

## Notes
- Team will break this down in comments" --label "should-have"

# REQ-17: Delete events as organizer
gh issue create --title "[REQ-17] Delete events as organizer" --body "As a **TripOrganizer**, I want to **be able to delete events**, so that **I can prevent unwanted or inappropriate events from being added**.

## Context
Original requirement ID: req:req12 (TripOrganizer)
Category: Should Have

## Notes
- Team will break this down in comments" --label "should-have"
```

#### Step 4: Create Could-Have Issues (4 issues)

```bash
# REQ-18: Create groups
gh issue create --title "[REQ-18] Create groups with predefined sizes and names" --body "As a **TripOrganizer**, I want to **create groups with predefined sizes and names**, so that **participants can be organized into smaller groups**.

## Context
Original requirement ID: req:req16
Category: Could Have

## Notes
- Team will break this down in comments" --label "could-have"

# REQ-19: Create events (participant)
gh issue create --title "[REQ-19] Create events as participant" --body "As a **TripParticipant**, I want to **create events**, so that **I can organize smaller gatherings during the trip**.

## Context
Original requirement ID: req:req17
Category: Could Have
Note: This is a duplicate of REQ-7 but from TripParticipant perspective for smaller gatherings

## Notes
- Team will break this down in comments" --label "could-have"

# REQ-20: Export participant info
gh issue create --title "[REQ-20] Export participant information to Excel" --body "As a **TripOrganizer**, I want to **export participant information to an Excel file**, so that **it is easier to manage externally**.

## Context
Original requirement ID: req:req18
Category: Could Have

## Notes
- Team will break this down in comments" --label "could-have"

# REQ-21: Share location
gh issue create --title "[REQ-21] Share location" --body "As a **TripParticipant**, I want to **share my location**, so that **others can see where I am**.

## Context
Original requirement ID: req:req19
Category: Could Have

## Notes
- Team will break this down in comments" --label "could-have"
```

---

## Verification Strategy

### How to Verify All Issues Created

```bash
# Count total issues created
gh issue list --limit 100 | wc -l

# Verify by label
gh issue list --label "must-have" --limit 100
gh issue list --label "should-have" --limit 100
gh issue list --label "could-have" --limit 100

# Check specific issue
gh issue view 1
```

### Web Verification
- Visit `https://github.com/[your-org]/[your-repo]/issues`
- Filter by labels using the label dropdown
- Verify all 21 issues appear

---

## TODOs

- [ ] 1. Create priority labels

  **What to do**:
  - Run the 3 `gh label create` commands
  - Verify labels appear in GitHub

  **Must NOT do**:
  - Skip label creation (issues need labels for filtering)
  - Use colors that don't match priority levels

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Label creation is straightforward, no special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO (must create labels before issues)
  - **Blocks**: All issue creation tasks
  - **Blocked By**: None

  **QA Scenarios**:
  ```
  Scenario: Verify labels created
    Tool: Bash (gh)
    Preconditions: gh CLI authenticated and in repo directory
    Steps:
      1. Run: gh label list
      2. Assert: Output contains "must-have", "should-have", "could-have"
    Expected Result: All 3 priority labels exist
    Evidence: Terminal output screenshot or copy
  ```

- [ ] 2. Create must-have issues (10 issues)

  **What to do**:
  - Run all 10 `gh issue create` commands from Step 2
  - Use copy-paste to execute sequentially
  - Each command creates one issue with `must-have` label

  **Must NOT do**:
  - Skip any must-have requirements
  - Forget to add the label

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Simple command execution

  **Parallelization**:
  - **Can Run In Parallel**: NO (gh CLI runs sequentially anyway)
  - **Blocks**: None
  - **Blocked By**: Task 1 (labels must exist)

  **QA Scenarios**:
  ```
  Scenario: Verify must-have issues created
    Tool: Bash (gh)
    Preconditions: Labels created
    Steps:
      1. Run: gh issue list --label "must-have" --limit 100
      2. Assert: Count equals 10 issues
    Expected Result: 10 issues with must-have label
    Evidence: Terminal output
  ```

- [ ] 3. Create should-have issues (7 issues)

  **What to do**:
  - Run all 7 `gh issue create` commands from Step 3
  - Use copy-paste to execute sequentially
  - Each command creates one issue with `should-have` label

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2 if needed, but sequential is fine)
  - **Blocks**: None
  - **Blocked By**: Task 1 (labels)

  **QA Scenarios**:
  ```
  Scenario: Verify should-have issues created
    Tool: Bash (gh)
    Steps:
      1. Run: gh issue list --label "should-have" --limit 100
      2. Assert: Count equals 7 issues
    Expected Result: 7 issues with should-have label
    Evidence: Terminal output
  ```

- [ ] 4. Create could-have issues (4 issues)

  **What to do**:
  - Run all 4 `gh issue create` commands from Step 4
  - Use copy-paste to execute sequentially
  - Each command creates one issue with `could-have` label

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with previous tasks)
  - **Blocks**: None
  - **Blocked By**: Task 1 (labels)

  **QA Scenarios**:
  ```
  Scenario: Verify could-have issues created
    Tool: Bash (gh)
    Steps:
      1. Run: gh issue list --label "could-have" --limit 100
      2. Assert: Count equals 4 issues
    Expected Result: 4 issues with could-have label
    Evidence: Terminal output
  ```

---

## Final Verification Wave

- [ ] F1. **Complete Upload Verification**
  Run: `gh issue list --limit 100 | wc -l`
  Expected: 21 issues created
  
  Run: `gh issue list --label "must-have" --limit 100 | wc -l`
  Expected: 10 issues
  
  Run: `gh issue list --label "should-have" --limit 100 | wc -l`
  Expected: 7 issues
  
  Run: `gh issue list --label "could-have" --limit 100 | wc -l`
  Expected: 4 issues

---

## Alternative: Script Approach

If you prefer, save this as `create-issues.sh` and run it:

```bash
#!/bin/bash

# Create labels
echo "Creating labels..."
gh label create "must-have" --color "FF0000" --description "Critical features - must be implemented" 2>/dev/null || true
gh label create "should-have" --description "Important features - implement if time permits" 2>/dev/null || true
gh label create "could-have" --color "CCCCCC" --description "Nice to have features - implement if resources allow" 2>/dev/null || true

# Must-have issues
echo "Creating must-have issues..."
gh issue create --title "[REQ-1] Create a trip" --body "As a **LoggedInUser**, I want to **create a trip**, so that I can **organize my traveling plans**." --label "must-have"
gh issue create --title "[REQ-2] Update profile" --body "As a **LoggedInUser**, I want to **update my profile**, so that **my personal information is up to date**." --label "must-have"
gh issue create --title "[REQ-3] Create an invite" --body "As a **TripOrganizer**, I want to **create an invite**, so that **I can invite others to my trip**." --label "must-have"
gh issue create --title "[REQ-4] View an invite" --body "As a **Guest**, I want to **view an invite**, so that **I can decide whether to join the trip**." --label "must-have"
gh issue create --title "[REQ-5] Create tasks for participants" --body "As a **TripOrganizer**, I want to **create tasks for the TripParticipants**, so that **they are prepared for the trip**." --label "must-have"
gh issue create --title "[REQ-6] Check off assigned tasks" --body "As a **TripParticipant**, I want to **check off tasks assigned to me**, so that **the TripOrganizer knows I have completed them**." --label "must-have"
gh issue create --title "[REQ-7] Create events" --body "As a **TripParticipant**, I want to **create events**, so that **other TripParticipants know what is going to happen**." --label "must-have"
gh issue create --title "[REQ-8] Join an event" --body "As a **TripParticipant**, I want to **join an event**, so that **others can see that I will attend**." --label "must-have"
gh issue create --title "[REQ-9] Global chat for trip" --body "As a **TripOrganizer**, I want **a global chat**, so that **all participants can communicate easily**." --label "must-have"
gh issue create --title "[REQ-10] Send chat messages" --body "As a **TripParticipant**, I want to **send chat messages**, so that **I can communicate with others in the trip**." --label "must-have"

# Should-have issues
echo "Creating should-have issues..."
gh issue create --title "[REQ-11] Update event information" --body "As an **EventOrganizer**, I want to **update event information**, so that **participants receive correct details**." --label "should-have"
gh issue create --title "[REQ-12] Delete an event" --body "As an **EventOrganizer**, I want to **delete an event**, so that **I can remove cancelled or incorrect events**." --label "should-have"
gh issue create --title "[REQ-13] Leave an event" --body "As an **EventParticipant**, I want to **leave an event**, so that **I can update my attendance**." --label "should-have"
gh issue create --title "[REQ-14] Send messages in event chat" --body "As an **EventParticipant**, I want to **send messages in an event chat**, so that **I can communicate with other event participants**." --label "should-have"
gh issue create --title "[REQ-15] See trip attendees" --body "As a **TripParticipant**, I want to **see who else is attending the trip**, so that **I understand the group composition**." --label "should-have"
gh issue create --title "[REQ-16] Disable participant event creation" --body "As a **TripOrganizer**, I want to **be able to completely disable TripParticipants from creating events**, so that **no events can be added without my control**." --label "should-have"
gh issue create --title "[REQ-17] Delete events as organizer" --body "As a **TripOrganizer**, I want to **be able to delete events**, so that **I can prevent unwanted or inappropriate events from being added**." --label "should-have"

# Could-have issues
echo "Creating could-have issues..."
gh issue create --title "[REQ-18] Create groups with predefined sizes and names" --body "As a **TripOrganizer**, I want to **create groups with predefined sizes and names**, so that **participants can be organized into smaller groups**." --label "could-have"
gh issue create --title "[REQ-19] Create events as participant" --body "As a **TripParticipant**, I want to **create events**, so that **I can organize smaller gatherings during the trip**." --label "could-have"
gh issue create --title "[REQ-20] Export participant information to Excel" --body "As a **TripOrganizer**, I want to **export participant information to an Excel file**, so that **it is easier to manage externally**." --label "could-have"
gh issue create --title "[REQ-21] Share location" --body "As a **TripParticipant**, I want to **share my location**, so that **others can see where I am**." --label "could-have"

echo "Done! Created 21 issues."
```

**Usage:**
```bash
chmod +x create-issues.sh
./create-issues.sh
```

---

## Success Criteria

### Verification Commands
```bash
# Total count
git issue list --limit 100 | wc -l
# Expected: 21

# By priority
git issue list --label "must-have" --limit 100 | wc -l
# Expected: 10

git issue list --label "should-have" --limit 100 | wc -l
# Expected: 7

git issue list --label "could-have" --limit 100 | wc -l
# Expected: 4
```

### Final Checklist
- [ ] All 21 issues created in GitHub
- [ ] 3 priority labels exist and are applied correctly
- [ ] Issues can be filtered by label in GitHub UI
- [ ] Team can view issues and add breakdown comments
- [ ] No issues are assigned (team will assign later)

---

## Notes for Team

### After Uploading

1. **Filter in GitHub**: Visit Issues → Labels → Click on a priority label to filter
2. **Add Breakdown**: Each team member can comment on issues with implementation details
3. **Assign Issues**: Use GitHub's assign feature when starting work
4. **Link PRs**: When creating PRs, reference the issue number (e.g., `Closes #1`)

### ID Mapping Reference

| REQ ID | Original LaTeX ID | User Story |
|--------|------------------|------------|
| REQ-1 | req:req1 | LoggedInUser create trip |
| REQ-2 | req:req2 | LoggedInUser update profile |
| REQ-3 | req:req3 | TripOrganizer create invite |
| REQ-4 | req:req4 | Guest view invite |
| REQ-5 | req:req5 | TripOrganizer create tasks |
| REQ-6 | req:req6 | TripParticipant check off tasks |
| REQ-7 | req:req7 | TripParticipant create events |
| REQ-8 | req:req8 | TripParticipant join event |
| REQ-9 | req:req9 | TripOrganizer global chat |
| REQ-10 | req:req10 | TripParticipant send chat messages |
| REQ-11 | req:req11 (EventOrganizer) | Update event information |
| REQ-12 | req:req12 (EventOrganizer) | Delete an event |
| REQ-13 | req:req13 | EventParticipant leave event |
| REQ-14 | req:req14 | EventParticipant event chat messages |
| REQ-15 | req:req15 | TripParticipant see trip attendees |
| REQ-16 | req:req11 (TripOrganizer) | Disable participant event creation |
| REQ-17 | req:req12 (TripOrganizer) | Delete events as organizer |
| REQ-18 | req:req16 | Create groups with sizes/names |
| REQ-19 | req:req17 | Create events as participant (smaller gatherings) |
| REQ-20 | req:req18 | Export participant info to Excel |
| REQ-21 | req:req19 | Share location |

# Draft: GitHub Issues Upload Plan

## Requirements

### Organization Strategy
- **Milestones**: NO
- **Labels**: Priority-based only
  - `must-have`
  - `should-have` 
  - `could-have`
- **Issue Type**: Regular issues only (no subtasks)
- **Assignment**: Leave unassigned for now

### Acceptance Criteria
- [ ] Create 21 GitHub issues (10 must-have + 7 should-have + 4 could-have)
- [ ] Each issue should have the user story as the title/description
- [ ] Each issue should be tagged with appropriate priority label
- [ ] Repository configured locally (gh command will use current repo)
- [ ] Issues left unassigned (team will assign later)
- [ ] No breakdown tasks - team will handle in GitHub comments

### Note on IDs
Looking at the requirements, there are some ID conflicts:
- req:req11 appears twice (once as EventOrganizer, once as TripOrganizer)
- req:req12 appears twice (once as EventOrganizer, once as TripOrganizer)
- req:req17 duplicates req:req7 (TripParticipant create events)

Should use unique identifiers when creating issues.

### Command Pattern
```bash
gh issue create --title "[REQ-XX] Brief title" --body "Full user story" --label "priority-label"
```

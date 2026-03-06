# AI Activity Summary & Note Cleanup

**Module:** Activity Log
**Type:** Interactive
**Priority:** P2

---

## Problem

### Timeline overload

An active estate or contact accumulates dozens of activity entries over weeks — emails, calls, viewings, status changes, tasks. When an agent picks up a lead they haven't touched in a week, or covers for a colleague, they have to scroll through the entire timeline to understand "what's the current state of things." There's no quick summary.

### Messy call notes

Agents make 20+ calls per day. They jot quick notes during or right after each call — sentence fragments, abbreviations, mixed with action items. These notes are technically logged but practically useless to anyone else (or even to the same agent two weeks later).

---

## Solution

Two related features on the activity log:

### 1. Timeline Summary

A "Summarize" button on the activity tab of an estate or contact. The system fetches recent activities and asks the LLM to produce a brief status report.

### 2. Note Cleanup

An "AI Clean Up" button in the activity entry form (for phone calls, meetings, viewings). The agent types rough notes, clicks the button, and gets back a structured version with key points, decisions, and follow-up actions extracted.

---

## User Flow

### Timeline Summary

1. Agent opens estate or contact detail > Activity tab
2. Clicks "Summarize recent activity"
3. System fetches last N activities (or activities from a selectable date range)
4. Returns a brief summary, e.g.:
   - "Last 3 weeks: Listed at 450k. 6 enquiries, 4 viewings conducted. One offer at 420k rejected by owner. Price reduced to 435k on Feb 20. Two new viewings scheduled this week."
5. Summary shown in a card/popover — not saved as an activity itself

### Note Cleanup

1. Agent creates a new activity entry (type: phone call)
2. Types rough notes: "called maria, she liked apt but price too high, wants to think, maybe offer 380, husband needs to see it too, schedule 2nd viewing next week"
3. Clicks "AI Clean Up"
4. Notes field is replaced with structured version:
   - **Summary:** Maria interested but concerned about price
   - **Key points:** Liked the apartment overall. Price perceived as too high. Considering an offer around 380k. Husband has not yet visited.
   - **Follow-ups:** Schedule second viewing for both next week. Await potential offer.
5. Agent reviews, edits if needed, saves

---

## Data Inputs

### Timeline Summary
- Recent activity entries: type, date, subject, linked entities, key content

### Note Cleanup
- Raw note text from the agent
- Activity type (call/meeting/viewing) for context
- Linked estate and contact names for context

---

## Acceptance Criteria

- Timeline summary respects the estate/contact scope — only summarizes activities for that record
- Summary length scales with activity volume (short for few entries, longer for many)
- Note cleanup preserves all factual information — never drops details from the original
- Note cleanup extracts follow-up actions as a separate section
- Both features clearly indicate they are AI-generated
- Neither feature auto-saves — agent always reviews first

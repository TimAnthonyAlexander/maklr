# AI Contextual Email Drafting

**Module:** Email
**Type:** Interactive
**Priority:** P2

---

## Problem

Maklr already has AI-powered email *template* generation — creating reusable templates with placeholders. But most agent emails aren't template-worthy. They're one-off contextual messages:

- "Thanks for the viewing yesterday, here's what we discussed"
- "The owner reduced the price, thought of you"
- "We haven't heard back — are you still interested?"

These emails reference specific interactions, dates, details from recent conversations, and the relationship history. Templates with `{{contact.first_name}}` can't capture that. Agents end up writing these from scratch every time, which is the bulk of their email volume.

---

## Solution

Add a "Draft with AI" button in the email compose view. Unlike template generation, this creates a **one-off email** using the full context of the current situation: who the contact is, their pipeline stage, which estate is linked, and what's happened recently between the agent and this contact.

---

## User Flow

1. Agent opens email compose (either from contact, estate, or email module)
2. A contact and/or estate are already linked (or agent links them)
3. Agent clicks "Draft with AI"
4. Dialog opens with:
   - **Intent selector:** follow-up after viewing, price update, new listing match, document request, viewing invitation, general follow-up, custom
   - **Additional context** (optional free text): e.g. "She mentioned wanting a south-facing balcony" or "Owner is flexible on move-in date"
5. Agent clicks Generate
6. System fetches context from DB (contact info, estate info, recent activities)
7. Generated email populates the compose fields (subject + body)
8. Agent reviews, edits, and sends as normal

---

## Data Inputs

Fetched automatically from DB based on linked contact and estate:

- **Contact:** name, type (buyer/seller/tenant), pipeline stage, preferences from search profile
- **Estate:** title, key facts (price, rooms, area, location), status
- **Recent activity:** last 5-10 activities between this agent and this contact (calls, emails, viewings, notes) — summarized, not raw
- **Agent:** name, phone, email for sign-off
- **User-provided:** selected intent + optional context notes

---

## Difference from Email Template Generator

| | Template Generator | Contextual Drafting |
|---|---|---|
| **Creates** | Reusable template with placeholders | One-off email ready to send |
| **Context** | Generic (tone + description) | Rich (contact + estate + history) |
| **Output** | Template saved for future use | Draft in compose, sent immediately |
| **When** | Setting up workflows | Day-to-day communication |

---

## Acceptance Criteria

- Draft populates both subject and body in the existing email composer
- Agent can edit everything before sending — AI draft is a starting point
- Recent activity context is summarized before sending to LLM (not raw activity dumps)
- Intent selector covers the most common real estate communication scenarios
- Generated email references specific details (property address, viewing date, discussed price) — not vague generics
- Sign-off uses the agent's actual name and contact details
- Works when only a contact is linked (no estate), only an estate is linked (no contact), or both
- Cost tracked per draft generation

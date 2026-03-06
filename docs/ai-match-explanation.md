# AI Match Explanation

**Module:** Contacts / Matching Engine
**Type:** Automatic
**Priority:** P2

---

## Problem

The matching engine already pairs contact search profiles against active estates (and vice versa). But the results are just a list — the agent sees "Contact X matches Estate Y" and then has to mentally compare dozens of fields to understand *why* it's a match, what's a perfect fit, and what might be a stretch.

Before calling a buyer about a new listing, agents typically open both records side by side and scan through price range, location, room count, area, etc. This takes time and is error-prone, especially when working through a list of 10-20 matches.

---

## Solution

Add an "Explain match" action on each match result. The LLM receives the contact's search profile and the estate's data, then returns a brief structured explanation: what matches well, what's outside the criteria, and a suggested talking point for the agent's outreach call.

---

## User Flow

### From Estate side (run estate against all search profiles):

1. Agent opens estate detail > Matching tab
2. Sees list of matching contacts with match score
3. Clicks "Explain" on a specific match
4. Popover/expandable row shows:
   - **Strong fits:** "Price is within budget, location matches, room count exact"
   - **Stretches:** "Area is 10sqm below minimum, no balcony but profile prefers one"
   - **Suggested pitch:** "Great value in their preferred neighborhood — the price leaves room for renovation to add the missing balcony"

### From Contact side (run search profile against active estates):

Same flow, reversed perspective — explanation focuses on why this estate fits what the contact is looking for.

---

## Data Inputs

- Contact search profile: type preference, price range, area range, room count, location/radius, must-have features
- Estate data: all structured fields

---

## Acceptance Criteria

- Explanation loads on demand (not pre-generated for all matches)
- Response is concise — 3-5 bullet points max, not a wall of text
- Suggested talking point is practical and specific to the match, not generic
- Works for both directions (estate-to-contacts and contact-to-estates)
- Lightweight model usage (short output, no caching since data changes frequently)

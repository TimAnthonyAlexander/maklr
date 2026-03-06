# AI Estate Description Generator

**Module:** Estates
**Type:** Interactive
**Priority:** P2

---

## Problem

Writing compelling property descriptions is the most time-consuming part of listing a property. Agents typically list 5-10 properties per week and spend 15-30 minutes per listing crafting marketing copy. The result quality varies wildly between agents — some write great copy, others paste bullet points.

By the time an agent fills in all structured fields (rooms, area, price, features, location), the system already knows everything needed to write a solid description. The agent shouldn't have to repeat that information in prose.

---

## Solution

Add an "AI Generate" button next to the description editor on the estate create/edit form. When clicked, a dialog opens where the agent selects a tone and optionally adds special notes. The system takes all structured estate data already entered and generates a polished marketing description.

---

## User Flow

1. Agent fills in estate fields as normal (type, rooms, area, price, features, location, etc.)
2. Agent clicks "AI Generate" next to the description field
3. Dialog opens with:
   - **Tone selector:** luxurious, neutral, factual, playful
   - **Additional notes** (optional free text): e.g. "Emphasize the garden" or "Don't mention the busy road"
4. Agent clicks Generate
5. Generated description populates the editor
6. Agent reviews, edits if needed, and saves

---

## Data Inputs

All structured estate fields serve as context for the LLM:

- Property type and marketing type
- Location (city, district, street)
- Rooms, area (total/living), floor, floors total
- Price, additional costs
- Year built, condition, energy rating
- Features (balcony, garden, elevator, parking, etc.)
- Any existing description text (for rewrites)

---

## Acceptance Criteria

- Button only enabled when at least property type, rooms, and area are filled in
- Generated text appears in the existing TipTap editor, fully editable
- Agent can regenerate with different tone without losing manual edits (confirm dialog)
- Works for all property types (apartment, house, commercial, land, garage)
- Cost tracked per generation via existing cost tracking

# AI Brochure Content Generation

**Module:** Documents
**Type:** Automatic
**Priority:** P2 (unblocks MVP item: basic PDF brochure generation)

---

## Problem

The MVP spec includes "Basic PDF brochure generation from estate data + images using a template" — currently unbuilt. Without AI, a brochure generator would dump raw field values into a PDF template: a table of facts and some images. That's functional but not client-ready.

Real estate brochures need marketing copy: a compelling headline, a narrative property description, neighborhood highlights, and a call to action. Today agents either write this manually, pay for copywriting, or skip brochures entirely.

Since the system already has all structured estate data, the LLM can generate the marketing sections automatically during brochure creation.

---

## Solution

When an agent triggers PDF brochure generation for an estate, the system automatically generates the marketing copy sections using the estate's structured data. The agent reviews and can edit the generated content before the final PDF is rendered.

---

## User Flow

1. Agent opens estate detail > Documents tab
2. Clicks "Generate Brochure"
3. System shows a preview/edit screen with:
   - **Headline** (AI-generated from estate highlights)
   - **Property description** (AI-generated or pulled from existing description if already written)
   - **Feature highlights** (AI-selected top selling points from structured data)
   - **Location section** (AI-generated neighborhood summary from city/district)
   - **Fact sheet** (auto-filled from structured fields — not AI, just formatted)
   - **Call to action** (AI-generated with agent contact details)
   - **Image selection** (from uploaded estate images, agent reorders)
4. Agent reviews and edits any section
5. Clicks "Create PDF"
6. PDF generated and saved to estate's documents

---

## Data Inputs

- All structured estate fields (type, price, rooms, area, features, condition, etc.)
- Estate description (if already written — used as-is or enhanced)
- Estate images metadata (count, types)
- Location data (city, district, street)
- Agent/office contact information for the CTA

---

## Relationship to Estate Description Generator

If the agent already used the AI Estate Description Generator (see separate doc), that description is reused here — no need to regenerate. The brochure generator only creates a description if one doesn't exist yet.

The brochure also generates additional sections (headline, highlights, location, CTA) that the estate description feature doesn't cover.

---

## Acceptance Criteria

- All AI-generated sections are editable before PDF creation
- If estate already has a description, it's used instead of generating a new one
- Generated content matches the brochure's tone (professional, marketing-oriented)
- Fact sheet section is purely data-driven (no AI hallucination risk for hard facts)
- PDF includes agent name, phone, email, and office branding
- Generated brochure is saved as a document attachment on the estate
- Works for all property types

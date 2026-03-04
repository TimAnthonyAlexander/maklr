import type { Contact } from "../api/types";

export function getContactDisplayName(contact: Contact): string {
  if (contact.entity_type === "company") {
    return contact.company_name ?? "Unnamed Company";
  }
  const parts = [contact.first_name, contact.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unnamed Contact";
}

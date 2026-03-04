export const colors = {
  brand: {
    taupe: "#9E8B76",
    sage: "#6B8F60",
    golden: "#B89B4A",
    slate: "#6B85A0",
    taupeTint: "#F5F0EB",
    sageTint: "#EDF3EB",
    goldenTint: "#F5F0E5",
    slateTint: "#EBF0F5",
  },

  status: {
    success: { bg: "#E8F5E9", text: "#2E7D32" },
    warning: { bg: "#FFF3E0", text: "#E65100" },
    info: { bg: "#E3F2FD", text: "#1565C0" },
    error: { bg: "#FCE4EC", text: "#C62828" },
    neutral: { bg: "#F5F5F5", text: "#9E9E9E" },
    draft: { bg: "#E0E0E0", text: "#616161" },
  },

  priority: {
    low: { border: "#90CAF9", text: "#1565C0" },
    medium: { border: "#FFE082", text: "#F57F17" },
    high: { border: "#FFAB91", text: "#D84315" },
    urgent: { border: "#EF9A9A", text: "#C62828" },
  },

  contactType: {
    buyer: { bg: "#E3F2FD", text: "#1565C0" },
    seller: { bg: "#E8F5E9", text: "#2E7D32" },
    tenant: { bg: "#FFF3E0", text: "#E65100" },
    landlord: { bg: "#F3E5F5", text: "#6A1B9A" },
    misc: { bg: "#F5F5F5", text: "#616161" },
  },

  calendar: {
    viewing: "#2196F3",
    meeting: "#4CAF50",
    call: "#FF9800",
    handover: "#9C27B0",
    inspection: "#00BCD4",
    open_house: "#E91E63",
    signing: "#3F51B5",
    valuation: "#795548",
    photography: "#607D8B",
    other: "#9E9E9E",
  },

  activity: {
    task_created_from_email: "#7e57c2",
    contact_linked_to_estate: "#29b6f6",
    deleted: "#ef5350",
    created: "#66bb6a",
    changed: "#42a5f5",
    phone_call: "#ab47bc",
    meeting: "#ff7043",
    note: "#78909c",
    viewing: "#26a69a",
    default: "#78909c",
  },

  neutral: {
    text: "#1A1A1A",
    textSecondary: "#8A8A8A",
    background: "#FAFAFA",
    paper: "#FFFFFF",
    divider: "rgba(0,0,0,0.06)",
  },

  chart: {
    default: ["#1A1A1A", "#6B6B6B", "#9E9E9E", "#BDBDBD", "#E0E0E0"],
  },
} as const;

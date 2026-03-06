import { Box, Typography, Chip, Skeleton } from "@mui/material";
import {
  Home as EstateIcon,
  User as ContactIcon,
  CheckCircle as TaskIcon,
  Calendar as AppointmentIcon,
  Phone as PhoneIcon,
  Users as MeetingIcon,
  StickyNote as NoteIcon,
  Eye as ViewingIcon,
  Trash2 as DeleteIcon,
  ArrowLeftRight as ChangeIcon,
  Plus as CreateIcon,
  Pencil as EditIcon,
  Mail as EmailIcon,
  Link as LinkIcon,
  Unlink as UnlinkIcon,
} from "lucide-react";
import type { Activity, ActivityListQueryParams } from "../../api/types";
import { useTranslation } from "../../contexts/LanguageContext";
import { useGetActivityList } from "../../api/hooks";
import { colors } from "../../theme/colors";

function getActivityIcon(type: string) {
  if (type === "task_created_from_email")
    return <EmailIcon size={20} />;
  if (type === "contact_linked_to_estate")
    return <LinkIcon size={20} />;
  if (type === "contact_unlinked_from_estate")
    return <UnlinkIcon size={20} />;
  if (type.includes("deleted")) return <DeleteIcon size={20} />;
  if (type.includes("created")) return <CreateIcon size={20} />;
  if (type.includes("changed") || type.includes("updated"))
    return <ChangeIcon size={20} />;
  if (type === "phone_call") return <PhoneIcon size={20} />;
  if (type === "meeting") return <MeetingIcon size={20} />;
  if (type === "note") return <NoteIcon size={20} />;
  if (type === "viewing") return <ViewingIcon size={20} />;
  return <EditIcon size={20} />;
}

function getActivityColor(type: string): string {
  if (type === "task_created_from_email") return colors.activity.task_created_from_email;
  if (type === "contact_linked_to_estate") return colors.activity.contact_linked_to_estate;
  if (type === "contact_unlinked_from_estate") return colors.activity.deleted;
  if (type.includes("deleted")) return colors.activity.deleted;
  if (type.includes("created")) return colors.activity.created;
  if (type.includes("changed") || type.includes("updated")) return colors.activity.changed;
  if (type === "phone_call") return colors.activity.phone_call;
  if (type === "meeting") return colors.activity.meeting;
  if (type === "note") return colors.activity.note;
  if (type === "viewing") return colors.activity.viewing;
  return colors.activity.default;
}

function getEntityChip(activity: Activity, t: (key: string) => string) {
  const chips: { label: string; icon: React.ReactElement }[] = [];
  if (activity.estate_id)
    chips.push({
      label: t("activity.entity.estate"),
      icon: <EstateIcon size={14} />,
    });
  if (activity.contact_id)
    chips.push({
      label: t("activity.entity.contact"),
      icon: <ContactIcon size={14} />,
    });
  if (activity.task_id)
    chips.push({
      label: t("activity.entity.task"),
      icon: <TaskIcon size={14} />,
    });
  if (activity.appointment_id)
    chips.push({
      label: t("activity.entity.appointment"),
      icon: <AppointmentIcon size={14} />,
    });
  return chips;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface ActivityTimelineProps {
  activities: Activity[];
  loading: boolean;
}

export function ActivityTimeline({
  activities,
  loading,
}: ActivityTimelineProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={80} />
        ))}
      </Box>
    );
  }

  if (activities.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          {t("activity.list.empty")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {activities.map((activity) => {
        const color = getActivityColor(activity.type ?? "");
        const entityChips = getEntityChip(activity, t);

        return (
          <Box
            key={activity.id}
            sx={{
              display: "flex",
              gap: 2,
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            {/* Icon */}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                bgcolor: color + "1A",
                color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              {getActivityIcon(activity.type ?? "")}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {activity.subject}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ flexShrink: 0 }}
                >
                  {activity.created_at
                    ? formatRelativeTime(activity.created_at)
                    : "\u2014"}
                </Typography>
              </Box>

              {activity.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {activity.description}
                </Typography>
              )}

              {(activity.old_value || activity.new_value) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {activity.old_value} &rarr; {activity.new_value}
                </Typography>
              )}

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
              >
                {activity.user?.name && (
                  <Typography variant="caption" color="text.secondary">
                    {activity.user.name}
                  </Typography>
                )}
                {entityChips.map((chip) => (
                  <Chip
                    key={chip.label}
                    label={chip.label}
                    icon={chip.icon}
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: "0.7rem" }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

interface EntityActivityTimelineProps {
  entityType: "contact" | "estate" | "task" | "email" | "user";
  entityId: string;
}

export function EntityActivityTimeline({
  entityType,
  entityId,
}: EntityActivityTimelineProps) {
  const query: ActivityListQueryParams = {
    [`${entityType}_id`]: entityId,
    per_page: 50,
  };

  const { data, loading } = useGetActivityList(query, undefined, [
    entityType,
    entityId,
  ]);

  return (
    <ActivityTimeline activities={data?.items ?? []} loading={loading} />
  );
}

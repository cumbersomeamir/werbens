"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PostLayout } from "./PostLayout";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import {
  getSocialAccounts,
  createScheduledPost,
  getScheduledPosts,
  deleteScheduledPost,
} from "@/api/services/socialService";
import {
  XContentForm,
  LinkedInContentForm,
  InstagramContentForm,
  FacebookContentForm,
  GenericContentForm,
} from "./platforms";
import { PLATFORM_LABELS, FRONTEND_PLATFORM_MAP, BACKEND_PLATFORM_MAP } from "./utils";

const CALENDAR_DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EVENT_COLORS = [
  { solid: "#0f766e", soft: "rgba(15,118,110,0.13)" },
  { solid: "#2563eb", soft: "rgba(37,99,235,0.13)" },
  { solid: "#7c3aed", soft: "rgba(124,58,237,0.13)" },
  { solid: "#b45309", soft: "rgba(180,83,9,0.13)" },
  { solid: "#be123c", soft: "rgba(190,18,60,0.13)" },
  { solid: "#0d9488", soft: "rgba(13,148,136,0.13)" },
  { solid: "#4f46e5", soft: "rgba(79,70,229,0.13)" },
  { solid: "#0369a1", soft: "rgba(3,105,161,0.13)" },
  { solid: "#15803d", soft: "rgba(21,128,61,0.13)" },
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toLocalInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function defaultScheduleInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);
  date.setSeconds(0, 0);
  return toLocalInputValue(date);
}

function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatLongDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function monthLabel(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function getMonthGridRange(monthCursor) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  gridStart.setHours(0, 0, 0, 0);

  const gridEnd = new Date(last);
  gridEnd.setDate(last.getDate() + (6 - last.getDay()));
  gridEnd.setHours(23, 59, 59, 999);

  return { gridStart, gridEnd };
}

function buildMonthCells(monthCursor) {
  const { gridStart } = getMonthGridRange(monthCursor);
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + i);
    cells.push({
      date: current,
      key: toDateKey(current),
      inCurrentMonth: current.getMonth() === monthCursor.getMonth(),
    });
  }
  return cells;
}

function buildEventPreview(item) {
  const content = item?.content || {};
  const preview =
    content.x_text ||
    content.linkedin_text ||
    content.instagram_caption ||
    content.facebook_message ||
    content.title ||
    content.body ||
    "";
  return String(preview || "").trim();
}

function groupEventsBySlot(events) {
  const groups = new Map();
  for (const event of Array.isArray(events) ? events : []) {
    const date = new Date(event?.scheduledAt || 0);
    if (Number.isNaN(date.getTime())) continue;
    const slot = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    if (!groups.has(slot)) groups.set(slot, []);
    groups.get(slot).push(event);
  }
  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

function hashString(value) {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getColorForAccount(accountKey) {
  const idx = hashString(accountKey) % EVENT_COLORS.length;
  return EVENT_COLORS[idx];
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (!value) return "pending";
  return value;
}

function statusBadgeClass(status) {
  const value = normalizeStatus(status);
  if (value === "posted") return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  if (value === "failed") return "bg-red-100 text-red-800 border border-red-200";
  if (value === "cancelled") return "bg-slate-100 text-slate-700 border border-slate-200";
  if (value === "processing") return "bg-amber-100 text-amber-800 border border-amber-200";
  return "bg-cyan-100 text-cyan-800 border border-cyan-200";
}

function CalendarGrid({
  monthCursor,
  selectedDayKey,
  onSelectDay,
  eventsByDate,
  accountLabelsByKey,
}) {
  const cells = useMemo(() => buildMonthCells(monthCursor), [monthCursor]);

  return (
    <div className="rounded-2xl border border-werbens-steel/30 bg-white">
      <div className="grid grid-cols-7 border-b border-werbens-steel/20">
        {CALENDAR_DAY_HEADERS.map((day) => (
          <div key={day} className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-werbens-muted text-center">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, cellIndex) => {
          const events = eventsByDate[cell.key] || [];
          const slotGroups = groupEventsBySlot(events);
          const columnIndex = cellIndex % 7;
          const tooltipAlignClass = columnIndex >= 5 ? "right-1" : "left-1";
          const isSelected = cell.key === selectedDayKey;
          const isToday = cell.key === toDateKey(new Date());
          return (
            <button
              type="button"
              key={cell.key}
              onClick={() => onSelectDay(cell.key)}
              className={`group relative min-h-[128px] border-r border-b border-werbens-steel/20 p-2 text-left align-top transition-colors ${
                isSelected ? "bg-werbens-light-cyan/10" : "bg-white hover:bg-werbens-mist/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${
                    isToday ? "bg-werbens-dark-cyan text-white" : "text-werbens-text"
                  } ${cell.inCurrentMonth ? "" : "opacity-45"}`}
                >
                  {cell.date.getDate()}
                </span>
                {events.length > 0 ? (
                  <span className="text-[10px] text-werbens-muted">{events.length}</span>
                ) : null}
              </div>

              <div className="mt-2 space-y-1.5">
                {slotGroups.slice(0, 3).map(([slot, slotItems]) => {
                  const leadEvent = slotItems[0];
                  const accountKey = `${leadEvent?.platform}:${leadEvent?.channelId}`;
                  const color = getColorForAccount(accountKey);
                  const label = accountLabelsByKey[accountKey] || leadEvent?.targetDisplayName || leadEvent?.channelId;
                  return (
                    <div
                      key={`${cell.key}-${slot}`}
                      className="rounded-md px-1.5 py-1 text-[10px] leading-tight border truncate"
                      style={{ borderColor: color.solid, backgroundColor: color.soft, color: color.solid }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-semibold truncate">{slot}</div>
                        {slotItems.length > 1 ? <span>+{slotItems.length - 1}</span> : null}
                      </div>
                      <div className="truncate">{label}</div>
                    </div>
                  );
                })}
                {slotGroups.length > 3 ? (
                  <div className="text-[10px] text-werbens-muted">+{slotGroups.length - 3} more slots</div>
                ) : null}
              </div>

              {events.length > 0 ? (
                <div
                  className={`pointer-events-none absolute top-1 z-40 hidden w-[300px] rounded-xl border border-werbens-steel/25 bg-white p-3 text-left shadow-2xl lg:block ${tooltipAlignClass} opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100`}
                >
                  <p className="text-xs font-semibold text-werbens-text">
                    {formatLongDate(cell.date)} · {events.length} scheduled
                  </p>
                  <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
                    {slotGroups.map(([slot, slotItems]) => (
                      <div key={`hover-${cell.key}-${slot}`} className="rounded-lg border border-werbens-steel/20 bg-werbens-mist/20 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold text-werbens-text">{slot}</p>
                          {slotItems.length > 1 ? (
                            <span className="text-[10px] rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
                              {slotItems.length} overlapping
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 space-y-1">
                          {slotItems.map((event) => {
                            const accountKey = `${event.platform}:${event.channelId}`;
                            const color = getColorForAccount(accountKey);
                            const label = accountLabelsByKey[accountKey] || event?.targetDisplayName || event.channelId;
                            const preview = buildEventPreview(event);
                            return (
                              <div key={`hover-event-${event.id}`} className="rounded-md border bg-white px-2 py-1" style={{ borderColor: color.solid }}>
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color.solid }} />
                                  <span className="text-[11px] font-semibold text-werbens-text">
                                    {PLATFORM_LABELS[event.platform] || event.platform}
                                  </span>
                                  <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${statusBadgeClass(event.status)}`}>
                                    {event.status}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[10px] text-werbens-muted truncate">{label}</p>
                                {preview ? <p className="mt-0.5 text-[10px] text-werbens-text truncate">{preview}</p> : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlatformSelector({ availableTargets, selectedTarget, onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {availableTargets.map((target) => {
        const selected =
          selectedTarget?.platform === target.platform && selectedTarget?.channelId === target.channelId;
        return (
          <button
            key={`${target.platform}-${target.channelId}`}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onToggle(target);
            }}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
              selected
                ? "border-werbens-light-cyan bg-werbens-light-cyan/10 text-werbens-text"
                : "border-werbens-steel/30 bg-white/80 text-werbens-muted hover:border-werbens-steel/60"
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{PLATFORM_LABELS[target.platform] || target.platform}</p>
              <p className="text-[11px] text-werbens-muted truncate">
                {target.displayName || target.username || target.channelId}
              </p>
            </div>
            {selected ? (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-werbens-dark-cyan text-[10px] text-white">
                ✓
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

async function fetchTargets(userId) {
  if (!userId) return [];
  const response = await getSocialAccounts(userId);
  const accounts = Array.isArray(response?.accounts) ? response.accounts : [];
  const targets = [];

  for (const account of accounts) {
    const platform = account?.platform;
    if (!platform) continue;
    if (Array.isArray(account?.channels) && account.channels.length > 0) {
      for (const channel of account.channels) {
        const channelId = String(channel?.channelId || channel?.pageId || channel?.igId || "").trim();
        if (!channelId) continue;
        targets.push({
          platform,
          channelId,
          displayName: channel?.title || channel?.name || channel?.username || account?.displayName || account?.username || channelId,
          username: account?.username || "",
        });
      }
      continue;
    }

    const fallbackChannelId = String(account?.platformUserId || account?.channelId || "").trim();
    if (!fallbackChannelId) continue;
    targets.push({
      platform,
      channelId: fallbackChannelId,
      displayName: account?.displayName || account?.username || fallbackChannelId,
      username: account?.username || "",
    });
  }

  return targets;
}

export function PostSchedule() {
  const { userId } = useCurrentUser();
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targets, setTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);

  const [content, setContent] = useState({
    title: "",
    body: "",
    hashtags: "",
    x_text: "",
    x_media_ids: [],
    x_poll_options: [],
    x_poll_duration_minutes: 60,
    x_reply_to_tweet_id: "",
    x_quote_tweet_id: "",
    x_geo_place_id: "",
    x_for_super_followers_only: false,
    linkedin_text: "",
    linkedin_media_urn: "",
    linkedin_media_title: "",
    linkedin_media_alt_text: "",
    linkedin_visibility: "PUBLIC",
    linkedin_disable_reshare: false,
    instagram_image_url: "",
    instagram_caption: "",
    instagram_alt_text: "",
    facebook_message: "",
    facebook_link: "",
  });

  const [scheduledAt, setScheduledAt] = useState(defaultScheduleInputValue);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState(() => toDateKey(new Date()));
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [scheduledSummary, setScheduledSummary] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    posted: 0,
    failed: 0,
    cancelled: 0,
  });
  const [scheduledItems, setScheduledItems] = useState([]);
  const [deleteBusyId, setDeleteBusyId] = useState("");

  const isXSelected = selectedTarget?.platform === "x";
  const isLinkedInSelected = selectedTarget?.platform === "linkedin";
  const isInstagramSelected = selectedTarget?.platform === "instagram";
  const isFacebookSelected = selectedTarget?.platform === "facebook";

  const accountLabelsByKey = useMemo(() => {
    const map = {};
    for (const target of targets) {
      const key = `${target.platform}:${target.channelId}`;
      map[key] = target.displayName || target.username || target.channelId;
    }
    return map;
  }, [targets]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const item of scheduledItems) {
      const key = toDateKey(item?.scheduledAt);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return map;
  }, [scheduledItems]);

  const selectedDayEvents = useMemo(() => {
    return eventsByDate[selectedDayKey] || [];
  }, [eventsByDate, selectedDayKey]);

  const overlapGroups = useMemo(() => {
    return groupEventsBySlot(selectedDayEvents);
  }, [selectedDayEvents]);

  const loadTargets = useCallback(async () => {
    if (!userId) return;
    setLoadingTargets(true);
    try {
      const list = await fetchTargets(userId);
      setTargets(list);
      setSelectedTarget((current) => {
        if (current && list.some((target) => target.platform === current.platform && target.channelId === current.channelId)) {
          return current;
        }
        return list[0] || null;
      });
    } catch (err) {
      console.error("loadTargets error:", err);
      setStatus({ type: "error", text: err?.message || "Failed to load connected accounts." });
    } finally {
      setLoadingTargets(false);
    }
  }, [userId]);

  const loadScheduled = useCallback(async () => {
    if (!userId) return;
    const { gridStart, gridEnd } = getMonthGridRange(monthCursor);
    setLoadingScheduled(true);
    try {
      const response = await getScheduledPosts(userId, {
        start: gridStart.toISOString(),
        end: gridEnd.toISOString(),
      });
      const items = Array.isArray(response?.items) ? response.items : [];
      setScheduledItems(items);
      setScheduledSummary(
        response?.summary || {
          total: items.length,
          pending: items.filter((item) => item.status === "pending").length,
          processing: items.filter((item) => item.status === "processing").length,
          posted: items.filter((item) => item.status === "posted").length,
          failed: items.filter((item) => item.status === "failed").length,
          cancelled: items.filter((item) => item.status === "cancelled").length,
        }
      );
    } catch (err) {
      console.error("loadScheduled error:", err);
      setStatus({ type: "error", text: err?.message || "Failed to load scheduled posts." });
    } finally {
      setLoadingScheduled(false);
    }
  }, [userId, monthCursor]);

  useEffect(() => {
    if (!userId) return;
    loadTargets();
  }, [userId, loadTargets]);

  useEffect(() => {
    if (!userId) return;
    loadScheduled();
  }, [userId, loadScheduled]);

  function validateContent() {
    if (!selectedTarget) {
      return "Select a destination channel first.";
    }
    if (isXSelected) {
      if (!content.x_text || content.x_text.trim().length === 0) {
        return "Tweet text is required for X.";
      }
      if (content.x_text.length > 280) {
        return `Tweet exceeds 280 characters (${content.x_text.length} characters).`;
      }
      return "";
    }
    if (isLinkedInSelected) {
      if (!content.linkedin_text || content.linkedin_text.trim().length === 0) {
        return "Post text is required for LinkedIn.";
      }
      return "";
    }
    if (isInstagramSelected) {
      if (!content.instagram_image_url || content.instagram_image_url.trim().length === 0) {
        return "Image URL is required for Instagram.";
      }
      try {
        new URL(content.instagram_image_url.trim());
      } catch {
        return "Please provide a valid Instagram image URL.";
      }
      if (content.instagram_caption && content.instagram_caption.length > 2200) {
        return "Instagram caption exceeds 2200 characters.";
      }
      return "";
    }
    if (isFacebookSelected) {
      if (!content.facebook_message || content.facebook_message.trim().length === 0) {
        return "Facebook message is required.";
      }
      if (content.facebook_link) {
        try {
          new URL(content.facebook_link.trim());
        } catch {
          return "Please provide a valid Facebook link URL.";
        }
      }
      return "";
    }
    if (!content.title && !content.body) {
      return "Add a title or description.";
    }
    return "";
  }

  function buildContentPayload() {
    const payload = {};
    if (isXSelected) {
      payload.x_text = content.x_text.trim();
      if (content.x_media_ids.length > 0) payload.x_media_ids = content.x_media_ids;
      if (content.x_poll_options.length >= 2) {
        payload.x_poll = {
          options: content.x_poll_options,
          duration_minutes: content.x_poll_duration_minutes || 60,
        };
      }
      if (content.x_reply_to_tweet_id) payload.x_reply_to_tweet_id = content.x_reply_to_tweet_id.trim();
      if (content.x_quote_tweet_id) payload.x_quote_tweet_id = content.x_quote_tweet_id.trim();
      if (content.x_geo_place_id) payload.x_geo_place_id = content.x_geo_place_id.trim();
      if (content.x_for_super_followers_only) payload.x_for_super_followers_only = true;
      return payload;
    }
    if (isLinkedInSelected) {
      payload.linkedin_text = content.linkedin_text.trim();
      if (content.linkedin_media_urn) payload.linkedin_media_urn = content.linkedin_media_urn.trim();
      if (content.linkedin_media_title) payload.linkedin_media_title = content.linkedin_media_title.trim();
      if (content.linkedin_media_alt_text) payload.linkedin_media_alt_text = content.linkedin_media_alt_text.trim();
      if (content.linkedin_visibility) payload.linkedin_visibility = content.linkedin_visibility;
      if (content.linkedin_disable_reshare) payload.linkedin_disable_reshare = true;
      return payload;
    }
    if (isInstagramSelected) {
      payload.instagram_image_url = content.instagram_image_url.trim();
      if (content.instagram_caption) payload.instagram_caption = content.instagram_caption.trim();
      if (content.instagram_alt_text) payload.instagram_alt_text = content.instagram_alt_text.trim();
      return payload;
    }
    if (isFacebookSelected) {
      payload.facebook_message = content.facebook_message.trim();
      if (content.facebook_link) payload.facebook_link = content.facebook_link.trim();
      return payload;
    }
    payload.title = content.title;
    payload.body = content.body;
    payload.hashtags = content.hashtags
      ? content.hashtags
          .split(/[,\s]+/)
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!userId) {
      setStatus({ type: "error", text: "Sign in to schedule content." });
      return;
    }
    if (!selectedTarget) {
      setStatus({ type: "error", text: "Select a destination channel first." });
      return;
    }
    if (!scheduledAt) {
      setStatus({ type: "error", text: "Choose a date and time." });
      return;
    }

    const scheduleDate = new Date(scheduledAt);
    if (Number.isNaN(scheduleDate.getTime())) {
      setStatus({ type: "error", text: "Scheduled date/time is invalid." });
      return;
    }
    if (scheduleDate.getTime() <= Date.now() + 5 * 1000) {
      setStatus({ type: "error", text: "Scheduled time must be in the future." });
      return;
    }

    const validationError = validateContent();
    if (validationError) {
      setStatus({ type: "error", text: validationError });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const payload = {
        userId,
        mode: "scheduled",
        targets: [
          {
            platform:
              BACKEND_PLATFORM_MAP[FRONTEND_PLATFORM_MAP[selectedTarget.platform] || selectedTarget.platform] ||
              selectedTarget.platform,
            channelId: selectedTarget.channelId,
            displayName: selectedTarget.displayName || "",
            username: selectedTarget.username || "",
          },
        ],
        content: {
          ...buildContentPayload(),
          metadata: {
            source: "post/schedule",
            selectedPlatform: selectedTarget.platform,
            selectedChannelId: selectedTarget.channelId,
            selectedDisplayName: selectedTarget.displayName || "",
            selectedUsername: selectedTarget.username || "",
          },
        },
        scheduledAt: scheduleDate.toISOString(),
      };

      const result = await createScheduledPost(payload);
      const insertedCount = Number(result?.insertedCount || 0);
      setStatus({
        type: "success",
        text: insertedCount > 0 ? `Scheduled ${insertedCount} post${insertedCount > 1 ? "s" : ""} successfully.` : "Scheduled successfully.",
      });

      setContent((prev) => ({
        ...prev,
        title: "",
        body: "",
        hashtags: "",
        x_text: "",
        linkedin_text: "",
        instagram_image_url: "",
        instagram_caption: "",
        instagram_alt_text: "",
        facebook_message: "",
        facebook_link: "",
      }));

      await loadScheduled();
      setSelectedDayKey(toDateKey(scheduleDate));
    } catch (err) {
      console.error("handleSubmit error:", err);
      setStatus({ type: "error", text: err?.message || "Failed to schedule post." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteScheduledPost(item) {
    if (!item?.id || !userId) return;
    setDeleteBusyId(item.id);
    setStatus(null);
    try {
      await deleteScheduledPost(userId, item.id);
      setStatus({ type: "success", text: "Scheduled post cancelled." });
      await loadScheduled();
    } catch (err) {
      setStatus({ type: "error", text: err?.message || "Failed to cancel scheduled post." });
    } finally {
      setDeleteBusyId("");
    }
  }

  const today = new Date();
  const todayKey = toDateKey(today);

  return (
    <PostLayout>
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-werbens-text">
          Schedule <span className="gradient-text">posts</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-werbens-muted max-w-3xl">
          Queue posts for exact times, track all scheduled items in a calendar view, and manage overlapping schedules across accounts.
        </p>
      </div>

      {status ? (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            status.type === "error"
              ? "bg-red-50 text-red-800 border border-red-100"
              : "bg-emerald-50 text-emerald-800 border border-emerald-100"
          }`}
          role="alert"
        >
          {status.text}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-4">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-white/90 border border-werbens-steel/30 shadow-elevated p-4 sm:p-5 h-fit"
        >
          <div>
            <h2 className="text-sm font-semibold text-werbens-text">Destination</h2>
            <p className="text-xs text-werbens-muted mt-0.5">Select one connected account/channel for this schedule.</p>
          </div>

          {loadingTargets ? (
            <p className="text-sm text-werbens-muted">Loading connected accounts...</p>
          ) : targets.length === 0 ? (
            <p className="text-sm text-werbens-muted">Connect accounts on the Accounts page before scheduling posts.</p>
          ) : (
            <PlatformSelector
              availableTargets={targets}
              selectedTarget={selectedTarget}
              onToggle={(target) =>
                setSelectedTarget((current) =>
                  current?.platform === target.platform && current?.channelId === target.channelId ? null : target
                )
              }
            />
          )}

          <div className="border-t border-werbens-steel/20 pt-4 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-werbens-text">Content</h2>
              <p className="text-xs text-werbens-muted mt-0.5">
                {isXSelected
                  ? "X-specific fields."
                  : isLinkedInSelected
                  ? "LinkedIn-specific fields."
                  : isInstagramSelected
                  ? "Instagram requires an image URL."
                  : isFacebookSelected
                  ? "Facebook Page post fields."
                  : "Generic title/body content."}
              </p>
            </div>

            {isXSelected ? (
              <XContentForm content={content} setContent={setContent} />
            ) : isLinkedInSelected ? (
              <LinkedInContentForm content={content} setContent={setContent} />
            ) : isInstagramSelected ? (
              <InstagramContentForm content={content} setContent={setContent} />
            ) : isFacebookSelected ? (
              <FacebookContentForm content={content} setContent={setContent} />
            ) : (
              <GenericContentForm content={content} setContent={setContent} />
            )}
          </div>

          <div className="border-t border-werbens-steel/20 pt-4 space-y-2">
            <label className="text-sm font-semibold text-werbens-text" htmlFor="scheduled-at">
              Date & time
            </label>
            <input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              min={toLocalInputValue(new Date())}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="w-full rounded-lg border border-werbens-steel/40 bg-white px-3 py-2 text-sm text-werbens-text shadow-sm focus-ring"
            />
            <p className="text-[11px] text-werbens-muted">
              Uses your local timezone. Scheduled jobs are executed server-side and may shift slightly due to platform safety limits.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting || !selectedTarget}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Scheduling..." : "Schedule post"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white/90 border border-werbens-steel/30 shadow-elevated p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-werbens-text">{monthLabel(monthCursor)}</h2>
                <p className="text-xs text-werbens-muted">Calendar of scheduled posts. Overlaps are shown per day and time slot.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="rounded-lg border border-werbens-steel/30 px-3 py-1.5 text-xs font-medium text-werbens-text hover:bg-werbens-mist/40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const base = new Date();
                    setMonthCursor(new Date(base.getFullYear(), base.getMonth(), 1));
                    setSelectedDayKey(todayKey);
                  }}
                  className="rounded-lg border border-werbens-steel/30 px-3 py-1.5 text-xs font-medium text-werbens-text hover:bg-werbens-mist/40"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="rounded-lg border border-werbens-steel/30 px-3 py-1.5 text-xs font-medium text-werbens-text hover:bg-werbens-mist/40"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={loadScheduled}
                  disabled={loadingScheduled}
                  className="rounded-lg bg-werbens-dark-cyan text-white px-3 py-1.5 text-xs font-semibold hover:opacity-95 disabled:opacity-60"
                >
                  {loadingScheduled ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2">
              <div className="rounded-lg bg-werbens-mist/35 border border-werbens-steel/20 px-2.5 py-2">
                <p className="text-[11px] uppercase tracking-wider text-werbens-muted">Total</p>
                <p className="text-lg font-semibold text-werbens-text">{scheduledSummary.total}</p>
              </div>
              <div className="rounded-lg bg-cyan-50 border border-cyan-100 px-2.5 py-2">
                <p className="text-[11px] uppercase tracking-wider text-cyan-700">Pending</p>
                <p className="text-lg font-semibold text-cyan-900">{scheduledSummary.pending}</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-2">
                <p className="text-[11px] uppercase tracking-wider text-amber-700">Processing</p>
                <p className="text-lg font-semibold text-amber-900">{scheduledSummary.processing}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-2">
                <p className="text-[11px] uppercase tracking-wider text-emerald-700">Posted</p>
                <p className="text-lg font-semibold text-emerald-900">{scheduledSummary.posted}</p>
              </div>
              <div className="rounded-lg bg-red-50 border border-red-100 px-2.5 py-2">
                <p className="text-[11px] uppercase tracking-wider text-red-700">Failed</p>
                <p className="text-lg font-semibold text-red-900">{scheduledSummary.failed}</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">
                <p className="text-[11px] uppercase tracking-wider text-slate-600">Cancelled</p>
                <p className="text-lg font-semibold text-slate-900">{scheduledSummary.cancelled}</p>
              </div>
            </div>

            <div className="mt-4">
              <CalendarGrid
                monthCursor={monthCursor}
                selectedDayKey={selectedDayKey}
                onSelectDay={setSelectedDayKey}
                eventsByDate={eventsByDate}
                accountLabelsByKey={accountLabelsByKey}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white/90 border border-werbens-steel/30 shadow-elevated p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-werbens-text">
              Scheduled for {selectedDayKey ? formatLongDate(selectedDayKey) : "selected day"}
            </h3>

            {selectedDayEvents.length === 0 ? (
              <p className="mt-2 text-sm text-werbens-muted">No scheduled posts for this day.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {overlapGroups.map(([slot, items]) => (
                  <div key={slot} className="rounded-xl border border-werbens-steel/20 bg-werbens-mist/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-werbens-muted">{slot}</p>
                      {items.length > 1 ? (
                        <span className="text-[11px] rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
                          {items.length} overlapping
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 space-y-2">
                      {items.map((item) => {
                        const accountKey = `${item.platform}:${item.channelId}`;
                        const color = getColorForAccount(accountKey);
                        const preview = buildEventPreview(item);
                        const canCancel = item.status === "pending";
                        return (
                          <div
                            key={item.id}
                            className="rounded-lg border bg-white p-3"
                            style={{ borderColor: color.solid }}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: color.solid }}
                                  />
                                  <p className="text-sm font-semibold text-werbens-text">
                                    {PLATFORM_LABELS[item.platform] || item.platform}
                                  </p>
                                  <span className={`text-[10px] rounded-full px-2 py-0.5 ${statusBadgeClass(item.status)}`}>
                                    {item.status}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-werbens-muted">
                                  {accountLabelsByKey[accountKey] || item?.targetDisplayName || item?.targetUsername || item.channelId} • {formatDateTime(item.scheduledAt)}
                                </p>
                                <p className="mt-2 text-sm text-werbens-text line-clamp-2">{preview || "No preview text available."}</p>
                                {item.error?.message ? (
                                  <p className="mt-2 text-xs text-red-700">{item.error.message}</p>
                                ) : null}
                              </div>

                              <div className="shrink-0">
                                <button
                                  type="button"
                                  disabled={!canCancel || deleteBusyId === item.id}
                                  onClick={() => handleDeleteScheduledPost(item)}
                                  className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deleteBusyId === item.id ? "Cancelling..." : "Cancel"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PostLayout>
  );
}

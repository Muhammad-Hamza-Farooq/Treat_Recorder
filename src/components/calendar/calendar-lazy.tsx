"use client";

import dynamic from "next/dynamic";
import type { CalendarEvent } from "@/components/calendar/calendar-view";

const CalendarView = dynamic(
  () => import("@/components/calendar/calendar-view").then((m) => ({ default: m.CalendarView })),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[28rem] animate-pulse rounded-xl border border-border bg-muted/20"
        aria-label="Loading calendar"
      />
    ),
  }
);

export function CalendarLazy({ events }: { events: CalendarEvent[] }) {
  return <CalendarView events={events} />;
}

export type { CalendarEvent };

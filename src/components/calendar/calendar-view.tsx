"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { useRouter } from "next/navigation";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  color: string;
  href: string;
};

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      height="auto"
      firstDay={1}
      headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        backgroundColor: e.color,
        borderColor: e.color,
        extendedProps: { href: e.href },
      }))}
      eventClick={(info) => {
        info.jsEvent.preventDefault();
        router.push(info.event.extendedProps.href as string);
      }}
    />
  );
}

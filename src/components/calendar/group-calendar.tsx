"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

type CalEvent = {
  id: string;
  title: string;
  start: string;
  backgroundColor?: string;
  borderColor?: string;
  url?: string;
};

export function GroupCalendar({ events }: { events: CalEvent[] }) {
  return (
    <div className="tt-calendar text-sm">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        }}
        height="auto"
        events={events}
        eventDisplay="block"
      />
      <style jsx global>{`
        .tt-calendar .fc {
          --fc-border-color: var(--border);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: var(--card-muted);
          --fc-button-bg-color: var(--accent);
          --fc-button-border-color: var(--accent);
          --fc-button-text-color: var(--accent-fg);
          --fc-button-hover-bg-color: var(--accent);
          --fc-today-bg-color: color-mix(in srgb, var(--glow-a) 35%, transparent);
        }
        .tt-calendar .fc-theme-standard td,
        .tt-calendar .fc-theme-standard th {
          border-color: var(--border);
        }
        .tt-calendar .fc-toolbar-title {
          font-size: 1.1rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

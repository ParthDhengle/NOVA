import React from "react";

interface CalendarEmbedProps {
  calendarId: string;
  mode?: "WEEK" | "MONTH" | "AGENDA";
  timezone?: string;
  width?: string | number;
  height?: string | number;
  refreshKey?: number;
}

export default function CalendarEmbed({
  calendarId,
  mode = "WEEK",
  timezone = "Asia/Kolkata",
  width = "100%",
  height = "100%",
  refreshKey = 0,
}: CalendarEmbedProps) {
  const src =
    `https://calendar.google.com/calendar/embed?` +
    `src=${encodeURIComponent(calendarId)}` +
    `&ctz=${encodeURIComponent(timezone)}` +
    `&mode=${mode}` +
    `&_=${refreshKey}`;

  return (
    <iframe
      key={refreshKey}
      title="Google Calendar"
      src={src}
      frameBorder={0}
      className="w-full h-full rounded-xl"
      style={{
        border: 0,
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}
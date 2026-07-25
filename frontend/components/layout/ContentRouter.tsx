"use client";

import { useNova } from "@/context/NovaContext";

import FullChat from "@/components/chat/FullChat";
import SchedulerKanban from "@/components/scheduler/SchedulerKanban";
import DashboardCard from "@/components/dashboard/DashboardCard";
import Settings from "@/components/settings/Settings";

export default function ContentRouter() {
  const { state } = useNova();

  switch (state.view) {
    case "chat":
      return <FullChat showAgentOps={true} />;

    case "scheduler":
      return <SchedulerKanban />;

    case "dashboard":
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <DashboardCard />
        </div>
      );

    case "settings":
      return <Settings />;

    default:
      return <FullChat showAgentOps={true} />;
  }
}
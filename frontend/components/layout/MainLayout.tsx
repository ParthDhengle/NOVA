import React from 'react';
import { useNova } from '@/context/NovaContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import {Button}  from '@/components/ui/button';
// import FullChat from '@/components/chat/FullChat';
// import SchedulerKanban from '../scheduler/SchedulerKanban';
// import DashboardCard from '../dashboard/DashboardCard';
// import Settings from '../settings/Settings';
import AgentOpsPanel from '../dashboard/AgentOpsPanel';
import ContentRouter from "./ContentRouter";

export default function MainLayout() {
  
  const { state, dispatch } = useNova();

  // Toggle sidebar via hamburger
  const toggleSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: !state.sidebarCollapsed });
  };

  

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
    
      {/* Single Topbar with Hamburger */}
      <div className="shrink-0">
        <Topbar showSearch={state.view === 'chat'}>
          {/* Hamburger - Always present */}
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleSidebar}
            className="ml-2 w-8 h-8 p-0" // Show always, not just lg:hidden
          >
            <Menu size={16} />
          </Button>
        </Topbar>
      </div>

      {/* Sidebar + Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Collapsible Sidebar */}
        <motion.div
          initial={{ x: state.sidebarCollapsed ? -250 : 0 }}
          animate={{ x: state.sidebarCollapsed ? -250 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="shrink-0 border-r border-border"
        >
          <Sidebar />
        </motion.div>

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="h-full overflow-auto">
              <ContentRouter />
            </div>
          </div>
          
          {/* Agent Ops Panel - Only in chat/scheduler */}
          {['chat'].includes(state.view) && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-80 h-full shrink-0 border-l border-border flex flex-col"
            >
              <AgentOpsPanel className="h-full" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
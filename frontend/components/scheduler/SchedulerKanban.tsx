import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {Plus,Clock,CheckCircle2,AlertCircle,Calendar,Bot,AlertTriangle,RefreshCw,MapPin,Settings,X} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import GoogleSetupWizard from '../settings/GoogleSetupWizard';
import { calendarApi } from "@/lib/api/calendar";
import CalendarEmbed from "./CalendarEmbed";
import {
    taskToCalendarEvent,
    calendarEventToTask,
    getPriorityStyle,
    formatTime,
} from "@/lib/utils/scheduler";
// Types
interface SchedulerTask {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'completed' | 'cancelled';
  tags?: string[];
  isAgenticTask?: boolean;
  aiSuggested?: boolean;
  location?: string;
  attendees?: string[];
  reminderMinutes?: number;
  createdAt: string;
  updatedAt: string;
  googleEventId?: string; // Store the Google Calendar event ID
}
import TaskFormDialog from './TaskFormDialog';
import SchedulerHeader from './SchedulerHeader';


const SchedulerKanban = () => {  
  const { user } = useAuth();
  const calendarEmail = user?.email || "parthdhengle12@gmail.com";
  // ALL STATE DECLARATIONS FIRST
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [tasks, setTasks] = useState<SchedulerTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<SchedulerTask | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [calendarView] = useState<'WEEK' | 'MONTH' | 'AGENDA'>('WEEK');
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    date: new Date().toISOString().split('T')[0],
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    isAgenticTask: false,
    tags: '',
    location: '',
    attendees: '',
    reminderMinutes: 15,
  });

  // ALL EFFECTS AND CALLBACKS (ALL HOOKS MUST BE BEFORE ANY RETURNS)
  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = authInstance.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const refreshCalendar = useCallback(() => {
    setIsRefreshing(true);
    setCalendarRefreshKey(prev => prev + 1);
    setLastRefresh(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const refreshAfterTaskOperation = useCallback(() => {
    setTimeout(() => refreshCalendar(), 1000);
  }, [refreshCalendar]);

  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 7));
      
      const events = await calendarApi.list({
        timeMin: startOfWeek.toISOString(),
        timeMax: endOfWeek.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100
      });

      const taskEvents = events
        .map(calendarEventToTask)
        .filter(Boolean) as SchedulerTask[];

      setTasks(taskEvents);
      
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refreshCalendar, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshCalendar]);

  // Consolidated filtering useEffect (removed duplicate)
  const filteredTasks = useMemo<SchedulerTask[]>(() => {
    let filtered = tasks;

    if (searchQuery) {
        filtered = filtered.filter(
            (task: SchedulerTask) =>
                task.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||

                task.description
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||

                task.tags?.some(tag =>
                    tag
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                )
        );
    }

    if (filterStatus !== "all") {
        filtered = filtered.filter(
      (t: SchedulerTask) => t.status === filterStatus
        );
    }

    if (filterPriority !== "all") {
        filtered = filtered.filter(
      (t: SchedulerTask) => t.priority === filterPriority
        );
    }

    if (!showCompleted) {
        filtered = filtered.filter(
      (t: SchedulerTask) => t.status !== "completed"
        );
    }

    return filtered;
},[
    tasks,
    searchQuery,
    filterStatus,
    filterPriority,
    showCompleted
]);

  useEffect(() => {
    if (!setupComplete || !isAuthenticated) return;
    void (async () => {
      await fetchTasks();
    })();
  }, [fetchTasks, setupComplete, isAuthenticated]);

  // Action functions (moved up before conditionals)
  // Create a new task
  const createTask = async () => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      
      const startAt = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
      const endAt = new Date(`${formData.date}T${formData.endTime}:00`).toISOString();
      
      const newTask: SchedulerTask = {
        id: crypto.randomUUID(), // Temporary ID, will be replaced by backend
        title: formData.title,
        description: formData.description,
        startAt,
        endAt,
        date: formData.date,
        priority: formData.priority,
        status: 'pending',
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        isAgenticTask: formData.isAgenticTask,
        location: formData.location,
        attendees: formData.attendees.split(',').map(t => t.trim()).filter(Boolean),
        reminderMinutes: formData.reminderMinutes,
        aiSuggested: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create Google Calendar event (which represents our task)
      const eventData = taskToCalendarEvent(newTask);
      const createdEvent = await calendarApi.create(eventData);
      
      // Update task with Google event ID
      const taskWithEventId = {
        ...newTask,
        googleEventId: createdEvent.id,
        id: createdEvent.extendedProperties?.private?.taskId || newTask.id
      };

      setTasks(prev => [...prev, taskWithEventId]);
      refreshAfterTaskOperation();
      resetForm();
      
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // Update an existing task
  const updateTask = async (taskId: string, updates: Partial<SchedulerTask>) => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return;
    }

    try {
      const existingTask = tasks.find(t => t.id === taskId);
      if (!existingTask || !existingTask.googleEventId) {
        throw new Error('Task not found or missing Google Calendar event');
      }

      const updatedTask = { 
        ...existingTask, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };

      // Update Google Calendar event
      const eventData = taskToCalendarEvent(updatedTask);
      await calendarApi.update(existingTask.googleEventId, eventData);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      
      refreshAfterTaskOperation();
      
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return;
    }

    try {
      const existingTask = tasks.find(t => t.id === taskId);
      if (!existingTask || !existingTask.googleEventId) {
        throw new Error('Task not found or missing Google Calendar event');
      }

      // Delete Google Calendar event
      await calendarApi.remove(existingTask.googleEventId);
      
      setTasks(prev => prev.filter(task => task.id !== taskId));
      refreshAfterTaskOperation();
      
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      date: new Date().toISOString().split('T')[0],
      priority: 'Medium',
      isAgenticTask: false,
      tags: '',
      location: '',
      attendees: '',
      reminderMinutes: 15,
    });
    setEditingTask(null);
    setIsCreateMode(false);
  };

  const openEditDialog = (task: SchedulerTask) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      startTime: formatTime(new Date(task.startAt)),
      endTime: formatTime(new Date(task.endAt)),
      date: task.date,
      priority: task.priority,
      isAgenticTask: task.isAgenticTask || false,
      tags: task.tags?.join(', ') || '',
      location: task.location || '',
      attendees: task.attendees?.join(', ') || '',
      reminderMinutes: task.reminderMinutes || 15,
    });
    setEditingTask(task);
    setIsCreateMode(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateMode(true);
  };

  const handleSubmit = async () => {
    if (isCreateMode) {
      await createTask();
    } else if (editingTask) {
      const startAt = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
      const endAt = new Date(`${formData.date}T${formData.endTime}:00`).toISOString();
      
      await updateTask(editingTask.id, {
        title: formData.title,
        description: formData.description,
        startAt,
        endAt,
        date: formData.date,
        priority: formData.priority,
        isAgenticTask: formData.isAgenticTask,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        location: formData.location,
        attendees: formData.attendees.split(',').map(t => t.trim()).filter(Boolean),
        reminderMinutes: formData.reminderMinutes,
      });
      resetForm();
    }
  };

  

  // CONDITIONAL RETURNS ONLY AFTER ALL HOOKS AND DEFINITIONS
  if (!setupComplete) {
    return <GoogleSetupWizard onSuccess={() => setSetupComplete(true)} />;
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-white font-medium">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-gray-400 mb-6">
              Please log in to access your AI Scheduler. You need to connect your Google Calendar to manage tasks.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get upcoming tasks for today
  const todayTasks = filteredTasks.filter((task: SchedulerTask) => {
    const taskDate = new Date(task.startAt);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  }).sort((a: SchedulerTask, b: SchedulerTask) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const upcomingTasks = todayTasks.filter((task: SchedulerTask) => 
    new Date(task.startAt) > new Date() && task.status === 'pending'
  ).slice(0, 5);

  const overdueTasks = filteredTasks.filter((task: SchedulerTask) => 
    new Date(task.endAt) < new Date() && task.status === 'pending'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <SchedulerHeader
        loading={loading}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        lastRefresh={lastRefresh}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
        filteredCount={filteredTasks.length}
        totalCount={tasks.length}
        onRefresh={fetchTasks}
        onCreateTask={openCreateDialog}
        isAuthenticated={isAuthenticated}
      />

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-900/50 backdrop-blur-sm border-r border-gray-700/50 p-6 overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 p-4 rounded-xl border border-blue-600/30">
              <div className="text-2xl font-bold text-blue-400">{todayTasks.length}</div>
              <div className="text-sm text-blue-300">Today&apos;s Tasks</div>
            </div>
            <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 p-4 rounded-xl border border-red-600/30">
              <div className="text-2xl font-bold text-red-400">{overdueTasks.length}</div>
              <div className="text-sm text-red-300">Overdue</div>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Upcoming Today
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto mb-2" />
                <p className="text-gray-400">Loading tasks...</p>
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
                <p className="text-gray-400">No upcoming tasks today</p>
                <p className="text-sm text-gray-500">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map(task => {
                  const startTime = new Date(task.startAt);
                  const isUrgent = startTime.getTime() - new Date().getTime() < 60 * 60 * 1000; // Less than 1 hour
                  
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl backdrop-blur-sm border transition-all hover:scale-105 cursor-pointer ${
                        isUrgent 
                          ? 'bg-red-600/20 border-red-600/30 shadow-red-500/20 shadow-lg' 
                          : 'bg-gray-800/50 border-gray-600/30 hover:bg-gray-800/70'
                      }`}
                      onClick={() => openEditDialog(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate mb-1">
                            {task.title}
                          </h4>
                          <p className="text-sm text-gray-400 mb-2">
                            {formatTime(startTime)} - {formatTime(new Date(task.endAt))}
                          </p>
                          
                          <div className="flex items-center space-x-2">
                            <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityStyle(task.priority)}`}>
                              {task.priority}
                            </div>
                            
                            {task.isAgenticTask && (
                              <div className="px-2 py-1 rounded-md text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30">
                                <Bot className="w-3 h-3 inline mr-1" />
                                Agent
                              </div>
                            )}

                            {isUrgent && (
                              <div className="px-2 py-1 rounded-md text-xs font-medium bg-orange-600/20 text-orange-400 border border-orange-600/30">
                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                                Soon
                              </div>
                            )}
                          </div>

                          {task.location && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {task.location}
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTask(task.id, { status: 'completed' });
                          }}
                          className="p-1 hover:bg-green-600/30 rounded-md transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 text-gray-400 hover:text-green-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Overdue ({overdueTasks.length})
              </h3>
              
              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-red-600/20 border border-red-600/30 rounded-lg backdrop-blur-sm cursor-pointer hover:bg-red-600/30 transition-all"
                    onClick={() => openEditDialog(task)}
                  >
                    <h4 className="font-medium text-red-300 truncate mb-1">
                      {task.title}
                    </h4>
                    <p className="text-xs text-red-400">
                      Due: {formatTime(new Date(task.endAt))} on {new Date(task.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                
                {overdueTasks.length > 3 && (
                  <div className="text-xs text-red-400 text-center py-2">
                    +{overdueTasks.length - 3} more overdue tasks
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-400" />
              Quick Actions
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={openCreateDialog}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-800/50 rounded-lg transition-all border border-gray-700/50"
              >
                <Plus className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Create New Task</span>
              </button>
              
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setFormData(prev => ({ ...prev, date: today }));
                  openCreateDialog();
                }}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-800/50 rounded-lg transition-all border border-gray-700/50"
              >
                <Calendar className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Schedule for Today</span>
              </button>
              
              
            </div>

            {/* Integration Status */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-600/30">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-blue-300">Calendar Integration</span>
              </div>
              <p className="text-xs text-blue-200 leading-relaxed">
                Tasks automatically sync to Google Calendar as events. They&apos;ll appear in the calendar view with color-coding by priority.
              </p>
              <div className="flex items-center space-x-4 mt-3 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-300">High</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-yellow-300">Medium</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-300">Low</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full bg-white/5 backdrop-blur-sm rounded-2xl border border-gray-700/30 relative">
            {/* Calendar Header */}
            <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-700/50">
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span className="text-gray-300">
                    {autoRefresh ? 'Auto-sync ON' : 'Auto-sync OFF'}
                  </span>
                </div>
              </div>
              
            </div>

            {/* Loading overlay for calendar refresh */}
            {isRefreshing && (
              <div className="absolute inset-4 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
                <div className="bg-gray-900/90 rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-white font-medium">Syncing calendar...</span>
                  </div>
                </div>
              </div>
            )}

            <div className="h-full p-4">
              <CalendarEmbed
                  calendarId={calendarEmail}
                  mode={calendarView}
                  refreshKey={calendarRefreshKey}
              />
            </div>
          </div>
        </div>
      </div>

      <TaskFormDialog
        open={editingTask !== null || isCreateMode}
        loading={loading}
        error={error}
        isCreateMode={isCreateMode}
        editingTask={editingTask}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={resetForm}
        onDelete={
            editingTask
                ? () => deleteTask(editingTask.id)
                : undefined
        }
    />

      {/* Loading Overlay */}
      {loading && !isCreateMode && !editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-white font-medium">Loading your tasks...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && !isCreateMode && !editingTask && (
        <div className="fixed bottom-6 right-6 bg-red-600/90 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-red-500/50 z-50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Error occurred</p>
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-700/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulerKanban;
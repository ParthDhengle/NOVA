"use client";

import React, { createContext, useContext, useReducer, useEffect } from 'react';

import type { ChatSession, ChatMessage } from "@/lib/types/chat";

import type { SchedulerTask } from "@/lib/types/task";
import type { AgentOp } from "@/lib/types/agent";
import type { NovaRole, Integration } from "@/lib/types/electron";

import { useAuth } from '@/context/AuthContext';
import { tasksApi } from "@/lib/api/tasks";
import { chatApi } from "@/lib/api/chat";
import { operationsApi } from "@/lib/api/operations";


type NovaState = {
  // Chat state
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isTyping: boolean;
  isProcessing: boolean;
  
  // Scheduler state  
  tasks: SchedulerTask[];
  
  // Agent operations
  operations: AgentOp[];
  
  // UI state
  view: 'chat' | 'scheduler' | 'dashboard' | 'settings';
  isMiniMode: boolean;
  sidebarCollapsed: boolean;
  
  // User preferences
  role: NovaRole;
  voiceEnabled: boolean;
  selectedModel: string;
  
  // Integrations
  integrations: Integration[];
};

type NovaAction = 
  | { type: 'SET_VIEW'; payload: NovaState['view'] }
  | { type: 'SET_MINI_MODE'; payload: boolean }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: { sessionId: string; message: ChatMessage } }
  | { type: 'SET_SESSIONS'; payload: ChatSession[] }
  | { type: 'SET_CURRENT_SESSION'; payload: ChatSession | null }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'ADD_TASK'; payload: SchedulerTask }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<SchedulerTask> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_TASKS'; payload: SchedulerTask[] }
  | { type: 'SET_OPERATIONS'; payload: AgentOp[] }
  | { type: 'SET_ROLE'; payload: NovaRole }
  | { type: 'SET_VOICE_ENABLED'; payload: boolean }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'SET_INTEGRATIONS'; payload: Integration[] }
  | { type: 'SET_PROCESSING'; payload: boolean };;



const mockIntegrations: Integration[] = [
  { id: 'email', name: 'Email', enabled: true, status: 'connected', lastSync: Date.now() - 300000 },
  { id: 'calendar', name: 'Calendar', enabled: false, status: 'disconnected' },
  { id: 'smartwatch', name: 'Smartwatch', enabled: false, status: 'disconnected' },
  { id: 'device', name: 'Device Activity', enabled: true, status: 'connected', lastSync: Date.now() - 600000 },
];

const initialState: NovaState = {
  currentSession: null,
  sessions: [],
  isTyping: false,
  tasks: [],
  operations: [],
  view: 'chat',
  isMiniMode: false,
  sidebarCollapsed: false,
  role: 'friend',
  voiceEnabled: true,
  selectedModel: 'whisper-base',
  integrations: mockIntegrations,
  isProcessing: false,
};

function novaReducer(state: NovaState, action: NovaAction): NovaState {
  // Move const outside switch
  let updatedSessions = state.sessions;
  let updatedCurrentSession = state.currentSession;

  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    
    case 'SET_MINI_MODE':
      return { ...state, isMiniMode: action.payload };
    
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload };
      
    case 'ADD_MESSAGE':
      const { sessionId, message } = action.payload;
      updatedSessions = state.sessions.map(session => 
        session.id === sessionId 
          ? { ...session, messages: [...session.messages, message], updatedAt: Date.now() }
          : session
      );
      updatedCurrentSession = state.currentSession?.id === sessionId
        ? { ...state.currentSession, messages: [...state.currentSession.messages, message] }
        : state.currentSession;
      return {
        ...state,
        sessions: updatedSessions,
        currentSession: updatedCurrentSession
      };
    
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
      
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
      
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
      
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
      
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id 
            ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : task
        )
      };
      
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(task => task.id !== action.payload) };
      
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
      
    case 'SET_OPERATIONS':
      return { ...state, operations: action.payload };
      
    case 'SET_ROLE':
      return { ...state, role: action.payload };
      
    case 'SET_VOICE_ENABLED':
      return { ...state, voiceEnabled: action.payload };

    case 'SET_SELECTED_MODEL':
      return { ...state, selectedModel: action.payload };
      
    case 'SET_INTEGRATIONS':
      return { ...state, integrations: action.payload };

    case 'SET_PROCESSING':  // NEW
      return { ...state, isProcessing: action.payload };  
      
    default:
      return state;
  }
}

const NovaContext = createContext<{
  state: NovaState;
  dispatch: React.Dispatch<NovaAction>;
} | null>(null);

export function NovaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(novaReducer, initialState);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadInitialData = async () => {
      try {
        // Load chat sessions
        const sessions = await chatApi.getChatSessions();
        dispatch({ type: 'SET_SESSIONS', payload: sessions });

        // Choose first existing session or create a local one for UI
        const currentSession =
          sessions.length > 0
            ? await chatApi.getChatSession(sessions[0].id)
            : {
                id: crypto.randomUUID(),
                title: "New Chat",
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
        
              dispatch({ type: 'SET_CURRENT_SESSION', payload: currentSession });

        if (currentSession?.id) {
          const history = await chatApi.getChatHistory(currentSession.id);
          dispatch({
            type: 'SET_CURRENT_SESSION',
            payload: { ...currentSession, messages: history }
          });
        }

        // Load tasks (may 401 if Google integration not connected)
        try {
          const tasks = await tasksApi.getTasks();
          dispatch({ type: 'SET_TASKS', payload: tasks });
        } catch {
          dispatch({ type: 'SET_TASKS', payload: [] });
        }

        // Load operations
        const operations = await operationsApi.getOperations();
        dispatch({ type: 'SET_OPERATIONS', payload: operations });
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Safe defaults
        dispatch({ type: 'SET_SESSIONS', payload: [] });
        dispatch({ type: 'SET_TASKS', payload: [] });
        dispatch({ type: 'SET_OPERATIONS', payload: [] });
        // Create a default local session for UI usability
        const defaultSession = { id: 'default', title: 'New Chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() } as ChatSession;
        dispatch({ type: 'SET_CURRENT_SESSION', payload: defaultSession });
      }
    };
    loadInitialData();
  }, [isAuthenticated]);



  // Simulate some dynamic updates for demo (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update agent operations for demo
      if (Math.random() > 0.9) {
        const mockOps: AgentOp[] = [
          {
            id: `op-${Date.now()}`,
            title: 'Processing email batch',
            desc: 'Categorizing and prioritizing incoming messages',
            status: 'running',
            progress: Math.floor(Math.random() * 100),
            startTime: Date.now() - Math.random() * 60000,
          }
        ];
        dispatch({ type: 'SET_OPERATIONS', payload: mockOps });
      }
    }, 30000); // Reduced frequency

    return () => clearInterval(interval);
  }, []);

  return (
    <NovaContext.Provider value={{ state, dispatch }}>
      {children}
    </NovaContext.Provider>
  );
}

export function useNova() {
  const context = useContext(NovaContext);
  if (!context) {
    throw new Error('useNova must be used within a NovaProvider');
  }
  return context;
}
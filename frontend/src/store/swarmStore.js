// frontend/src/store/swarmStore.js
import { create } from 'zustand';

const API = import.meta.env.VITE_API_URL || '/api';

export const useSwarmStore = create((set, get) => ({
  // Auth
  token: localStorage.getItem('devswarm_token') || null,
  user: null,

  setToken: (token) => {
    localStorage.setItem('devswarm_token', token);
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('devswarm_token');
    set({ token: null, user: null, currentTask: null, events: [] });
  },

  // Current active task
  currentTask: null,
  setCurrentTask: (task) => set({ currentTask: task }),

  // SSE events stream
  events: [],
  addEvent: (event) => set(state => ({
    events: [...state.events.slice(-200), event]
  })),
  clearEvents: () => set({ events: [] }),

  // Task history
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set(state => ({ tasks: [task, ...state.tasks] })),

  // Agent status tracking
  agentStatuses: {
    frontend: 'idle',
    backend: 'idle',
    qa: 'idle',
    reviewer: 'idle',
  },
  setAgentStatus: (agent, status) => set(state => ({
    agentStatuses: { ...state.agentStatuses, [agent]: status }
  })),
  resetAgentStatuses: () => set({
    agentStatuses: { frontend: 'idle', backend: 'idle', qa: 'idle', reviewer: 'idle' }
  }),

  // Phase tracking
  currentPhase: 0,
  setCurrentPhase: (phase) => set({ currentPhase: phase }),

  // API helpers
  authHeaders: () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${get().token}`
  }),

  // Submit task
  submitTask: async (description) => {
    const res = await fetch(`${API}/agents/task`, {
      method: 'POST',
      headers: get().authHeaders(),
      body: JSON.stringify({ description }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit task');
    }
    return res.json();
  },

  // Fetch task
  fetchTask: async (taskId) => {
    const res = await fetch(`${API}/agents/task/${taskId}`, {
      headers: get().authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
  },

  // Fetch task list
  fetchTasks: async () => {
    const res = await fetch(`${API}/agents/tasks`, {
      headers: get().authHeaders(),
    });
    if (!res.ok) return;
    const data = await res.json();
    set({ tasks: data.tasks || [] });
  },
}));

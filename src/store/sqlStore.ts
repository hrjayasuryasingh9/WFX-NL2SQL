import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";

export interface QueryResult {
  columns: string[];
  rows: any[][];
  error?: string; 
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  userQuery: string;
  error?: string;
  sql?: string;
  result?: QueryResult;
  timestamp: Date;
  isLoading?: boolean;
  feedback?: string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

interface SqlStore {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  currentQuery: string;
  isLoading: boolean;
  selectedChartType: ChartType;
  showChart: boolean;
  currentVisualMessage: QueryResult | null;

  setCurrentQuery: (query: string) => void;
  submitQuery: (query: string) => Promise<void>;
  regenerateMessage: (messageId: string, newQuery: string) => Promise<void>;
  setSelectedChartType: (type: ChartType) => void;
  toggleChart: (value: boolean) => void;
  startNewConversation: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  loadConversationsFromStorage: () => void;
  submitFeedback: (foundMessage: Message) => Promise<void>; 
  setMessageFeedback: (messageId: string, feedback: string) => void;
  regenerateQuery: (message: Message) => Promise<void>;
  setcurrentVisualMessage: (result: QueryResult) => void;
}

// --- LocalStorage Helpers ---
const STORAGE_KEY = "sql_conversations";

const saveConversationsToStorage = (conversations: Conversation[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error("Failed to save conversations:", err);
  }
};

const loadConversationsFromStorage = (): Conversation[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);

    return parsed.map((c: Conversation) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      messages: c.messages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }))
    }));
  } catch (err) {
    console.error("Failed to load conversations:", err);
    return [];
  }
};

// --- Backend Functions ---
const generateResult = async (sql: string): Promise<QueryResult> => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}execute/sql`,
      { sql }
    );

    const data = res.data;

    return {
      columns: data.columns || [],
      rows: data.data
        ? data.data.map((row: any) => data.columns.map((col: string) => row[col]))
        : [],
      error: data.error || undefined,
    };
  } catch (error: any) {
    console.error("Error executing SQL:", error);
    return {
      columns: ["Error"],
      rows: [],
      error: error.response?.data?.error || error.message || "Unknown error",
    };
  }
};

const generateMockSql = async (
  query: string
): Promise<{ explanation: string; sql: string; error?: string }> => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}translate`,
      { question: query }
    );
    return res.data;
  } catch (error: any) {
    console.error("Error generating SQL:", error);
    return { explanation: "Error fetching SQL", sql: "failed_to_load_sql", error: error.message };
  }
};


const sendFeedback = async (sql: string, question: string) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}translate/feedback`,
      { sql, question }
    );
    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("Error sending feedback:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
};

// --- Zustand Store ---
export const useSqlStore = create<SqlStore>((set, get) => ({
  currentConversation: null,
  conversations: loadConversationsFromStorage(),
  currentQuery: '',
  isLoading: false,
  selectedChartType: 'bar',
  showChart: false,
  currentVisualMessage: null,

  setCurrentQuery: (query) => set({ currentQuery: query }),
  setcurrentVisualMessage: (result) => set({ currentVisualMessage: result }),

submitQuery: async (query) => {
  set({ isLoading: true });

  const userMessage: Message = {
    id: uuidv4(),
    type: 'user',
    userQuery: query,
    content: query,
    timestamp: new Date(),
  };

  let conversation = get().currentConversation;

  if (!conversation) {
    conversation = {
      id: uuidv4(),
      title: query.slice(0, 50) + (query.length > 50 ? '...' : ''),
      messages: [],
      createdAt: new Date(),
    };
  }

  conversation.messages.push(userMessage);

  const loadingMessage: Message = {
    id: uuidv4(),
    type: 'assistant',
    content: '',
    userQuery: query,
    isLoading: true,
    timestamp: new Date(),
  };

  conversation.messages.push(loadingMessage);

  const updatedConversations = [
    conversation,
    ...get().conversations.filter(c => c.id !== conversation!.id)
  ];

  set({
    currentConversation: conversation,
    conversations: updatedConversations,
  });
  saveConversationsToStorage(updatedConversations);

  try {
    const regeneratedSql = await generateMockSql(query);

    // If SQL generation failed
    if (!regeneratedSql.sql || regeneratedSql.sql === "failed_to_load_sql") {
      const errorMessage: Message = {
        ...loadingMessage,
        error: regeneratedSql.error || "Failed to generate SQL.",
        isLoading: false,
        timestamp: new Date(),
      };

      conversation.messages = conversation.messages.map(m =>
        m.id === loadingMessage.id ? errorMessage : m
      );

      const finalConversations = [
        conversation,
        ...get().conversations.filter(c => c.id !== conversation!.id)
      ];

      set({
        currentConversation: { ...conversation },
        conversations: finalConversations,
        currentQuery: '',
        isLoading: false,
      });
      saveConversationsToStorage(finalConversations);
      return; // <-- stop further execution
    }

    // Only run SQL if generation succeeded
    const regeneratedResult = await generateResult(regeneratedSql.sql);

    const assistantMessage: Message = {
      ...loadingMessage,
      content: regeneratedSql.explanation || "Here's the SQL query:",
      userQuery: query,
      sql: regeneratedSql.sql,
      result: regeneratedResult,
      feedback: "none",
      isLoading: false,
      timestamp: new Date(),
    };

    conversation.messages = conversation.messages.map(m =>
      m.id === loadingMessage.id ? assistantMessage : m
    );

    const finalConversations = [
      conversation,
      ...get().conversations.filter(c => c.id !== conversation!.id)
    ];

    set({
      currentConversation: { ...conversation },
      conversations: finalConversations,
      currentQuery: '',
      isLoading: false,
    });
    saveConversationsToStorage(finalConversations);

  } catch (error) {
    console.error('Error submitting query:', error);

    const errorMessage: Message = {
      ...loadingMessage,
      content: error.message || "Unknown error occurred.",
      isLoading: false,
      timestamp: new Date(),
    };

    conversation.messages = conversation.messages.map(m =>
      m.id === loadingMessage.id ? errorMessage : m
    );

    set({ currentConversation: { ...conversation }, isLoading: false });
    saveConversationsToStorage(get().conversations);
  }
},


  submitFeedback: async (foundMessage: Message) => {
    if (!foundMessage.sql || !foundMessage.userQuery) return;

    const feedback = await sendFeedback(foundMessage.sql, foundMessage.userQuery);
    if (feedback.success) {
      console.log("Feedback submitted successfully:", feedback.data);
    } else {
      console.error("Feedback submission failed:", feedback.error);
    }
  },

  setMessageFeedback: (messageId, feedback) => {
    const state = get();
    const convIndex = state.conversations.findIndex(conv =>
      conv.messages.some(m => m.id === messageId)
    );
    if (convIndex === -1) return;

    const conversation = { ...state.conversations[convIndex] };
    const msgIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    conversation.messages[msgIndex] = {
      ...conversation.messages[msgIndex],
      feedback,
    };

    const updatedConversations = [...state.conversations];
    updatedConversations[convIndex] = conversation;

    set({
      conversations: updatedConversations,
      currentConversation:
        state.currentConversation?.id === conversation.id
          ? conversation
          : state.currentConversation,
    });

    saveConversationsToStorage(updatedConversations);
  },

  regenerateMessage: async (messageId, newQuery) => {
    const state = get();
    if (!state.currentConversation) return;

    const conversation = { ...state.currentConversation };
    const targetIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (targetIndex === -1) return;

    conversation.messages[targetIndex] = {
      ...conversation.messages[targetIndex],
      isLoading: true,
      sql: undefined,
      result: undefined,
      feedback: "none",
      content: '',
      timestamp: new Date(),
    };

    set({ currentConversation: conversation });

    try {
      const result = await generateResult(newQuery);
      const updatedMessage: Message = {
        ...conversation.messages[targetIndex],
        type: 'assistant',
        content: "Here's the updated SQL query:",
        sql: newQuery,
        result,
        feedback: "none",
        isLoading: false,
        timestamp: new Date(),
      };

      conversation.messages[targetIndex] = updatedMessage;

      const updatedConversations = [
        conversation,
        ...state.conversations.filter(c => c.id !== conversation.id)
      ];

      set({ currentConversation: { ...conversation }, conversations: updatedConversations });
      saveConversationsToStorage(updatedConversations);
    } catch (error) {
      console.error('Error regenerating message:', error);
      set({ currentConversation: conversation });
    }
  },

  regenerateQuery: async (message: Message) => {
    const state = get();
    if (!state.currentConversation) return;

    const conversation = { ...state.currentConversation };
    const targetIndex = conversation.messages.findIndex(m => m.id === message.id);
    if (targetIndex === -1) return;

    conversation.messages[targetIndex] = {
      ...conversation.messages[targetIndex],
      isLoading: true,
      sql: undefined,
      result: undefined,
      feedback: "none",
      content: '',
      timestamp: new Date(),
    };

    set({ currentConversation: conversation });

    try {
      const regeneratedSql = await generateMockSql(message.userQuery);
      const regeneratedResult = await generateResult(regeneratedSql.sql);

      const updatedMessage: Message = {
        ...conversation.messages[targetIndex],
        type: 'assistant',
        content: regeneratedSql.explanation || "Here's the SQL query:",
        sql: regeneratedSql.sql,
        result: regeneratedResult,
        isLoading: false,
        timestamp: new Date(),
      };

      conversation.messages[targetIndex] = updatedMessage;

      const updatedConversations = [
        conversation,
        ...state.conversations.filter(c => c.id !== conversation.id)
      ];

      set({ currentConversation: { ...conversation }, conversations: updatedConversations });
      saveConversationsToStorage(updatedConversations);
    } catch (error) {
      console.error('Error regenerating query:', error);
      set({ currentConversation: conversation });
    }
  },

  setSelectedChartType: (type) => set({ selectedChartType: type }),
  toggleChart: (value) => set({ showChart: value }),
  startNewConversation: () => set({ currentConversation: null }),
  loadConversation: (id) => {
    const conversation = get().conversations.find(c => c.id === id);
    if (conversation) set({ currentConversation: conversation });
  },
  deleteConversation: (id) => {
    const state = get();
    const updatedConversations = state.conversations.filter(c => c.id !== id);
    const currentConversation = state.currentConversation?.id === id ? null : state.currentConversation;
    set({ conversations: updatedConversations, currentConversation });
    saveConversationsToStorage(updatedConversations);
  },
  loadConversationsFromStorage: () => {
    const conversations = loadConversationsFromStorage();
    set({ conversations });
  }
}));

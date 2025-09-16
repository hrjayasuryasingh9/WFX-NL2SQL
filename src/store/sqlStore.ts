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
  userQuery:string;
  sql?: string;
  result?: QueryResult;
  timestamp: Date;
  isLoading?: boolean;
  feedback?:string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

interface SqlStore {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  currentQuery: string;
  isLoading: boolean;
  selectedChartType: ChartType;
  showChart: boolean;

  setCurrentQuery: (query: string) => void;
  submitQuery: (query: string) => Promise<void>;
  regenerateMessage: (messageId: string, newQuery: string) => Promise<void>;
  setSelectedChartType: (type: ChartType) => void;
  toggleChart: () => void;
  startNewConversation: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  loadConversationsFromStorage: () => void;
  submitFeedback: (foundMessage: Message) => Promise<void>; 
  setMessageFeedback: (messageId:string, feedback:string) => void;
  regenerateQuery:(message:Message)=>void;
  // new
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
      error: data.error || undefined,  // <-- capture backend error
    };
  } catch (error: any) {
    console.error("Error executing SQL:", error);
    return {
      columns: ["Error"],
      rows: [],
      error: error.response?.data?.error || error.message || "Unknown error", // <-- fallback error
    };
  }
};


const generateMockSql = async (query: string): Promise<string> => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}translate`,
      { question: query }
    );
    return res.data.sql;
  } catch (error: any) {
    console.error("Error generating SQL:", error);
    return "/* Failed to generate SQL */";
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

  setCurrentQuery: (query) => set({ currentQuery: query }),

  submitQuery: async (query) => {
    set({ isLoading: true });

    const userMessage: Message = {
      id: uuidv4(),
      type: 'user',
      userQuery:query,
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
      userQuery:query,
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
      const sql = await generateMockSql(query);
      const result = await generateResult(sql);

      const assistantMessage: Message = {
        ...loadingMessage,
        content: "Here's the SQL query for your request:",
        userQuery:query,
        sql,
        result,
        feedback:"none",
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
      set({ isLoading: false });
    }
  },

submitFeedback: async (foundMessage:Message) => {
  const state = get();

  // 🔎 Search across all conversations
  // const allConversations = state.conversations;
  // let foundMessage: Message | undefined;

  // for (const conv of allConversations) {
  //   const msg = conv.messages.find(m => m.id === messageId);
  //   if (msg) {
  //     foundMessage = msg;
  //     break;
  //   }
  // }

  if (!foundMessage) {
    console.error("Message not found for feedback.");
    return;
  }

  if (!foundMessage.sql || !foundMessage.userQuery) {
    console.error("Message missing sql or userQuery for feedback.");
    return;
  }

  const feedback = await sendFeedback(foundMessage.sql, foundMessage.userQuery);

  if (feedback.success) {
    console.log("Feedback submitted successfully:", feedback.data);
  } else {
    console.error("Feedback submission failed:", feedback.error);
  }
},
  setMessageFeedback: (messageId:string, feedback:string) => {
  const state = get();

  // Update across all conversations
  const updatedConversations = state.conversations.map(conv => ({
    ...conv,
    messages: conv.messages.map(m =>
      m.id === messageId ? { ...m, feedback } : m
    ),
  }));

  // Also update currentConversation if it’s open
  const updatedCurrent =
    state.currentConversation &&
    updatedConversations.find(c => c.id === state.currentConversation?.id);

  set({
    conversations: updatedConversations,
    currentConversation: updatedCurrent || state.currentConversation,
  });

  saveConversationsToStorage(updatedConversations);
},


  regenerateMessage: async (messageId, newQuery) => {
    const state = get();
    if (!state.currentConversation) return;

    const conversation = { ...state.currentConversation };

    const targetMessageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (targetMessageIndex === -1) return;

    conversation.messages[targetMessageIndex] = {
      ...conversation.messages[targetMessageIndex],
      isLoading: true,
      sql: undefined,
      result: undefined,
      feedback:"none",
      content: '',
      timestamp: new Date(),
    };

    set({ currentConversation: conversation });

    try {
      const result = await generateResult(newQuery);
      const updatedMessage: Message = {
        ...conversation.messages[targetMessageIndex],
        type: 'assistant',
        content: "Here's the updated SQL query:",
        sql: newQuery,
        result,
        isLoading: false,
        timestamp: new Date(),
      };

      conversation.messages[targetMessageIndex] = updatedMessage;

      const updatedConversations = [
        conversation,
        ...state.conversations.filter(c => c.id !== conversation!.id)
      ];

      set({
        currentConversation: { ...conversation },
        conversations: updatedConversations,
      });
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

  // find the index of the passed message
  const targetMessageIndex = conversation.messages.findIndex(m => m.id === message.id);
  if (targetMessageIndex === -1) return;

  // put loading state
  conversation.messages[targetMessageIndex] = {
    ...conversation.messages[targetMessageIndex],
    isLoading: true,
    sql: undefined,
    result: undefined,
    feedback: "none",
    content: '',
    timestamp: new Date(),
  };

  set({ currentConversation: conversation });

  try {
    // regenerate sql first
    const regeneratedSql = await generateMockSql(message.userQuery);
    const regeneratedResult = await generateResult(regeneratedSql);

    const updatedMessage: Message = {
      ...conversation.messages[targetMessageIndex],
      type: 'assistant',
      content: "Here's the regenerated SQL query:",
      sql: regeneratedSql,
      result: regeneratedResult,
      isLoading: false,
      timestamp: new Date(),
    };

    conversation.messages[targetMessageIndex] = updatedMessage;

    const updatedConversations = [
      conversation,
      ...state.conversations.filter(c => c.id !== conversation!.id)
    ];

    set({
      currentConversation: { ...conversation },
      conversations: updatedConversations,
    });
    saveConversationsToStorage(updatedConversations);
  } catch (error) {
    console.error('Error regenerating query:', error);
    set({ currentConversation: conversation });
  }
},

  setSelectedChartType: (type) => set({ selectedChartType: type }),
  toggleChart: () => set((state) => ({ showChart: !state.showChart })),
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

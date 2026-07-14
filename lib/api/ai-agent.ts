import { apiRequest } from '../api';
import type { AiAgent } from '../ai-agents';

export interface ApiResponse<T> { success: boolean; data: T; message?: string }
export interface AgentConversation { id: number; ispId: number; agentId: number; userId: number; title: string; status: string; summary?: string; pinned: boolean; archived: boolean; lastMessageAt: string }
export interface AgentMessage { id: number; conversationId: number; senderType: 'USER'|'AGENT'; role: 'user'|'assistant'; content: string; structuredData?: Record<string, unknown>; createdAt: string }

export const AiAgentsAPI = {
  list: () => apiRequest<ApiResponse<AiAgent[]>>('/ai-agents'),
  get: (id: number|string) => apiRequest<ApiResponse<AiAgent>>(`/ai-agents/${id}`),
  create: (payload: Partial<AiAgent>) => apiRequest<ApiResponse<AiAgent>>('/ai-agents', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number|string, payload: Partial<AiAgent>) => apiRequest<ApiResponse<AiAgent>>(`/ai-agents/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  clone: (id: number|string) => apiRequest<ApiResponse<AiAgent>>(`/ai-agents/${id}/clone`, { method: 'POST' }),
  setState: (id: number|string, action: 'publish'|'pause'|'activate') => apiRequest<ApiResponse<AiAgent>>(`/ai-agents/${id}/${action}`, { method: 'POST' }),
  analytics: () => apiRequest<ApiResponse<Record<string, unknown>>>('/ai-agents/analytics'),
  tasks: () => apiRequest<ApiResponse<unknown[]>>('/ai-agents/tasks'),
  approvals: () => apiRequest<ApiResponse<unknown[]>>('/ai-agents/approvals'),
  activity: () => apiRequest<ApiResponse<unknown[]>>('/ai-agents/activity'),
  usage: () => apiRequest<ApiResponse<unknown[]>>('/ai-agents/usage'),
  tools: (id: number|string) => apiRequest<ApiResponse<unknown[]>>(`/ai-agents/${id}/tools`),
  permissions: (id: number|string) => apiRequest<ApiResponse<unknown[]>>(`/ai-agents/${id}/permissions`),
};

export const AiAgentConversationsAPI = {
  list: () => apiRequest<ApiResponse<AgentConversation[]>>('/ai-agent-conversations'),
  create: (agentId: number | undefined, title: string, message = title) => apiRequest<ApiResponse<AgentConversation & {agent?:unknown;routing?:unknown}>>('/ai-agent-conversations', { method: 'POST', body: JSON.stringify({ agentId, title, message }) }),
  routeIntent: (message: string, agentId?: number) => apiRequest<ApiResponse<{agent:any;routing:any;suggestion:string}>>('/ai-agent-conversations/route-intent', { method: 'POST', body: JSON.stringify({ message, agentId }) }),
  get: (id: number) => apiRequest<ApiResponse<AgentConversation>>(`/ai-agent-conversations/${id}`),
  update: (id: number, payload: Partial<AgentConversation>) => apiRequest<ApiResponse<AgentConversation>>(`/ai-agent-conversations/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  messages: (id: number) => apiRequest<ApiResponse<AgentMessage[]>>(`/ai-agent-conversations/${id}/messages`),
  send: (id: number, content: string, attachments: unknown[] = []) => apiRequest<ApiResponse<{userMessage:AgentMessage;assistant:AgentMessage}>>(`/ai-agent-conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content, attachments }) }),
};

export const AiAgentApprovalsAPI = {
  list: () => apiRequest<ApiResponse<unknown[]>>('/ai-agent-approvals'),
  decide: (id: number, decision: 'approve'|'reject', reason = '') => apiRequest<ApiResponse<unknown>>(`/ai-agent-approvals/${id}/${decision}`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

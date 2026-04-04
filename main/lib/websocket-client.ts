"use client";

import { toast } from "react-hot-toast";

export type WebSocketEvent =
    | 'connected'
    | 'disconnected'
    | 'authenticated'
    | 'error'
    | 'heartbeat'
    | 'ping'
    | 'pong'
    | 'subscribed'
    | 'unsubscribed'
    | 'command.response'
    | 'yeastar.listener.started'
    | 'yeastar.listener.stopped'
    | 'dashboard.update'
    | 'data.updated'
    | 'system.status'
    | 'system.notification'
    | 'yeastar.service.available';

export interface WebSocketMessage {
    type: WebSocketEvent;
    data: any;
    timestamp: string;
}

interface WebSocketConfig {
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
    heartbeatInterval?: number;
    autoConnect?: boolean;
    autoReconnect?: boolean;
    debug?: boolean;
}

interface WebSocketState {
    isConnected: boolean;
    isAuthenticated: boolean;
    clientId?: string;
    userId?: number;
    ispId?: number;
    userName?: string;
    userEmail?: string;
    permissions: string[];
}

type EventHandler = (data: any) => void;

class WebSocketClient {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts: number;
    private reconnectInterval: number;
    private heartbeatInterval: number;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private eventHandlers: Map<WebSocketEvent, Set<EventHandler>> = new Map();
    private subscriptions: Set<string> = new Set();
    private state: WebSocketState = {
        isConnected: false,
        isAuthenticated: false,
        permissions: []
    };
    private commandQueue: Array<{ type: string; data: any }> = [];
    private autoConnect: boolean;
    private autoReconnect: boolean;
    private debug: boolean;
    private isConnecting: boolean = false;
    private connectionPromise: Promise<void> | null = null;

    constructor(config: WebSocketConfig = {}) {
        this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
        this.reconnectInterval = config.reconnectInterval || 5000;
        this.heartbeatInterval = config.heartbeatInterval || 30000;
        this.autoConnect = config.autoConnect ?? true;
        this.autoReconnect = config.autoReconnect ?? true;
        this.debug = config.debug ?? process.env.NODE_ENV === 'development';

        if (this.autoConnect && typeof window !== 'undefined') {
            // Wait a bit to ensure DOM is ready and cookies are available
            setTimeout(() => this.initialize(), 100);
        }
    }

    private log(...args: any[]) {
        if (this.debug) console.log('[WebSocket]', ...args);
    }

    private error(...args: any[]) {
        console.error('[WebSocket]', ...args);
    }

    private initialize() {
        // Only auto-connect if we're not already connected or connecting
        if (!this.state.isConnected && !this.isConnecting) {
            this.connect().catch(error => {
                console.warn('[WebSocket] Initial connection failed:', error.message);
            });
        }

        if (typeof window !== 'undefined') {
            // Reconnect when page becomes visible
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' && !this.state.isConnected) {
                    this.connect().catch(console.error);
                }
            });
        }
    }

    private getWebSocketUrl(): string {
        if (typeof window === 'undefined') return '';
        const host = window.location.hostname;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';

        // For local development
        if (host === 'localhost' || host === '127.0.0.1') {
            return 'ws://localhost:3200/ws';
        }

        // For production
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
        return apiBase.replace(/^http/, 'ws') + '/ws';
    }

    async connect(): Promise<void> {
        // If already connecting, return the existing promise
        if (this.isConnecting && this.connectionPromise) {
            return this.connectionPromise;
        }

        // If already connected, resolve immediately
        if (this.ws?.readyState === WebSocket.OPEN && this.state.isConnected) {
            return Promise.resolve();
        }

        this.isConnecting = true;
        const wsUrl = this.getWebSocketUrl();

        this.connectionPromise = new Promise<void>((resolve, reject) => {
            this.log('Connecting to:', wsUrl);

            try {
                this.ws = new WebSocket(wsUrl);

                // Set timeout for connection
                const timeout = setTimeout(() => {
                    if (this.ws?.readyState !== WebSocket.OPEN) {
                        this.error('Connection timeout');
                        this.ws?.close();
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);

                this.ws.onopen = () => {
                    clearTimeout(timeout);
                    this.isConnecting = false;
                    this.state.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.log('WebSocket connection established');

                    // NO need to send authentication - cookies are sent automatically
                    resolve();
                };

                this.ws.onmessage = (event) => this.handleMessage(event);
                this.ws.onclose = (event) => this.handleClose(event);
                this.ws.onerror = (error) => {
                    clearTimeout(timeout);
                    this.isConnecting = false;
                    const errorMsg = 'WebSocket connection failed. Please check if the server is running.';
                    this.error(errorMsg, error);
                    this.emit('error', { message: errorMsg, error });
                    reject(new Error(errorMsg));
                };

            } catch (error: any) {
                this.isConnecting = false;
                this.error('Failed to create WebSocket:', error);
                reject(error);
            }
        });

        return this.connectionPromise;
    }

    getConnectionStatus(): string {
        if (!this.ws) return 'disconnected';
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'connecting';
            case WebSocket.OPEN:
                return this.state.isAuthenticated ? 'authenticated' : 'connected';
            case WebSocket.CLOSING:
                return 'closing';
            case WebSocket.CLOSED:
                return 'disconnected';
            default:
                return 'unknown';
        }
    }

    private handleMessage(event: MessageEvent) {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.log('Received:', message.type);

            switch (message.type) {
                case 'connected':
                    this.handleConnectedEvent(message.data);
                    break;

                case 'authenticated':
                    this.handleAuthenticatedEvent(message.data);
                    break;

                case 'ping':
                    // Respond with ping to match server expectation
                    this.send({ type: 'ping', data: {} });
                    this.emit('heartbeat', message.data);
                    break;

                case 'system.status':
                case 'system.notification':
                case 'yeastar.service.available':
                case 'subscribed':
                case 'unsubscribed':
                    // Emit these events as-is
                    this.emit(message.type, message.data);
                    break;

                case 'error':
                    this.handleErrorEvent(message.data);
                    break;

                default:
                    this.emit(message.type, message.data);
            }
        } catch (err) {
            this.error('Failed to parse message:', err);
        }
    }

    private handleConnectedEvent(data: any) {
        this.log('Connected event:', data);

        // If we have user data in the connected event, treat it as authenticated
        if (data.userId && data.permissions) {
            this.state.clientId = data.clientId;
            this.state.userId = data.userId;
            this.state.ispId = data.ispId;
            this.state.userName = data.userName;
            this.state.permissions = data.permissions || [];
            this.state.isAuthenticated = true;

            // Send queued commands
            this.commandQueue.forEach(cmd => this.send(cmd));
            this.commandQueue = [];

            // Emit authenticated event
            this.emit('authenticated', this.state);
            this.log('✅ Authenticated via connected event');
        }

        // Always emit connected event
        this.emit('connected', this.state);
    }

    private handleAuthenticatedEvent(data: any) {
        this.state.isAuthenticated = true;
        this.emit('authenticated', this.state);
        this.log('✅ Authenticated via dedicated event');
    }

    private handleClose(event: CloseEvent) {
        this.log('Connection closed', event.code, event.reason);
        this.state.isConnected = false;
        this.state.isAuthenticated = false;
        this.clearHeartbeat();
        this.connectionPromise = null;

        this.emit('disconnected', {
            code: event.code,
            reason: event.reason
        });

        // Auto-reconnect only for unexpected closures
        if (event.code !== 1000 && this.autoReconnect) {
            this.scheduleReconnect();
        }
    }

    private handleErrorEvent(data: any) {
        this.error('Server error:', data);

        if (data.code?.includes('AUTH') || data.message?.includes('auth') || data.message?.includes('Auth')) {
            toast.error('Authentication error. Please log in again.');
        } else if (data.message) {
            toast.error(data.message);
        }

        this.emit('error', data);
    }

    private startHeartbeat() {
        this.clearHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send({ type: 'heartbeat', data: {} });
            }
        }, this.heartbeatInterval);
    }

    private clearHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.error('Max reconnection attempts reached');
            toast.error('Failed to reconnect. Please refresh the page.');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(
            this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
            30000
        );

        this.log(`Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})`);

        setTimeout(() => {
            this.connect().catch(error => {
                this.error('Reconnection failed:', error);
            });
        }, delay);
    }

    send(message: { type: string; data: any }) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            if (message.type === 'command' && !this.state.isAuthenticated) {
                this.commandQueue.push(message);
                this.log('Queued command (not authenticated yet):', message.type);
            } else {
                this.ws.send(JSON.stringify(message));
                this.log('Sent:', message.type);
            }
        } else {
            this.log('Cannot send message - WebSocket not open');
        }
    }

    subscribe(channels: string | string[]) {
        const list = Array.isArray(channels) ? channels : [channels];
        // Clean up the channels array - remove any null/undefined/empty values
        const validChannels = list.filter(ch => ch && typeof ch === 'string' && ch.trim().length > 0);

        if (validChannels.length === 0) {
            console.warn('[WebSocket] No valid channels to subscribe to:', channels);
            return;
        }

        // Add to local subscriptions
        validChannels.forEach(c => {
            if (c && !this.subscriptions.has(c)) {
                this.subscriptions.add(c);
            }
        });

        // Send subscribe message
        this.send({
            type: 'subscribe',
            data: {
                channels: validChannels
            }
        });
    }

    unsubscribe(channels: string | string[]) {
        const list = Array.isArray(channels) ? channels : [channels];
        // Clean up the channels array
        const validChannels = list.filter(ch => ch && typeof ch === 'string' && ch.trim().length > 0);

        if (validChannels.length === 0) {
            console.warn('[WebSocket] No valid channels to unsubscribe from:', channels);
            return;
        }

        // Remove from local subscriptions
        validChannels.forEach(c => this.subscriptions.delete(c));

        // Send unsubscribe message
        this.send({
            type: 'unsubscribe',
            data: {
                channels: validChannels
            }
        });
    }
    sendCommand(command: string, data?: any) {
        // Send the command in the correct format
        this.send({
            type: 'command',
            data: {
                command,
                ...(data || {})
            }
        });
    }

    on(event: WebSocketEvent, handler: EventHandler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)!.add(handler);

        // Return unsubscribe function
        return () => this.off(event, handler);
    }

    off(event: WebSocketEvent, handler?: EventHandler) {
        if (!handler) {
            this.eventHandlers.delete(event);
        } else {
            this.eventHandlers.get(event)?.delete(handler);
        }
    }

    private emit(event: WebSocketEvent, data: any) {
        this.eventHandlers.get(event)?.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                this.error(`Error in ${event} handler:`, error);
            }
        });
    }

    disconnect() {
        this.autoReconnect = false;
        this.clearHeartbeat();

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }

        this.state.isConnected = false;
        this.state.isAuthenticated = false;
        this.isConnecting = false;
        this.connectionPromise = null;

        this.emit('disconnected', { manual: true });
    }

    getState() {
        return { ...this.state };
    }

    isConnected() {
        return this.state.isConnected;
    }

    isAuthenticated() {
        return this.state.isAuthenticated;
    }

    getSubscriptions() {
        return Array.from(this.subscriptions);
    }

    hasPermission(permission: string): boolean {
        return this.state.permissions.includes(permission);
    }

    getPermissions(): string[] {
        return [...this.state.permissions];
    }
}

// Create singleton instance
const webSocketClient = new WebSocketClient({
    debug: process.env.NODE_ENV === 'development',
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectInterval: 3000
});

export default webSocketClient;
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import webSocketClient from '@/lib/websocket-client';

interface WebSocketContextType {
    isConnected: boolean;
    isAuthenticated: boolean;
    connectionStatus: string;
    state: any;
    subscribe: (channels: string | string[]) => void;
    unsubscribe: (channels: string | string[]) => void;
    sendCommand: (command: string, data?: any) => void;
    on: (event: string, handler: (data: any) => void) => () => void;
    off: (event: string, handler?: (data: any) => void) => void;
    connect: () => Promise<void>;
    disconnect: () => void;
    reset: () => void;
    isConnecting: boolean;
    reconnectAttempts: number;
    subscriptions: string[];
    hasPermission: (permission: string) => boolean;
    permissions: string[];
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
    return context;
};

interface WebSocketProviderProps {
    children: ReactNode;
    autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
    children,
    autoConnect = true
}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [state, setState] = useState<any>({});
    const [isConnecting, setIsConnecting] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [subscriptions, setSubscriptions] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);

    const updateStatus = useCallback(() => {
        setIsConnected(webSocketClient.isConnected());
        setIsAuthenticated(webSocketClient.isAuthenticated());
        setConnectionStatus(webSocketClient.getConnectionStatus());
        setState(webSocketClient.getState());
        setSubscriptions(webSocketClient.getSubscriptions());
        setPermissions(webSocketClient.getPermissions());
    }, []);

    const connect = useCallback(async () => {
        try {
            await webSocketClient.connect();
            updateStatus();
        } catch (error: any) {
            console.error('Failed to connect WebSocket:', error.message);
            // Don't throw - just log and update status
            updateStatus();
            throw error;
        }
    }, [updateStatus]);

    const disconnect = useCallback(() => {
        webSocketClient.disconnect();
        updateStatus();
    }, [updateStatus]);

    const reset = useCallback(() => {
        webSocketClient.disconnect();
        setTimeout(() => connect(), 1000);
    }, [connect]);

    const subscribe = useCallback((channels: string | string[]) => {
        webSocketClient.subscribe(channels);
        updateStatus();
    }, [updateStatus]);

    const unsubscribe = useCallback((channels: string | string[]) => {
        webSocketClient.unsubscribe(channels);
        updateStatus();
    }, [updateStatus]);

    const sendCommand = useCallback((command: string, data?: any) => {
        webSocketClient.sendCommand(command, data);
    }, []);

    const hasPermission = useCallback((permission: string) => {
        return webSocketClient.hasPermission(permission);
    }, []);

    const on = useCallback((event: string, handler: (data: any) => void) => {
        return webSocketClient.on(event as any, handler);
    }, []);

    const off = useCallback((event: string, handler?: (data: any) => void) => {
        webSocketClient.off(event as any, handler);
    }, []);

    useEffect(() => {
        // Update isConnecting status
        const checkConnecting = () => {
            setIsConnecting(webSocketClient.getConnectionStatus() === 'connecting');
        };

        // Listen for WebSocket events
        const unsubConnected = webSocketClient.on('connected', (data) => {
            // console.log('WebSocket connected:', data);
            updateStatus();
        });

        const unsubAuthenticated = webSocketClient.on('authenticated', (data) => {
            // console.log('WebSocket authenticated:', data);
            updateStatus();
        });

        const unsubDisconnected = webSocketClient.on('disconnected', updateStatus);
        const unsubError = webSocketClient.on('error', updateStatus);

        // Periodic status check for connecting state
        const interval = setInterval(checkConnecting, 1000);

        // Initial status update
        updateStatus();
        checkConnecting();

        return () => {
            unsubConnected();
            unsubAuthenticated();
            unsubDisconnected();
            unsubError();
            clearInterval(interval);
        };
    }, [updateStatus]);

    const value: WebSocketContextType = {
        isConnected,
        isAuthenticated,
        connectionStatus,
        state,
        subscribe,
        unsubscribe,
        sendCommand,
        on,
        off,
        connect,
        disconnect,
        reset,
        isConnecting,
        reconnectAttempts,
        subscriptions,
        hasPermission,
        permissions
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
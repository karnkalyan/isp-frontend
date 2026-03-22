"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { getWebSocketClient } from "@/lib/websocket-client";

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
  if (!context) throw new Error("useWebSocket must be used within WebSocketProvider");
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  autoConnect = true,
}) => {
  const clientRef = useRef<ReturnType<typeof getWebSocketClient> | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [state, setState] = useState<any>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  const getClient = useCallback(() => {
    if (typeof window === "undefined") return null;

    if (!clientRef.current) {
      clientRef.current = getWebSocketClient();
    }

    return clientRef.current;
  }, []);

  const updateStatus = useCallback(() => {
    const client = getClient();
    if (!client) return;

    setIsConnected(client.isConnected());
    setIsAuthenticated(client.isAuthenticated());
    setConnectionStatus(client.getConnectionStatus());
    setState(client.getState());
    setSubscriptions(client.getSubscriptions());
    setPermissions(client.getPermissions());
  }, [getClient]);

  const connect = useCallback(async () => {
    const client = getClient();
    if (!client) return;

    try {
      await client.connect();
      updateStatus();
    } catch (error: any) {
      console.error("Failed to connect WebSocket:", error?.message || error);
      updateStatus();
      throw error;
    }
  }, [getClient, updateStatus]);

  const disconnect = useCallback(() => {
    const client = getClient();
    if (!client) return;

    client.disconnect();
    updateStatus();
  }, [getClient, updateStatus]);

  const reset = useCallback(() => {
    const client = getClient();
    if (!client) return;

    client.disconnect();
    setTimeout(() => {
      connect().catch(() => {});
    }, 1000);
  }, [connect, getClient]);

  const subscribe = useCallback(
    (channels: string | string[]) => {
      const client = getClient();
      if (!client) return;

      client.subscribe(channels);
      updateStatus();
    },
    [getClient, updateStatus]
  );

  const unsubscribe = useCallback(
    (channels: string | string[]) => {
      const client = getClient();
      if (!client) return;

      client.unsubscribe(channels);
      updateStatus();
    },
    [getClient, updateStatus]
  );

  const sendCommand = useCallback(
    (command: string, data?: any) => {
      const client = getClient();
      if (!client) return;

      client.sendCommand(command, data);
    },
    [getClient]
  );

  const hasPermission = useCallback(
    (permission: string) => {
      const client = getClient();
      if (!client) return false;

      return client.hasPermission(permission);
    },
    [getClient]
  );

  const on = useCallback(
    (event: string, handler: (data: any) => void) => {
      const client = getClient();
      if (!client) return () => {};

      return client.on(event as any, handler);
    },
    [getClient]
  );

  const off = useCallback(
    (event: string, handler?: (data: any) => void) => {
      const client = getClient();
      if (!client) return;

      client.off(event as any, handler);
    },
    [getClient]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const client = getClient();
    if (!client) return;

    const checkConnecting = () => {
      setIsConnecting(client.getConnectionStatus() === "connecting");
    };

    const unsubConnected = client.on("connected", () => {
      updateStatus();
    });

    const unsubAuthenticated = client.on("authenticated", () => {
      updateStatus();
    });

    const unsubDisconnected = client.on("disconnected", () => {
      updateStatus();
    });

    const unsubError = client.on("error", () => {
      updateStatus();
    });

    const interval = setInterval(checkConnecting, 1000);

    updateStatus();
    checkConnecting();

    if (autoConnect) {
      client.connect().catch((error: any) => {
        console.error("Failed to auto-connect WebSocket:", error?.message || error);
      });
    }

    return () => {
      unsubConnected();
      unsubAuthenticated();
      unsubDisconnected();
      unsubError();
      clearInterval(interval);
    };
  }, [autoConnect, getClient, updateStatus]);

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
    permissions,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// Lazy import to avoid any top-level execution of websocket-client on server
let _getWebSocketClient: typeof import("@/lib/websocket-client").getWebSocketClient | null = null;

function safeGetWebSocketClient() {
  if (typeof window === "undefined") return null;

  if (!_getWebSocketClient) {
    // Dynamic require only in browser
    try {
      const mod = require("@/lib/websocket-client");
      _getWebSocketClient = mod.getWebSocketClient;
    } catch {
      return null;
    }
  }

  try {
    return _getWebSocketClient!();
  } catch {
    return null;
  }
}

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

const defaultContext: WebSocketContextType = {
  isConnected: false,
  isAuthenticated: false,
  connectionStatus: "disconnected",
  state: {},
  subscribe: () => {},
  unsubscribe: () => {},
  sendCommand: () => {},
  on: () => () => {},
  off: () => {},
  connect: async () => {},
  disconnect: () => {},
  reset: () => {},
  isConnecting: false,
  reconnectAttempts: 0,
  subscriptions: [],
  hasPermission: () => false,
  permissions: [],
};

const WebSocketContext = createContext<WebSocketContextType>(defaultContext);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
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
  const clientRef = useRef<any>(null);

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
      clientRef.current = safeGetWebSocketClient();
    }

    return clientRef.current;
  }, []);

  const updateStatus = useCallback(() => {
    const client = getClient();
    if (!client) return;

    try {
      setIsConnected(client.isConnected());
      setIsAuthenticated(client.isAuthenticated());
      setConnectionStatus(client.getConnectionStatus());
      setState(client.getState());
      setSubscriptions(client.getSubscriptions());
      setPermissions(client.getPermissions());
    } catch (error) {
      // Client might be in an invalid state
      console.warn("[WebSocket] Failed to update status:", error);
    }
  }, [getClient]);

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;

    const client = getClient();
    if (!client) return;

    try {
      setIsConnecting(true);
      await client.connect();
      updateStatus();
    } catch (error: any) {
      console.error(
        "Failed to connect WebSocket:",
        error?.message || error
      );
      updateStatus();
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [getClient, updateStatus]);

  const disconnect = useCallback(() => {
    if (typeof window === "undefined") return;

    const client = getClient();
    if (!client) return;

    client.disconnect();
    updateStatus();
  }, [getClient, updateStatus]);

  const reset = useCallback(() => {
    if (typeof window === "undefined") return;

    const client = getClient();
    if (!client) return;

    client.disconnect();
    clientRef.current = null;

    setTimeout(() => {
      connect().catch(() => {});
    }, 1000);
  }, [connect, getClient]);

  const subscribe = useCallback(
    (channels: string | string[]) => {
      if (typeof window === "undefined") return;

      const client = getClient();
      if (!client) return;

      client.subscribe(channels);
      updateStatus();
    },
    [getClient, updateStatus]
  );

  const unsubscribe = useCallback(
    (channels: string | string[]) => {
      if (typeof window === "undefined") return;

      const client = getClient();
      if (!client) return;

      client.unsubscribe(channels);
      updateStatus();
    },
    [getClient, updateStatus]
  );

  const sendCommand = useCallback(
    (command: string, data?: any) => {
      if (typeof window === "undefined") return;

      const client = getClient();
      if (!client) return;

      client.sendCommand(command, data);
    },
    [getClient]
  );

  const hasPermission = useCallback(
    (permission: string) => {
      if (typeof window === "undefined") return false;

      const client = getClient();
      if (!client) return false;

      return client.hasPermission(permission);
    },
    [getClient]
  );

  const on = useCallback(
    (event: string, handler: (data: any) => void) => {
      if (typeof window === "undefined") return () => {};

      const client = getClient();
      if (!client) return () => {};

      try {
        return client.on(event as any, handler);
      } catch {
        return () => {};
      }
    },
    [getClient]
  );

  const off = useCallback(
    (event: string, handler?: (data: any) => void) => {
      if (typeof window === "undefined") return;

      const client = getClient();
      if (!client) return;

      try {
        client.off(event as any, handler);
      } catch {
        // ignore
      }
    },
    [getClient]
  );

  // Main initialization effect — only runs in browser
  useEffect(() => {
    if (typeof window === "undefined") return;

    const client = getClient();
    if (!client) return;

    const cleanups: Array<() => void> = [];

    try {
      const unsubConnected = client.on("connected", () => {
        updateStatus();
      });
      cleanups.push(unsubConnected);

      const unsubAuthenticated = client.on("authenticated", () => {
        updateStatus();
      });
      cleanups.push(unsubAuthenticated);

      const unsubDisconnected = client.on("disconnected", () => {
        updateStatus();
      });
      cleanups.push(unsubDisconnected);

      const unsubError = client.on("error", () => {
        updateStatus();
      });
      cleanups.push(unsubError);
    } catch (error) {
      console.warn("[WebSocket] Failed to attach event listeners:", error);
    }

    // Periodic status check
    const interval = setInterval(() => {
      try {
        const client = getClient();
        if (client) {
          setIsConnecting(client.getConnectionStatus() === "connecting");
        }
      } catch {
        // ignore
      }
    }, 1000);

    updateStatus();

    if (autoConnect) {
      client.connect().catch((error: any) => {
        console.error(
          "Failed to auto-connect WebSocket:",
          error?.message || error
        );
      });
    }

    return () => {
      cleanups.forEach((unsub) => {
        try {
          unsub();
        } catch {
          // ignore cleanup errors
        }
      });
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
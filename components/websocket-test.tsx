"use client";

import React, { useEffect, useState } from "react";
import { useWebSocket } from "./WebSocketProvider"; // adjust path

export const WebSocketTest: React.FC = () => {
    const {
        isConnected,
        isAuthenticated,
        connectionStatus,
        subscriptions,
        subscribe,
        unsubscribe,
        sendCommand,
        on,
        off,
    } = useWebSocket();

    const [messages, setMessages] = useState<any[]>([]);
    const [channel, setChannel] = useState("isp_1"); // example channel
    const [commandOutput, setCommandOutput] = useState("");

    useEffect(() => {
        const unsubDataUpdated = on("data.updated", (data) => {
            setMessages((prev) => [...prev, { type: "data.updated", data }]);
        });

        const unsubNotification = on("system.notification", (data) => {
            setMessages((prev) => [...prev, { type: "system.notification", data }]);
        });

        return () => {
            unsubDataUpdated();
            unsubNotification();
        };
    }, [on]);

    const handleSubscribe = () => {
        subscribe(channel);
    };

    const handleUnsubscribe = () => {
        unsubscribe(channel);
    };

    const handleSendCommand = async () => {
        try {
            await sendCommand("system.get_stats");
            setCommandOutput("Command sent successfully!");
        } catch (err: any) {
            setCommandOutput("Command failed: " + err.message);
        }
    };

    return (
        <div style={{ padding: 20, fontFamily: "sans-serif" }}>
            <h2>WebSocket Test</h2>
            <p>Status: {connectionStatus}</p>
            <p>Connected: {isConnected ? "✅" : "❌"}</p>
            <p>Authenticated: {isAuthenticated ? "✅" : "❌"}</p>

            <hr />

            <div>
                <h3>Subscriptions</h3>
                <input
                    type="text"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                />
                <button onClick={handleSubscribe}>Subscribe</button>
                <button onClick={handleUnsubscribe}>Unsubscribe</button>
                <p>Current: {subscriptions.join(", ") || "None"}</p>
            </div>

            <hr />

            <div>
                <h3>Send Command</h3>
                <button onClick={handleSendCommand}>system.get_stats</button>
                <p>{commandOutput}</p>
            </div>

            <hr />

            <div>
                <h3>Messages</h3>
                <div
                    style={{
                        border: "1px solid #ccc",
                        padding: 10,
                        maxHeight: 200,
                        overflowY: "auto",
                    }}
                >
                    {messages.map((m, i) => (
                        <pre key={i} style={{ margin: 0 }}>
                            {JSON.stringify(m, null, 2)}
                        </pre>
                    ))}
                </div>
            </div>
        </div>
    );
};

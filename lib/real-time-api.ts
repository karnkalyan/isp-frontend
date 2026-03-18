import webSocketClient from "./websocket-client";

// Real-time API for Yeastar operations
export class RealTimeApi {
    private ispId: number;
    private unsubscribeCallbacks: (() => void)[] = [];

    constructor(ispId: number) {
        this.ispId = ispId;
    }

    // Initialize real-time listeners
    initialize() {
        // Subscribe to ISP room
        this.subscribeToIspRoom();

        // Subscribe to Yeastar channels
        this.subscribeToYeastarChannels();

        // Set up event handlers
        this.setupEventHandlers();
    }

    // Clean up listeners
    destroy() {
        this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
        this.unsubscribeCallbacks = [];
    }

    // Subscribe to ISP room
    private subscribeToIspRoom() {
        webSocketClient.subscribe(`isp_${this.ispId}`);
    }

    // Subscribe to Yeastar channels
    private subscribeToYeastarChannels() {
        webSocketClient.subscribe([
            'yeastar_calls',
            'yeastar_extensions',
            'yeastar_trunks',
            'yeastar_monitoring'
        ]);
    }

    // Set up event handlers
    private setupEventHandlers() {
        // Call events
        const unsubscribeCallStart = webSocketClient.on('yeastar.call.start', this.handleCallStart.bind(this));
        const unsubscribeCallEnd = webSocketClient.on('yeastar.call.end', this.handleCallEnd.bind(this));
        const unsubscribeCallUpdate = webSocketClient.on('yeastar.call.update', this.handleCallUpdate.bind(this));

        // Extension events
        const unsubscribeExtensionAdded = webSocketClient.on('yeastar.extension.added', this.handleExtensionAdded.bind(this));
        const unsubscribeExtensionUpdated = webSocketClient.on('yeastar.extension.updated', this.handleExtensionUpdated.bind(this));
        const unsubscribeExtensionDeleted = webSocketClient.on('yeastar.extension.deleted', this.handleExtensionDeleted.bind(this));

        // Trunk events
        const unsubscribeTrunkAdded = webSocketClient.on('yeastar.trunk.added', this.handleTrunkAdded.bind(this));
        const unsubscribeTrunkUpdated = webSocketClient.on('yeastar.trunk.updated', this.handleTrunkUpdated.bind(this));
        const unsubscribeTrunkDeleted = webSocketClient.on('yeastar.trunk.deleted', this.handleTrunkDeleted.bind(this));

        // System events
        const unsubscribeSystemUpdate = webSocketClient.on('yeastar.system.status.update', this.handleSystemUpdate.bind(this));
        const unsubscribeListenerStarted = webSocketClient.on('yeastar.listener.started', this.handleListenerStarted.bind(this));
        const unsubscribeListenerStopped = webSocketClient.on('yeastar.listener.stopped', this.handleListenerStopped.bind(this));

        // Data sync events
        const unsubscribeDataSynced = webSocketClient.on('yeastar.data.synced', this.handleDataSynced.bind(this));

        this.unsubscribeCallbacks.push(
            unsubscribeCallStart,
            unsubscribeCallEnd,
            unsubscribeCallUpdate,
            unsubscribeExtensionAdded,
            unsubscribeExtensionUpdated,
            unsubscribeExtensionDeleted,
            unsubscribeTrunkAdded,
            unsubscribeTrunkUpdated,
            unsubscribeTrunkDeleted,
            unsubscribeSystemUpdate,
            unsubscribeListenerStarted,
            unsubscribeListenerStopped,
            unsubscribeDataSynced
        );
    }

    // Event handlers
    private handleCallStart(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Call started:', data);
            this.emit('call:start', data);
        }
    }

    private handleCallEnd(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Call ended:', data);
            this.emit('call:end', data);
        }
    }

    private handleCallUpdate(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Call updated:', data);
            this.emit('call:update', data);
        }
    }

    private handleExtensionAdded(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Extension added:', data);
            this.emit('extension:added', data);
        }
    }

    private handleExtensionUpdated(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Extension updated:', data);
            this.emit('extension:updated', data);
        }
    }

    private handleExtensionDeleted(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Extension deleted:', data);
            this.emit('extension:deleted', data);
        }
    }

    private handleTrunkAdded(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Trunk added:', data);
            this.emit('trunk:added', data);
        }
    }

    private handleTrunkUpdated(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Trunk updated:', data);
            this.emit('trunk:updated', data);
        }
    }

    private handleTrunkDeleted(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Trunk deleted:', data);
            this.emit('trunk:deleted', data);
        }
    }

    private handleSystemUpdate(data: any) {
        if (data.ispId === this.ispId) {
            console.log('System updated:', data);
            this.emit('system:update', data);
        }
    }

    private handleListenerStarted(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Listener started:', data);
            this.emit('listener:started', data);
        }
    }

    private handleListenerStopped(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Listener stopped:', data);
            this.emit('listener:stopped', data);
        }
    }

    private handleDataSynced(data: any) {
        if (data.ispId === this.ispId) {
            console.log('Data synced:', data);
            this.emit('data:synced', data);
        }
    }

    // Emit custom events
    private emit(event: string, data: any) {
        // This can be extended to use a proper event emitter
        // For now, we'll just log it
        console.log(`Event emitted: ${event}`, data);
    }

    // Request extension refresh
    requestExtensionRefresh() {
        webSocketClient.sendCommand('yeastar.extension.refresh', {
            ispId: this.ispId
        });
    }

    // Request call hangup
    requestCallHangup(channelId: string, callId?: string) {
        webSocketClient.sendCommand('yeastar.call.hangup', {
            ispId: this.ispId,
            channelId,
            callId
        });
    }

    // Request call transfer
    requestCallTransfer(channelId: string, target: string) {
        webSocketClient.sendCommand('yeastar.call.transfer', {
            ispId: this.ispId,
            channelId,
            target
        });
    }

    // Get WebSocket state
    getWebSocketState() {
        return webSocketClient.getState();
    }

    // Check if WebSocket is connected
    isConnected() {
        return webSocketClient.isConnected();
    }
}
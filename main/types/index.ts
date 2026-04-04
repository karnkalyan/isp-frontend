// types/index.ts
export interface OLT {
  id: string;
  name: string;
  model: string;
  location: string;
  ipAddress: string;
  status: 'active' | 'inactive' | 'maintenance' | 'warning';
  totalPorts: number;
  activePorts: number;
  uptime: string;
  temperature: number;
  lastSeen: string;
  utilizationPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOLTDTO {
  name: string;
  model: string;
  location: string;
  ipAddress: string;
  totalPorts: number;
  description?: string;
}

export interface UpdateOLTDTO extends Partial<CreateOLTDTO> {
  status?: OLT['status'];
}

export interface OLTPort {
  id: string;
  portNumber: number;
  type: 'PON' | 'UPLINK' | 'MNGT';
  status: 'active' | 'inactive' | 'warning' | 'error';
  connectedOnts: number;
  maxOnts: number;
  bandwidth: number;
  utilization: number;
  oltId: string;
}

export interface OLTStats {
  totalOlts: number;
  activeOlts: number;
  totalPorts: number;
  activePorts: number;
  averageUtilization: number;
  alarms: {
    critical: number;
    major: number;
    minor: number;
    warning: number;
  };
}

export interface Splitter {
  id: string;
  name: string;
  type: '1x4' | '1x8' | '1x16' | '1x32' | '1x64';
  location: string;
  inputPort: string;
  outputPorts: string[];
  status: 'active' | 'inactive' | 'damaged';
  totalCapacity: number;
  usedCapacity: number;
  connectedOltId: string;
  connectedOltName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSplitterDTO {
  name: string;
  type: Splitter['type'];
  location: string;
  inputPort: string;
  outputPorts: string[];
  connectedOltId: string;
  notes?: string;
}

export interface UpdateSplitterDTO extends Partial<CreateSplitterDTO> {
  status?: Splitter['status'];
}

export interface SplitterStats {
  totalSplitters: number;
  activeSplitters: number;
  totalCapacity: number;
  usedCapacity: number;
  byType: Record<string, number>;
}
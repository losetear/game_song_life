// === 消息协议 ===

export interface ClientMessage {
  type: 'action';
  actionId: string;
  params: any;
  seqId: number;
}

export interface ServerMessage {
  type: 'actionResult' | 'error' | 'benchmarkResult';
  seqId?: number;
  data?: any;
  timings?: any;
}

export interface BenchmarkReport {
  timestamp: string;
  results: BenchmarkItem[];
  summary: { passed: number; failed: number; total: number };
}

export interface BenchmarkItem {
  id: number;
  name: string;
  target: string;
  actual: number;
  unit: string;
  passed: boolean;
  detail?: string;
}

// === Express + WebSocket 服务器 ===

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import { WorldEngine } from '../world/worldEngine';
import { ClientMessage, ServerMessage, BenchmarkReport } from './protocol';

export class GameServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private engine: WorldEngine;
  private playerId: number = 0;

  constructor(engine: WorldEngine) {
    this.engine = engine;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // 返回前端页面
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../../client/index.html'));
    });

    // 运行基准测试
    this.app.get('/benchmark', (req, res) => {
      const { runAllBenchmarks } = require('../benchmark/runner');
      const report = runAllBenchmarks(this.engine);
      res.json(report);
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      // 创建玩家实体
      if (this.playerId === 0) {
        this.playerId = this.engine.em.create('npc' as any);
        this.engine.em.addComponent(this.playerId, 'Position', { x: 50, y: 50, areaId: 'city', gridId: 'center_street' });
        this.engine.em.addComponent(this.playerId, 'Vital', { hunger: 80, fatigue: 80, health: 100, mood: 70 });
        this.engine.em.addComponent(this.playerId, 'Wallet', { copper: 100 });
        this.engine.em.addComponent(this.playerId, 'Inventory', { items: [] });
        this.engine.em.addComponent(this.playerId, 'Identity', { name: '你', profession: 'wanderer', age: 25, personality: [] });
        this.engine.worldMap.addEntity(this.playerId, 'center_street');
      }

      ws.send(JSON.stringify({
        type: 'actionResult',
        seqId: 0,
        data: { message: '连接成功，欢迎来到汴京！', playerId: this.playerId },
      }));

      ws.on('message', (data: Buffer) => {
        try {
          const msg: ClientMessage = JSON.parse(data.toString());

          if (msg.type === 'action') {
            const result = this.engine.executePlayerAction(this.playerId, msg.actionId, msg.params);
            const response: ServerMessage = {
              type: 'actionResult',
              seqId: msg.seqId,
              data: {
                message: result.message,
                worldState: result.worldState,
                perception: result.perception,
              },
              timings: result.timings,
            };
            ws.send(JSON.stringify(response));
          }
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', data: { message: String(err) } }));
        }
      });
    });
  }

  start(port: number = 3000): void {
    this.server.listen(port, () => {
      console.log(`服务器启动: http://localhost:${port}`);
    });
  }

  stop(): void {
    this.wss.close();
    this.server.close();
  }

  getPlayerId(): number {
    return this.playerId;
  }

  setPlayerId(id: number): void {
    this.playerId = id;
  }
}

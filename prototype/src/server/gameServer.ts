// === Express + WebSocket 服务器 — CS 分离架构 ===

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import { WorldEngine } from '../world/worldEngine';
import { ClientMessage, ServerMessage, BenchmarkReport, SceneOption } from './protocol';
import { runAllBenchmarks } from '../benchmark/runner';

export class GameServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private engine: WorldEngine;
  private playerId: number = 0;
  private cachedBenchmark: BenchmarkReport | null;

  constructor(engine: WorldEngine, benchmarkReport: BenchmarkReport | null) {
    this.engine = engine;
    this.cachedBenchmark = benchmarkReport;
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

    // 运行基准测试并返回 JSON 报告（每次请求重新运行）
    this.app.get('/api/benchmark', (req, res) => {
      const report = this.cachedBenchmark ?? runAllBenchmarks();
      this.cachedBenchmark = report;
      res.json(report);
    });

    // POST /api/action — 处理玩家操作（执行完整 Tick）
    this.app.post('/api/action', (req, res) => {
      try {
        const { actionId, params } = req.body;
        if (!actionId) {
          res.status(400).json({ error: 'missing actionId' });
          return;
        }
        if (this.playerId === 0) {
          this.ensurePlayer();
        }
        const result = this.engine.executePlayerAction(this.playerId, actionId, params || {});
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      // 创建玩家实体（如果还没有）
      this.ensurePlayer();

      // 发送初始场景
      const initialScene = this.engine.getInitialScene(this.playerId);
      const vital = this.engine.em.getComponent(this.playerId, 'Vital');
      const wallet = this.engine.em.getComponent(this.playerId, 'Wallet');

      const welcomeMsg: ServerMessage = {
        type: 'welcome',
        seqId: 0,
        data: {
          message: '连接成功，欢迎来到汴京！',
          sceneDescription: initialScene.description,
          sceneLocation: `汴京 · ${initialScene.location}`,
          options: initialScene.options,
          npcMessages: [],
          worldState: {
            tick: this.engine.time.tick,
            shichen: this.engine.time.shichenName,
            day: this.engine.time.day,
            season: this.engine.time.season,
            prices: this.engine.economy.getPrices(),
          },
          playerState: {
            hunger: vital?.hunger ?? 80,
            fatigue: vital?.fatigue ?? 80,
            health: vital?.health ?? 100,
            mood: vital?.mood ?? 70,
            copper: wallet?.copper ?? 100,
          },
        },
      };
      ws.send(JSON.stringify(welcomeMsg));

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
                sceneDescription: result.sceneDescription,
                sceneLocation: `汴京 · ${result.sceneLocation}`,
                options: result.options,
                npcMessages: result.npcMessages,
                worldState: result.worldState,
                perception: result.perception,
                playerState: result.playerState,
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

  /** 创建玩家实体 */
  private ensurePlayer(): void {
    if (this.playerId !== 0) return;
    this.playerId = this.engine.em.create('npc' as any);
    this.engine.em.addComponent(this.playerId, 'Position', { x: 50, y: 50, areaId: 'city', gridId: 'center_street' });
    this.engine.em.addComponent(this.playerId, 'Vital', { hunger: 80, fatigue: 80, health: 100, mood: 70 });
    this.engine.em.addComponent(this.playerId, 'Wallet', { copper: 100 });
    this.engine.em.addComponent(this.playerId, 'Inventory', { items: [] });
    this.engine.em.addComponent(this.playerId, 'Identity', { name: '你', profession: 'wanderer', age: 25, personality: [] });
    this.engine.worldMap.addEntity(this.playerId, 'center_street');
  }

  start(port: number = 5173): void {
    this.server.listen(port, () => {
      console.log(`\n✅ 服务器启动成功: http://localhost:${port}`);
      console.log(`   GET  /              → 前端页面`);
      console.log(`   GET  /api/benchmark → 基准测试报告`);
      console.log(`   POST /api/action    → 玩家操作`);
      console.log(`   WebSocket           → 游戏交互`);
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

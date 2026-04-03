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

    // ── 世界监控 API ──────────────────────────────────────────

    // GET /api/world/stats — 世界整体统计
    this.app.get('/api/world/stats', (_req, res) => {
      try {
        const em = this.engine.em;
        const wm = this.engine.worldMap;
        const time = this.engine.time;

        // 按类型统计
        const byType: Record<string, number> = { npc: 0, animal: 0, plant: 0, mineral: 0, building: 0, item: 0 };
        const allIds = em.allEntities();
        for (const id of allIds) {
          const t = em.getType(id);
          if (t) byType[t] = (byType[t] || 0) + 1;
        }
        // 加上 L2 统计的虚拟实体
        byType.npc += 300;
        byType.animal += 1000;
        byType.plant += 4000;
        byType.mineral += 1000;

        // 按 LOD 统计
        const l0Count = this.engine['l0Entities'].length;
        const l1Count = this.engine['l1Entities'].length;
        const totalWithL2 = Object.values(byType).reduce((s, v) => s + v, 0);
        const l2Count = totalWithL2 - l0Count - l1Count;

        // 按 Grid 统计
        const gridStats = wm.stats();

        // 内存估算（粗略）
        const memMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 10) / 10;
        const uptimeSec = Math.round((Date.now() - this.engine.startTime) / 1000);

        res.json({
          totalEntities: totalWithL2,
          ecsEntities: em.entityCount,
          tick: time.tick,
          day: time.day,
          shichen: time.shichenName,
          season: time.season,
          weather: this.engine.weather.weather,
          weatherDesc: this.engine.weather.getDescription(),
          byType,
          byLOD: { L0: l0Count, L1: l1Count, L2: l2Count },
          byGrid: gridStats,
          memoryMB: memMB,
          uptimeSec,
        });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/entities — 实体列表（支持筛选和分页）
    this.app.get('/api/world/entities', (req, res) => {
      try {
        const type = req.query.type as string | undefined;
        const lod = req.query.lod !== undefined ? parseInt(req.query.lod as string) : undefined;
        const grid = req.query.grid as string | undefined;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
        const offset = parseInt(req.query.offset as string) || 0;
        const search = req.query.search as string | undefined;

        const em = this.engine.em;
        const allIds = em.allEntities();

        // 筛选
        const filtered: number[] = [];
        for (const id of allIds) {
          if (type && em.getType(id) !== type) continue;

          if (lod !== undefined) {
            const ai = em.getComponent(id, 'AI');
            if (!ai || ai.aiLevel !== lod) continue;
          }

          if (grid) {
            const pos = em.getComponent(id, 'Position');
            if (!pos || pos.gridId !== grid) continue;
          }

          if (search) {
            const identity = em.getComponent(id, 'Identity');
            if (!identity || !identity.name.includes(search)) continue;
          }

          filtered.push(id);
        }

        // 排序（按 ID）
        filtered.sort((a, b) => a - b);

        const total = filtered.length;
        const page = filtered.slice(offset, offset + limit);

        const entities = page.map(id => {
          const identity = em.getComponent(id, 'Identity');
          const vital = em.getComponent(id, 'Vital');
          const pos = em.getComponent(id, 'Position');
          const wallet = em.getComponent(id, 'Wallet');
          const ai = em.getComponent(id, 'AI');

          return {
            id,
            type: em.getType(id),
            lod: ai?.aiLevel ?? -1,
            grid: pos?.gridId ?? '',
            name: identity?.name ?? '',
            profession: identity?.profession ?? '',
            hunger: vital?.hunger ?? -1,
            fatigue: vital?.fatigue ?? -1,
            health: vital?.health ?? -1,
            mood: vital?.mood ?? -1,
            copper: wallet?.copper ?? -1,
          };
        });

        res.json({ total, offset, limit, entities });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/entity/:id — 单个实体详情
    this.app.get('/api/world/entity/:id', (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const em = this.engine.em;

        if (!em.isAlive(id)) {
          res.status(404).json({ error: 'Entity not found' });
          return;
        }

        const exported = em.exportEntity(id);
        if (!exported) {
          res.status(404).json({ error: 'Export failed' });
          return;
        }

        // 获取 Grid 信息
        const gridId = this.engine.worldMap.getEntityGrid(id);

        res.json({ id, ...exported, gridId });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/events — 世界事件日志
    this.app.get('/api/world/events', (req, res) => {
      try {
        const count = Math.min(parseInt(req.query.count as string) || 50, 500);
        const events = this.engine.getEvents(count);
        res.json({ total: events.length, events });
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
            weather: this.engine.weather.weather,
            weatherDesc: this.engine.weather.getDescription(),
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
                turnSummary: result.turnSummary,
                distantNews: result.distantNews,
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
      console.log(`   GET  /api/world/stats    → 世界统计`);
      console.log(`   GET  /api/world/entities → 实体列表`);
      console.log(`   GET  /api/world/entity/:id → 实体详情`);
      console.log(`   GET  /api/world/events   → 事件日志`);
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

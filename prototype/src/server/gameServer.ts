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
        const l0Count = this.engine.getL0Entities().length;
        const l1Count = this.engine['l1Entities'].length;
        const totalWithL2 = Object.values(byType).reduce((s, v) => s + v, 0);
        const l2Count = totalWithL2 - l0Count - l1Count;

        // 按 Grid 统计
        const gridStats = wm.stats();

        // 内存估算（粗略）
        const memMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 10) / 10;
        const uptimeSec = Math.round((Date.now() - this.engine.startTime) / 1000);

        // 经济摘要
        const economyData = this.engine.getEconomyOverview();

        res.json({
          totalEntities: totalWithL2,
          ecsEntities: em.entityCount,
          tick: time.tick,
          day: time.day,
          ticksPerDay: time.ticksPerDay,
          shichen: time.shichenName,
          season: time.season,
          weather: this.engine.weather.weather,
          weatherDesc: this.engine.weather.getDescription(),
          byType,
          byLOD: { L0: l0Count, L1: l1Count, L2: l2Count },
          byGrid: gridStats,
          memoryMB: memMB,
          uptimeSec,
          economySummary: {
            prices: economyData.prices,
            recentChanges: economyData.recentChanges.slice(-5),
          },
          factions: Array.from(this.engine.getFactions().entries()).map(([id, f]) => {
            const leader = f.leaderId ? this.engine['em']?.getComponent(f.leaderId, 'Identity') : null;
            const memberNames = f.members.slice(0, 5).map(mid => {
              const ident = this.engine['em']?.getComponent(mid, 'Identity');
              return ident?.name || `NPC#${mid}`;
            }).filter(Boolean);
            return {
              id, name: f.name, type: f.type, influence: f.influence,
              treasury: f.treasury, mood: f.mood,
              members: f.members, memberNames,
              leaderId: f.leaderId, leaderName: leader?.name || null,
              territory: f.territory, relations: f.relations,
            };
          }),
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
        // 状态筛选
        const minHunger = req.query.minHunger !== undefined ? parseInt(req.query.minHunger as string) : undefined;
        const maxHunger = req.query.maxHunger !== undefined ? parseInt(req.query.maxHunger as string) : undefined;
        const minCopper = req.query.minCopper !== undefined ? parseInt(req.query.minCopper as string) : undefined;
        const maxCopper = req.query.maxCopper !== undefined ? parseInt(req.query.maxCopper as string) : undefined;

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

          // 状态范围筛选
          if (minHunger !== undefined || maxHunger !== undefined) {
            const vital = em.getComponent(id, 'Vital');
            if (!vital) continue;
            if (minHunger !== undefined && vital.hunger < minHunger) continue;
            if (maxHunger !== undefined && vital.hunger > maxHunger) continue;
          }
          if (minCopper !== undefined || maxCopper !== undefined) {
            const wallet = em.getComponent(id, 'Wallet');
            if (!wallet) continue;
            if (minCopper !== undefined && wallet.copper < minCopper) continue;
            if (maxCopper !== undefined && wallet.copper > maxCopper) continue;
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

        // 如果是 NPC，附加组织信息（从 faction map 反查，不依赖 Identity.factionId）
        const entityType = em.getType(id);
        let factionInfo: Record<string, any> = {};
        if (entityType === 'npc') {
          const fInfo = this.engine.getNpcFaction(id);
          if (fInfo) {
            const faction = this.engine.getFactions().get(fInfo.id);
            factionInfo = {
              factionId: fInfo.id,
              factionName: fInfo.name,
              factionRole: fInfo.role,
              factionType: faction?.type || null,
            };
          }
        }

        res.json({ id, ...exported, gridId, ...factionInfo });
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

    // GET /api/world/events/:tick — 指定回合事件
    this.app.get('/api/world/events/:tick', (req, res) => {
      try {
        const tick = parseInt(req.params.tick) || 0;
        const events = this.engine.getEventsByTick(tick);
        const time = this.engine.time;
        res.json({
          tick: tick || (events.length > 0 ? events[0].tick : 0),
          shichen: time.shichenName,
          day: time.day,
          weather: this.engine.weather.weather,
          events,
        });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/economy — 经济全景
    this.app.get('/api/world/economy', (_req, res) => {
      try {
        const data = this.engine.getEconomyOverview();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/ecology — 生态全景
    this.app.get('/api/world/ecology', (_req, res) => {
      try {
        const data = this.engine.getEcologyOverview();
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/weather/history — 天气历史
    this.app.get('/api/world/weather/history', (_req, res) => {
      try {
        const weather = this.engine.weather;
        res.json({
          current: weather.weather,
          history: weather.getHistoryDetail(),
        });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/propagation — 信息传播链
    this.app.get('/api/world/propagation', (_req, res) => {
      try {
        const chains = this.engine.getPropagationChains();
        res.json({ chains });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/npc/:id/history — NPC行为历史
    this.app.get('/api/world/npc/:id/history', (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const em = this.engine.em;

        if (!em.isAlive(id)) {
          res.status(404).json({ error: 'NPC not found' });
          return;
        }

        const identity = em.getComponent(id, 'Identity');
        const history = this.engine.getNPCHistory(id);

        res.json({
          npcId: id,
          name: identity?.name || '未知',
          history,
        });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/npc/:id/relations — NPC关系图谱
    this.app.get('/api/world/npc/:id/relations', (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const em = this.engine.em;

        if (!em.isAlive(id)) {
          res.status(404).json({ error: 'NPC not found' });
          return;
        }

        const identity = em.getComponent(id, 'Identity');
        const relations = this.engine.getNPCRelations(id);

        res.json({
          npcId: id,
          name: identity?.name || '未知',
          relations,
        });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/npc/:id/profile — NPC完整档案
    this.app.get('/api/world/npc/:id/profile', (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const em = this.engine.em;

        if (!em.isAlive(id) || em.getType(id) !== 'npc') {
          res.status(404).json({ error: 'NPC not found' });
          return;
        }

        const identity = em.getComponent(id, 'Identity');
        if (!identity) {
          res.status(404).json({ error: 'NPC has no identity' });
          return;
        }

        const pos = em.getComponent(id, 'Position');
        const vital = em.getComponent(id, 'Vital');
        const wallet = em.getComponent(id, 'Wallet');
        const inventory = em.getComponent(id, 'Inventory');
        const ai = em.getComponent(id, 'AI');
        const memory = em.getComponent(id, 'Memory');

        // 物品估值
        const ITEM_VALUES: Record<string, number> = {
          food: 5, goods: 20, herb: 15, herbs: 15, tool: 30, book: 50, luxury: 100,
          material: 10, cloth: 15, cargo: 8,
        };
        const items = inventory?.items || [];
        let itemsValue = 0;
        for (const item of items) {
          itemsValue += (ITEM_VALUES[item.itemType] || 10) * item.amount;
        }
        const totalAssets = (wallet?.copper || 0) + itemsValue;

        // 家庭信息
        const spouseIdentity = identity.spouseId ? em.getComponent(identity.spouseId, 'Identity') : null;
        const parents = (identity.parentIds || []).map(pid => {
          const p = em.getComponent(pid, 'Identity');
          return { id: pid, name: p?.name || '未知' };
        });
        const children = (identity.childIds || []).map(cid => {
          const c = em.getComponent(cid, 'Identity');
          return { id: cid, name: c?.name || '未知' };
        });
        const siblings = (identity.siblingIds || []).map(sid => {
          const s = em.getComponent(sid, 'Identity');
          return { id: sid, name: s?.name || '未知' };
        });

        // 家族信息（查找 Family 组件中包含该NPC的家族）
        let family: Record<string, any> | null = null;
        const allEntities = em.allEntities();
        for (const eid of allEntities) {
          const famComp = em.getComponent(eid, 'Family') as any;
          if (famComp && famComp.members && famComp.members.includes(id)) {
            const allMembers = famComp.members.map((mid: number) => {
              const m = em.getComponent(mid, 'Identity');
              return { id: mid, name: m?.name || '未知' };
            });
            family = {
              familyName: famComp.familyName,
              familyId: famComp.familyId,
              headId: famComp.headId,
              headName: em.getComponent(famComp.headId, 'Identity')?.name || '未知',
              generation: famComp.generation,
              allMembers,
            };
            break;
          }
        }

        // 房产信息（遍历建筑找 ownerId=该NPC 的建筑列表）
        const property: Record<string, any>[] = [];
        const homeBuilding = identity.homeId ? em.getComponent(identity.homeId, 'Building') : null;
        const homePosition = identity.homeId ? em.getComponent(identity.homeId, 'Position') : null;
        const workplaceBuilding = identity.workplaceId ? em.getComponent(identity.workplaceId, 'Building') : null;
        const workplacePosition = identity.workplaceId ? em.getComponent(identity.workplaceId, 'Position') : null;

        for (const eid of allEntities) {
          const building = em.getComponent(eid, 'Building');
          if (!building) continue;
          if (building.ownerId === id) {
            const bpos = em.getComponent(eid, 'Position');
            const bExt = building as any;
            property.push({
              buildingId: eid,
              buildingName: bExt.name || building.type,
              buildingType: building.type,
              gridId: bpos?.gridId || '',
            });
          }
        }

        // 组织信息
        const factionInfo = this.engine.getNpcFaction(id);
        let organization: Record<string, any> | null = null;
        if (factionInfo) {
          const faction = this.engine.getFactions().get(factionInfo.id);
          if (faction) {
            const memberList = faction.members.map(mid => {
              const m = em.getComponent(mid, 'Identity');
              return { id: mid, name: m?.name || '未知', role: 'member' as string };
            });
            // 加上 leader
            if (faction.leaderId) {
              const leaderName = em.getComponent(faction.leaderId, 'Identity')?.name || '未知';
              memberList.unshift({ id: faction.leaderId, name: leaderName, role: 'leader' });
            }
            organization = {
              factionId: factionInfo.id,
              factionName: factionInfo.name,
              factionType: faction.type,
              factionRole: factionInfo.role,
              factionMembers: memberList,
              leaderId: faction.leaderId,
              leaderName: faction.leaderId ? em.getComponent(faction.leaderId, 'Identity')?.name || '未知' : null,
            };
          }
        }

        // 关系
        const relations = this.engine.getNPCRelations(id);

        // 历史
        const history = this.engine.getNPCHistory(id);

        res.json({
          basic: {
            id,
            name: identity.name,
            profession: identity.profession,
            age: identity.age,
            personality: identity.personality,
            gridId: pos?.gridId || '',
            areaId: pos?.areaId || '',
          },
          vital: vital ? {
            hunger: Math.round(vital.hunger),
            fatigue: Math.round(vital.fatigue),
            health: Math.round(vital.health),
            mood: Math.round(vital.mood),
          } : null,
          wealth: {
            copper: wallet?.copper || 0,
            items: items.map(i => ({ itemType: i.itemType, amount: i.amount, value: (ITEM_VALUES[i.itemType] || 10) * i.amount })),
            itemsValue,
            totalAssets,
          },
          family: {
            familyName: family?.familyName || identity.name[0],
            familyId: family?.familyId || null,
            familyHead: family ? { id: family.headId, name: family.headName } : null,
            spouse: identity.spouseId ? { id: identity.spouseId, name: spouseIdentity?.name || '未知' } : null,
            parents,
            children,
            siblings,
            allMembers: family?.allMembers || [],
          },
          property,
          home: identity.homeId ? {
            buildingId: identity.homeId,
            buildingName: (homeBuilding as any)?.name || homeBuilding?.type || '民居',
            buildingType: homeBuilding?.type || 'house',
            gridId: homePosition?.gridId || '',
          } : null,
          workplace: identity.workplaceId ? {
            buildingId: identity.workplaceId,
            buildingName: (workplaceBuilding as any)?.name || workplaceBuilding?.type || '',
            buildingType: workplaceBuilding?.type || '',
            gridId: workplacePosition?.gridId || '',
          } : null,
          organization,
          relations: relations.map(r => ({
            targetId: r.targetId,
            targetName: r.targetName,
            score: r.score,
            label: r.score > 20 ? '友好' : r.score > 0 ? '略好' : r.score > -20 ? '冷淡' : '敌对',
          })),
          ai: ai ? {
            goals: ai.goals,
            plan: ai.currentPlan,
            aiLevel: ai.aiLevel,
          } : null,
          memory: memory ? {
            recentEvents: memory.recentEvents.slice(-10),
            impressions: Object.entries(memory.impressions).map(([tid, score]) => {
              const tIdentity = em.getComponent(Number(tid), 'Identity');
              return { targetId: Number(tid), targetName: tIdentity?.name || '未知', score: score as number };
            }),
          } : null,
          history: history.slice(-20).reverse(),
        });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/nearby — 获取玩家当前位置周围实体
    this.app.get('/api/world/nearby', (_req, res) => {
      try {
        if (this.playerId === 0) this.ensurePlayer();
        const entities = this.engine.getNearbyEntities(this.playerId);
        res.json({ entities });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/move-options — 获取当前位置的移动选项
    this.app.get('/api/world/move-options', (_req, res) => {
      try {
        if (this.playerId === 0) this.ensurePlayer();
        const options = this.engine.getMovementOptions(this.playerId);
        const pos = this.engine.em.getComponent(this.playerId, 'Position');
        const currentGrid = pos?.gridId || 'center_street';
        res.json({ currentGrid, currentName: this.engine.getGridDisplayName(currentGrid), options });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/entity/:id/actions — 获取实体可用行为
    this.app.get('/api/world/entity/:id/actions', (req, res) => {
      try {
        if (this.playerId === 0) this.ensurePlayer();
        const targetId = parseInt(req.params.id);
        if (!this.engine.em.isAlive(targetId)) {
          res.status(404).json({ error: 'Entity not found' });
          return;
        }
        const result = this.engine.calculateEntityActions(this.playerId, targetId);
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // POST /api/end-turn — 结束当前回合
    this.app.post('/api/end-turn', (_req, res) => {
      try {
        if (this.playerId === 0) this.ensurePlayer();
        const result = this.engine.endTurn(this.playerId);
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // ── 组织势力 API ──────────────────────────────────────────

    // GET /api/world/factions — 组织列表（支持搜索）
    this.app.get('/api/world/factions', (req, res) => {
      try {
        const search = req.query.search as string | undefined;
        const type = req.query.type as string | undefined;
        const allFactions = Array.from(this.engine.getFactions().entries());
        const filtered = allFactions.filter(([, f]) => {
          if (search && !f.name.includes(search)) return false;
          if (type && f.type !== type) return false;
          return true;
        });
        const result = filtered.map(([id, f]) => {
          const leader = f.leaderId ? this.engine['em']?.getComponent(f.leaderId, 'Identity') : null;
          return {
            id, name: f.name, type: f.type, influence: f.influence,
            treasury: f.treasury, mood: f.mood,
            memberCount: f.members.length,
            leaderId: f.leaderId, leaderName: leader?.name || null,
            territory: f.territory,
          };
        });
        res.json({ total: result.length, factions: result });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/factions/:id — 组织详情
    this.app.get('/api/world/factions/:id', (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const detail = this.engine.getFactionDetail(id);
        if (!detail) {
          res.status(404).json({ error: 'Faction not found' });
          return;
        }
        const f = detail.faction;
        const leader = f.leaderId ? this.engine['em']?.getComponent(f.leaderId, 'Identity') : null;
        res.json({
          id, name: f.name, type: f.type, influence: f.influence,
          treasury: f.treasury, mood: f.mood,
          members: detail.memberInfo,
          leaderId: f.leaderId, leaderName: leader?.name || null,
          territory: f.territory, relations: f.relations,
        });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/factions/:id/history — 组织历史事件
    this.app.get('/api/world/factions/:id/history', (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const faction = this.engine.getFactions().get(id);
        if (!faction) {
          res.status(404).json({ error: 'Faction not found' });
          return;
        }
        const events = this.engine.getFactionHistory(id, limit);
        res.json({ factionId: id, factionName: faction.name, total: events.length, events });
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/building/:id/interior — 建筑内部数据
    this.app.get('/api/world/building/:id/interior', (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const data = this.engine.getBuildingInterior(id);
        if (!data) {
          res.status(404).json({ error: 'Building not found' });
          return;
        }
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    // GET /api/world/building/:id — 建筑详情（监控面板用）
    this.app.get('/api/world/building/:id', (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const data = this.engine.getBuildingDetail(id);
        if (!data) {
          res.status(404).json({ error: 'Building not found' });
          return;
        }
        res.json(data);
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
      const apData = this.engine.getPlayerAP(this.playerId);

      const welcomeMsg: ServerMessage = {
        type: 'welcome',
        seqId: 0,
        data: {
          message: '连接成功，欢迎来到汴京！',
          sceneDescription: initialScene.description,
          sceneLocation: `汴京 · ${initialScene.location}`,
          // 不再发送硬编码的场景选项 — 选项由 nearby 实体和 move-options 动态提供
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
            ap: apData.current,
            apMax: apData.max,
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
                // 不再发送硬编码的场景选项 — 选项由 nearby 实体和 move-options 动态提供
                npcMessages: result.npcMessages,
                worldState: result.worldState,
                perception: result.perception,
                playerState: result.playerState,
                turnSummary: result.turnSummary,
                distantNews: result.distantNews,
                briefing: result.briefing,
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
    this.engine.em.addComponent(this.playerId, 'ActionPoints', { current: 5, max: 5 });
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
      console.log(`   GET  /api/world/events/:tick → 指定回合事件`);
      console.log(`   GET  /api/world/economy  → 经济全景`);
      console.log(`   GET  /api/world/ecology  → 生态全景`);
      console.log(`   GET  /api/world/weather/history → 天气历史`);
      console.log(`   GET  /api/world/propagation → 传播链`);
      console.log(`   GET  /api/world/npc/:id/history → NPC历史`);
      console.log(`   GET  /api/world/npc/:id/relations → NPC关系`);
      console.log(`   GET  /api/world/npc/:id/profile   → NPC完整档案`);
      console.log(`   GET  /api/world/nearby       → 周围实体`);
      console.log(`   GET  /api/world/move-options → 移动选项`);
      console.log(`   GET  /api/world/entity/:id/actions → 实体行为`);
      console.log(`   POST /api/end-turn           → 结束回合`);
      console.log(`   GET  /api/world/building/:id → 建筑详情`);
      console.log(`   GET  /api/world/building/:id/interior → 建筑内部`);
      console.log(`   GET  /api/world/factions → 组织列表`);
      console.log(`   GET  /api/world/factions/:id → 组织详情`);
      console.log(`   GET  /api/world/factions/:id/history → 组织历史`);
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

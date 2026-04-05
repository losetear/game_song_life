# NPC 自主行为系统设计文档

## 1. 设计目标

像模拟人生（The Sims）一样，每个 NPC 有自己的**需求驱动力**、**个人目标**和**可用行动清单**。每回合 NPC 根据当前状态自主选择行动，而非依赖固定的 GOAP/行为树模板。

### 核心原则
- **需求驱动**：饥饿→找吃的，疲惫→去睡觉，心情低→社交/娱乐
- **职业专属**：商人卖货、农夫种地、守卫巡逻、盗贼偷窃
- **角色身份**：组织首领→管理组织、父母→照顾子女、配偶→陪伴家人
- **环境响应**：下雨→避雨、暴雨→停止户外工作、物价涨→囤货

## 2. 需求系统（Needs System）

类似模拟人生的 Motives，6 个核心需求（0~100）：

```
饥饿 hunger    — 每回合 -3~5，低于20触发"找食物"目标
疲劳 fatigue    — 工作消耗，低于20触发"休息"目标
健康 health     — 生病/受伤降低，低于30触发"求医"目标
心情 mood       — 社交/娱乐提升，低于30触发"社交"目标
安全 safety     — 危险环境降低，低于30触发"躲避"目标
社交 social     — 独处降低，低于30触发"找人聊天"目标
```

### 需求权重（因职业/性格而异）
```typescript
const NEED_WEIGHTS = {
  merchant:   { hunger: 1.0, fatigue: 0.8, health: 1.0, mood: 0.7, safety: 0.6, social: 0.8 },
  guard:      { hunger: 1.0, fatigue: 0.6, health: 1.2, mood: 0.5, safety: 1.5, social: 0.6 },
  rogue:      { hunger: 1.2, fatigue: 0.7, health: 0.8, mood: 0.9, safety: 1.0, social: 0.5 },
  doctor:     { hunger: 0.8, fatigue: 0.9, health: 1.5, mood: 0.6, safety: 0.7, social: 0.8 },
  farmer:     { hunger: 1.3, fatigue: 0.5, health: 1.0, mood: 0.6, safety: 0.8, social: 0.7 },
  hunter:     { hunger: 1.0, fatigue: 0.6, health: 1.0, mood: 0.5, safety: 1.2, social: 0.4 },
  // ... 其他职业
};
```

## 3. 目标系统（Goal System）

### 3.1 目标生成规则

每回合从需求、职业、身份、环境四个维度生成候选目标：

```typescript
interface NPCGoal {
  id: string;          // 目标ID
  name: string;        // 显示名
  priority: number;    // 优先级 0~100
  category: 'survival' | 'work' | 'social' | 'family' | 'faction' | 'leisure';
  deadline: number;    // 剩余回合数（-1=持续目标）
}
```

### 3.2 目标优先级计算

```
priority = basePriority + needUrgency + roleBonus + personalityModifier
```

| 目标 | 触发条件 | basePriority | 说明 |
|------|----------|-------------|------|
| 找食物 | hunger < 30 | 80 + (30-hunger)*2 | 饿了就要吃 |
| 去睡觉 | fatigue < 25 | 70 + (25-fatigue)*2 | 累了就要睡 |
| 求医 | health < 40 | 60 + (40-health)*1.5 | 病了看医生 |
| 去工作 | copper < 20 | 50 | 没钱就工作 |
| 卖货 | merchant + hasStock | 55 | 商人有货就卖 |
| 巡逻 | guard + isDaytime | 45 | 守卫白天巡逻 |
| 偷窃 | rogue + nearRich | 40 | 盗贼见财起意 |
| 社交 | social < 30 | 35 + (30-social) | 孤独找人聊 |
| 陪家人 | hasFamilyNearby | 30 | 家人就在旁边 |
| 管理组织 | factionLeader | 50 | 首领要管事 |
| 去茶馆 | mood < 40 + hasMoney | 30 | 心情不好喝茶 |
| 拜佛 | religion faction | 25 | 宗教NPC日常 |
| 练习技能 | teacher/blacksmith | 35 | 技术NPC精进 |

### 3.3 目标选择算法

每回合：
1. 从所有维度生成候选目标列表（通常 5~15 个）
2. 按 priority 降序排列
3. 取 top 1 作为当前主目标
4. top 2~3 作为备选目标

**性格影响**：
- 胆小 → 安全类目标 priority × 1.5
- 勇敢 → 安全类目标 priority × 0.7
- 大方 → 社交类目标 priority × 1.3
- 沉默 → 社交类目标 priority × 0.6
- 狡猾 → 工作/金钱类 priority × 1.3

## 4. 行动系统（Action System）

### 4.1 行动定义

```typescript
interface NPCAction {
  id: string;
  name: string;           // 显示名
  icon: string;           // emoji
  needsTargets: string[]; // 需要什么目标: ['npc','building','grid']
  cost: {                 // 行动消耗
    fatigue?: number;     // 疲劳消耗
    copper?: number;      // 花钱
    ap?: number;          // 行动点
  };
  effects: {              // 行动效果
    hunger?: number;
    fatigue?: number;
    health?: number;
    mood?: number;
    copper?: number;
    safety?: number;
    social?: number;
  };
  conditions: {           // 前置条件（满足才能选）
    minHunger?: number;
    minHealth?: number;
    minCopper?: number;
    atLocation?: string;  // 需要在某位置
    hasItem?: string;     // 需要某物品
    profession?: string[]; // 职业限制
    factionRole?: string;  // 组织角色
  };
  narrative: string;      // 叙事文本模板 {name}代表NPC名
}
```

### 4.2 行动清单（按类别）

#### 生存类（Survival）- 所有NPC可用
| ID | 名字 | 消耗 | 效果 | 条件 |
|----|------|------|------|------|
| eat_food | 吃饭 | copper -5, fatigue -3 | hunger +30, mood +3 | copper >= 5 |
| eat_home | 在家吃饭 | fatigue -2 | hunger +25 | at_home, has_food |
| sleep | 睡觉 | - | fatigue +40, hunger -8 | at_home |
| rest | 休息 | - | fatigue +15, hunger -5 | 无 |
| buy_food | 买食物 | copper -8 | has_food=true, hunger +20 | at_market, copper >= 8 |

#### 工作类（Work）- 职业专属
| ID | 名字 | 职业 | 消耗 | 效果 | 条件 |
|----|------|------|------|------|------|
| sell_goods | 卖货 | merchant | fatigue -15 | copper +20, mood +5 | has_stock, at_market |
| restock | 进货 | merchant | copper -10, fatigue -10 | has_stock=true | at_market, copper>=10 |
| farm_work | 务农 | farmer | fatigue -25, hunger -10 | copper +8 | at_farm |
| patrol | 巡逻 | guard | fatigue -10 | mood +3, safety +5 | is_daytime |
| treat_patient | 看诊 | doctor | fatigue -15 | copper +15, mood +8 | has_herbs |
| steal | 偷窃 | rogue | fatigue -10 | copper +15 (成功) | near_rich_npc |
| carry_cargo | 搬货 | laborer | fatigue -20 | copper +6 | at_dock |
| hunt | 打猎 | hunter | fatigue -25 | has_food=true | at_mountain |
| forge | 锻造 | blacksmith | fatigue -20, copper -5 | skill+5, has_product=true | at_shop |
| teach | 授课 | teacher | fatigue -15 | copper +10, social +5 | at_school |

#### 社交类（Social）
| ID | 名字 | 消耗 | 效果 | 条件 |
|----|------|------|------|------|
| chat | 闲聊 | fatigue -3 | mood +5, social +10 | near_npc |
| drink | 喝茶/酒 | copper -3, fatigue -5 | mood +12, social +5 | at_teahouse, copper>=3 |
| visit_friend | 访友 | fatigue -5 | mood +8, social +15 | has_friend |
| family_dinner | 家宴 | copper -10 | mood +15, social +20 | near_family, copper>=10 |
| ask_rumor | 打听 | fatigue -2 | social +5 | near_npc |

#### 组织类（Faction）
| ID | 名字 | 角色 | 消耗 | 效果 | 条件 |
|----|------|------|------|------|------|
| faction_manage | 管理组织 | leader | fatigue -10 | faction.mood+5, mood+5 | is_leader |
| faction_salary | 领俸禄 | member | - | copper +15 | faction_member |
| faction_meeting | 开会 | leader | fatigue -8 | faction.mood+10 | near_faction_members>=2 |
| faction_patrol | 组织巡逻 | member | fatigue -10 | safety+5, faction.mood+3 | faction_member |

#### 休闲类（Leisure）
| ID | 名字 | 消耗 | 效果 | 条件 |
|----|------|------|------|------|
| temple_pray | 拜佛 | copper -2 | mood +8, safety +5 | at_temple |
| gamble | 赌博 | copper -20~+40 | mood ±10 | copper>=20 |
| study | 读书 | fatigue -10 | knowledge+3 | at_home |

#### 移动类（Movement）- 实现位置转移
| ID | 名字 | 消耗 | 效果 |
|----|------|------|------|
| go_home | 回家 | fatigue -3 | 移动到住所 |
| go_market | 去市场 | fatigue -3 | 移动到市场 |
| go_teahouse | 去茶馆 | fatigue -2 | 移动到茶馆 |
| go_dock | 去码头 | fatigue -4 | 移动到码头 |
| go_farm | 去农田 | fatigue -4 | 移动到农田 |
| go_mountain | 去山林 | fatigue -5 | 移动到山林 |

### 4.3 行动选择算法

```
给定当前主目标 → 从行动清单中筛选可用行动：
  1. 满足 conditions（职业/位置/金钱/物品）
  2. effects 中对目标需求有正面效果
  3. cost 可承受（不会导致其他关键需求 < 10）

从筛选结果中：
  - 如果只有 1 个 → 选择它
  - 如果多个 → 按效用值排序取最优
    utility = 目标需求改善量 × 需求权重 - cost代价
```

### 4.4 行动执行流程

```
1. NPC 选择行动
2. 检查前置条件
   - 不满足？→ 尝试满足（如"需要at_market"→先执行go_market）
   - 满足？→ 执行行动
3. 应用效果
   - 修改 NPC 的 vital/copper/mood 等
   - 修改关系（社交行动）
   - 生成叙事事件（写入事件日志）
4. 生成叙事文本
   - 格式："{时间} {地点} {NPC名}{动词}{对象}。{细节描述}"
   - 例："午时 市集 张三摆出丝绸和瓷器的货摊，吆喝着招揽客人。一个时辰后，卖出了三匹丝绸，进账五十八文。"
```

## 5. 回合流程

每回合每个 NPC 执行以下步骤：

```
Step 1: 需求衰减
  hunger -= 3~5（看职业）
  fatigue -= 工作/行动消耗
  mood -= 1~3
  social -= 1~2

Step 2: 生成候选目标
  从需求/职业/身份/环境四个维度
  计算每个目标的 priority

Step 3: 选择目标
  取 priority 最高的目标

Step 4: 选择行动
  从行动清单筛选符合目标的可用行动
  计算效用值选最优

Step 5: 检查条件链
  如果不满足条件→插入前置行动
  例：想"卖货"但不在市场→先"去市场"

Step 6: 执行行动
  应用效果 + 生成叙事

Step 7: 记录到历史
  写入 NPC 行为历史 + 世界事件日志
```

## 6. 叙事生成规则

每个行动的叙事文本分为三层：

### 6.1 基础叙事
```
{NPC名}{行动动词}。例：张三吃了碗面条。
```

### 6.2 环境叙事
```
{天气/季节/时间} + {NPC名}{详细描述}。
例：午时阳光正好，张三在市集支起摊位，把丝绸整齐地铺开。
```

### 6.3 角色叙事
```
{NPC名}{行动}，{职业特点/性格描述}。
例：张三精明地打量着来往的客人，碰到看起来有钱的就热情招呼，对穿得寒酸的则懒得多看一眼。
```

## 7. 前端展示

### 7.1 监控面板 - NPC AI 页面增强

在 NPC 档案页显示：
- **当前需求值**：6个进度条（饥饿/疲劳/健康/心情/安全/社交）
- **当前目标**：主目标 + 2~3个备选目标（带优先级）
- **当前行动**：正在执行的行动（带图标）
- **行动历史**：时间线，每条带叙事文本

### 7.2 上帝模式 - AI 调试

- 查看 NPC 的目标选择过程（为什么选了这个目标）
- 强制修改 NPC 目标/需求
- 查看某 NPC 本回合的决策详情

## 8. 数据结构变更

### 8.1 新增组件

```typescript
// NPC 需求组件
interface NeedsComponent {
  hunger: number;    // 0~100
  fatigue: number;   // 0~100 (100=精力充沛)
  health: number;    // 0~100
  mood: number;      // 0~100
  safety: number;    // 0~100
  social: number;    // 0~100
}

// NPC 行动状态组件
interface ActionStateComponent {
  currentGoal: string | null;       // 当前主目标ID
  currentAction: string | null;    // 当前行动ID
  actionQueue: string[];           // 行动队列（条件链）
  availableActions: string[];      // 可用行动清单（基于职业/身份）
  lastActionTurn: number;          // 上次行动的回合
  actionHistory: ActionRecord[];   // 行动历史（最近50条）
}

interface ActionRecord {
  turn: number;
  day: number;
  shichen: string;
  goalId: string;
  actionId: string;
  narrative: string;
  effects: Record<string, number>;
}
```

### 8.2 修改 AIComponent

```typescript
interface AIComponent {
  goals: string[];           // 当前目标列表
  currentPlan: string[];     // 当前计划（行动队列）
  planCooldown: number;      // 计划冷却
  aiLevel: 0 | 1 | 2;       // AI等级
  // 新增：
  personalityWeights: Record<string, number>; // 性格对需求的权重修正
  professionBias: string;    // 职业倾向 ('work' | 'social' | 'survival')
}
```

## 9. 实现计划

### Phase 1: 数据结构 + 需求系统
- types.ts: 新增 NeedsComponent、ActionStateComponent
- entities.ts: NPC 生成时初始化需求和行动状态
- worldEngine.ts: 每回合需求衰减逻辑

### Phase 2: 目标系统
- 新增 src/ai/goalGenerator.ts: 目标生成器
- 按需求/职业/身份/环境四个维度生成目标
- 优先级计算 + 性格修正

### Phase 3: 行动系统
- 新增 src/ai/actionRegistry.ts: 行动注册表（40+行动）
- 行动条件检查 + 效果应用
- 条件链自动补全（如需要先移动再行动）

### Phase 4: 决策引擎
- 新增 src/ai/decisionEngine.ts: 每回合决策流程
- 替换现有 GOAP/行为树为新的需求驱动系统
- 统一 L0 和 L1 NPC 的决策逻辑（L0 用完整版，L1 用简化版）

### Phase 5: 叙事生成
- 新增 src/ai/narrativeGenerator.ts: 叙事文本生成
- 三层叙事（基础/环境/角色）

### Phase 6: 前端展示
- index.html: NPC 档案显示需求条+目标+行动
- 上帝模式: AI 调试工具

## 10. 兼容性

- 保留现有 emergenceRules.ts（玩家交互仍用涌现规则）
- NPC 自主行动用新系统，不与涌现规则冲突
- GOAP planner 保留但标记为 deprecated
- Profile API 扩展：返回 needs/goals/actionState

# NPC动态交互系统设计

## Context

当前《市井录》原型中，NPC只是场景中的名字标签。底层基础设施（好感度、叙事标签、事件匹配器）已完整，但玩家无法对任何具体NPC发起交互。需要实现"点击NPC → 动态衍生选项 → 多幕演出 → 全维后果"的完整交互链路。

## 核心设计决策

1. **混合式UI** — 快速交互用选项列表（brief），深度互动用多幕对话（scene/drama）
2. **模板过滤 + 场景匹配结合** — Layer1通用模板生成基础选项，Layer2匹配特殊演出
3. **三级演出深度** — brief（1幕）/ scene（2-3幕）/ drama（4-5幕）
4. **双向对话循环** — NPC有性格驱动的反应，可提反向要求，最多3轮
5. **七维后果系统** — 后果影响玩家、NPC、关系、经济、信息传播、世界状态、连锁触发

---

## 一、交互上下文

```typescript
interface InteractionContext {
  player: {
    id: number; name: string; profession: string;
    hunger: number; fatigue: number; health: number; mood: number;
    copper: number; narrativeTags: string[]; actionPoints: number;
  };
  npc: {
    id: number; name: string; profession: string; personality: string[];
    age: number; hunger: number; fatigue: number; health: number; mood: number;
    copper: number; narrativeTags: string[];
  };
  relation: number;           // -100 ~ 100
  relationLevel: string;      // 至交/好友/熟人/路人/嫌隙/仇视/死敌
  environment: {
    locationId: string; weather: string; season: string;
    day: number;
  };
}
```

---

## 二、选项衍生

### Layer 1：通用模板过滤

定义约15个通用交互模板，每个模板有条件过滤。运行时根据 InteractionContext 动态过滤出可用模板。

| 模板ID | 名称 | 条件 | 深度 | 消耗 |
|--------|------|------|------|------|
| chat | 闲聊 | 好感>-50 | brief | 0AP |
| ask_info | 打听消息 | 好感>0 | scene | 1AP |
| gift | 送礼 | 铜钱>=10 | brief | 1AP+铜钱 |
| trade | 交易 | NPC是商贩/掌柜 | brief | 1AP |
| ask_help | 求助 | 好感>=25 | scene | 1AP |
| invite_tea | 邀请喝茶 | 铜钱>=5, 好感>=10 | scene | 1AP+铜钱 |
| provoke | 挑衅 | 无条件 | scene | 1AP |
| learn | 请教 | NPC职业≠玩家职业 | scene | 1AP |
| rumor | 传播消息 | 玩家有叙事标签 | brief | 0AP |
| compliment | 恭维 | 无条件 | brief | 0AP |
| threaten | 威胁 | 好感<0 | scene | 1AP |
| apologize | 道歉 | 好感<25且有过冲突标签 | scene | 1AP |
| say_goodbye | 告别 | 无条件 | brief | 0AP |

### Layer 2：特殊场景匹配

定义InteractionScene，有严格的触发条件（叙事标签、职业组合、好感区间、天气季节等）。匹配到的场景生成特殊选项。

示例场景：
- 玩家有"铁匠学徒"标签 + NPC是铁匠 → "讨教技艺"（scene级）
- 好感>=50 + 雨/雪天 → "共撑一把伞"（scene级）
- NPC健康<30 + 好感>=25 → "关切地问身体状况"（scene级）
- 好感<-30 + NPC暴躁/贪婪 → "冲突升级"（drama级）
- 玩家有"知道山洞位置" + NPC是猎户 → "提到山中洞穴"（scene级）

### 选项合并规则

1. drama > scene > brief（稀有选项排前面）
2. 同级别内按条件匹配精度排序
3. 每次最多显示6个选项
4. "告别"永远在最后

---

## 三、演出系统

### 数据结构

```typescript
interface InteractionScene {
  id: string;
  depth: 'brief' | 'scene' | 'drama';
  triggerCondition: SceneCondition;
  acts: Act[];
}

interface Act {
  id: string;
  narrative: (ctx: InteractionContext) => string;
  stageDirection?: (ctx: InteractionContext) => string;  // 环境描写
  choices?: ActChoice[];
  autoNext?: string;  // 无选项时自动推进
}

interface ActChoice {
  id: string;
  text: string;
  condition?: { field: string; operator: 'gte' | 'lte'; value: number };
  consequence: InteractionConsequence;
  nextAct?: string;  // 跳转到哪一幕，null=结束
}
```

### 三级深度

| 深度 | 幕数 | 适用场景 | 示例 |
|------|------|---------|------|
| brief | 1 | 简短日常互动 | 闲聊、送礼、告别 |
| scene | 2-3 | 有意义的互动 | 请教技艺、求助、邀请喝茶 |
| drama | 4-5 | 重大事件 | 冲突升级、结拜、重大交易 |

### stageDirection（环境描写）

与narrative（角色行为）分离，增强沉浸感。UI中用不同样式呈现。

---

## 四、NPC反应系统

### 性格×好感×行动 反应表

NPC反应基于三维度查表：

| 性格 | 对友好 | 对冒犯 | 对求助 | 对交易 |
|------|--------|--------|--------|--------|
| 善良 | 热情(+5) | 忍让(-2) | 慷慨帮助 | 公平交易 |
| 暴躁 | 普通(+2) | 暴怒(-15) | 不耐烦(+1) | 急躁 |
| 精明 | 审视(+1) | 记仇(-10) | 讲条件 | 精打细算 |
| 豪爽 | 大笑(+8) | 不放在心上(-3) | 二话不说 | 请客 |
| 沉默 | 点头(+1) | 冷眼(-8) | 沉默帮助 | 简洁 |
| 贪婪 | 有所图(+3) | 记恨(-12) | 要报酬 | 抬价 |

### 好感区间影响语气

| 好感 | 语气 | 开场白风格 |
|------|------|-----------|
| 至交(80+) | 亲热 | 热情打招呼 |
| 好友(50-79) | 友好 | 主动攀谈 |
| 熟人(25-49) | 客气 | 正常问候 |
| 路人(-24~24) | 平淡 | 公事公办 |
| 嫌隙(-50~-25) | 冷淡 | 不愿搭理 |
| 仇视(-80~-49) | 敌意 | 驱赶/威胁 |

### 双向对话循环

- 每轮对话后NPC有概率提反向要求（概率基于性格×好感）
- 最多3轮循环
- drama级NPC可在幕间主动干预（如主动动手）

---

## 五、七维后果系统

### InteractionConsequence 完整结构

```typescript
interface InteractionConsequence {
  narrative: (ctx: InteractionContext) => string;

  // ① 玩家自身
  player?: {
    vital?: Record<'hunger' | 'fatigue' | 'health' | 'mood', number>;
    copper?: number;
    gainTag?: string;
    loseTag?: string;
    gainSkill?: { id: string; name: string; level: number };
    title?: string;
  };

  // ② NPC自身
  npc?: {
    vital?: Record<'hunger' | 'fatigue' | 'health' | 'mood', number>;
    copper?: number;
    gainTag?: string;
    changeSchedule?: { slot: string; locationId: string };
    changeProfession?: string;
  };

  // ③ 双边关系
  relation?: {
    change: number;
    spreadToNpcRelations?: { personality: string[]; change: number };
  };

  // ④ 经济
  economy?: {
    goodId: string;
    priceModifier: number;   // 价格修正比例
    duration: number;         // 持续天数
  };

  // ⑤ 信息传播
  rumor?: {
    text: string;
    spreadRange: 'nearby' | 'district' | 'city';
    fidelity: number;         // 0-1 保真度
    effectOnListeners?: { narrativeTag: string; relationChange: number };
  };

  // ⑥ 世界状态
  world?: {
    unlockLocation?: string;
    unlockEvent?: string;
    changeLocationDesc?: { id: string; newDesc: string };
    spawnNpc?: { name: string; profession: string; defaultLocation: string };
    flagSet?: Record<string, boolean>;
  };

  // ⑦ 连锁触发
  chain?: {
    triggerEventId?: string;
    delayedEvent?: { days: number; eventId: string };
    triggerNpcAction?: { npcId: number; actionId: string };
  };
}
```

### 后果应用时机

| 维度 | 时机 | 说明 |
|------|------|------|
| player/npc vital | 立即 | 数值当场变 |
| relation | 立即 | 好感度当场变 |
| player/npc gainTag | 立即 | 标签当场获得 |
| economy | 下一回合 | 下次advanceDay时价格生效 |
| rumor | 下一回合 | 下次advanceDay时开始传播 |
| world state | 立即/下一回合 | 描述立即变，新NPC下回合生成 |
| chain.delayedEvent | N天后 | 计入延迟队列 |

### 后果示例

**帮商贩宣传 → 多维后果同时发生：**
- player: mood+5, gainTag '市井人脉'
- npc: copper+20, mood+10
- relation: change+8
- economy: 布匹价格-10%持续5天（商贩生意好了，货多了）
- rumor: "有人在帮商贩吆喝"在街区传播，善良的人好感+2
- chain: 10天后商贩主动找你报恩（triggerEventId: 'merchant_gratitude'）

**得罪码头帮 → 连锁后果：**
- player: health-10, gainTag '得罪码头帮'
- npc: mood-20, gainTag '记恨着你'
- relation: change-25, spreadToNpcRelations: { personality: ['贪婪'], change: -10 }
- rumor: "有人惹了码头帮"全城传播，保真度0.6
- chain: delayedEvent { days: 3, eventId: 'dock_revenge' }
- chain: triggerNpcAction { 码头帮头目 → 召集人手 }

---

## 六、引擎API

```typescript
class NpcInteractionEngine {
  startInteraction(npcId: number, worldCtx: WorldContext): InteractionState;
  chooseOption(optionId: string): ActResult;
  advanceAct(actId: string): ActState;
  endInteraction(): InteractionSummary;
  getState(): InteractionState | null;
}

class ConsequenceEngine {
  apply(consequence: InteractionConsequence, ctx: InteractionContext): void;
}
```

---

## 七、UI组件

```
NpcInteractionOverlay.vue      -- overlay容器
├── NpcHeader.vue              -- NPC名字/职业/好感/性格
├── NpcDialogLog.vue           -- 对话文本（narrative+stageDirection双样式）
├── NpcActionList.vue          -- 选项按钮列表
└── NpcRequestPanel.vue        -- NPC反向要求+玩家选择
```

UI状态：gameStore.gameState 增加 'interacting' 状态，交互中冻结其他操作。

---

## 八、新增/改动文件

### 新增
```
src/core/ai/NpcInteractionEngine.ts      -- 交互+演出引擎
src/core/ai/ConsequenceEngine.ts         -- 七维后果处理器
src/core/data/InteractionTemplates.ts    -- 通用模板 ~15个
src/core/data/InteractionScenes.ts       -- 场景演出 ~10个
src/core/data/InteractionDramas.ts       -- 大戏演出 ~5个
src/core/data/NpcReactionTable.ts        -- NPC反应表
src/core/data/NpcRequestPool.ts          -- NPC反向请求池
src/stores/interactionStore.ts           -- 交互状态
src/components/game/NpcInteractionOverlay.vue  -- 交互面板
```

### 改动
```
src/core/world/WorldEngine.ts            -- 新增延迟队列+委托方法+传闻传播
src/App.vue                              -- NPC标签@click+交互面板
src/stores/gameStore.ts                  -- gameState='interacting'
src/stores/uiStore.ts                    -- selectedNpcId
```

### 不改动
```
RelationSystem / VitalSystem / EconomySystem  -- 只是被调用
ActionRegistry / DecisionEngine               -- 交互引擎独立于行动系统
BranchEvent / Matcher                         -- 交互引擎独立于事件系统
```

---

## 九、实施优先级

1. **Phase 1**: NpcInteractionEngine骨架 + InteractionContext + 模板过滤
2. **Phase 2**: 演出系统（Act/ActChoice）+ brief级模板实现
3. **Phase 3**: NPC反应系统 + 双向对话循环
4. **Phase 4**: ConsequenceEngine + 七维后果（先实现player/npc/relation）
5. **Phase 5**: 经济后果 + 传闻传播 + 连锁触发
6. **Phase 6**: scene/drama级演出内容 + UI打磨

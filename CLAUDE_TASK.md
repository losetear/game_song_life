# 丰富性开发任务 — 物品/背包系统 + 店铺交易 + 日常细化

## 背景

项目已完成：ECS引擎、时间/天气/季节系统、50个NPC+效用AI、场景事件系统（195个/10类别）、NPC交互系统（动态选项+演出+反应）、传闻/经济/关系/死亡系统。
当前处于第二→三阶段之间。玩家可以走动、看事件、和NPC交互，但缺少"赚钱→花钱→生存"的闭环体验。

## 总体目标

让玩家的每一天都有丰富的选择和后果，形成完整的每日循环。

---

## 任务一：物品与背包系统（P0，核心刚需）

### 1.1 定义物品类型体系

在 `src/core/data/` 下新建 `ItemDefs.ts`：

```typescript
// 物品大类
type ItemCategory = 'food' | 'drink' | 'medicine' | 'tool' | 'clothing' | 'material' | 'luxury' | 'book' | 'weapon' | 'gift';

// 物品稀有度
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

interface ItemDef {
  id: string;            // 唯一ID，如 "mantou", "herb_medicine"
  name: string;          // 显示名，如 "馒头", "草药"
  category: ItemCategory;
  rarity: ItemRarity;
  description: string;   // 一句话描述
  basePrice: number;     // 基础价格（文钱）
  effects: {
    hunger?: number;     // 饱食度变化
    fatigue?: number;    // 精力变化
    health?: number;     // 健康变化
    mood?: number;       // 心情变化
  };
  stackable: boolean;    // 是否可堆叠
  maxStack: number;      // 最大堆叠数
  usable: boolean;       // 是否可以直接使用
  useNarrative?: string; // 使用时的叙事文本模板
}
```

### 1.2 定义至少40种物品

覆盖以下类别，每个类别至少4种：

**食物(food)** — 8种
- 馒头(5文, +15饥饿)、烧饼(8文, +20饥饿)、包子(10文, +25饥饿, +2心情)
- 羊肉汤(35文, +40饥饿, +5心情)、面条(15文, +30饥饿)
- 炊饼(5文, +12饥饿)、糕点(20文, +15饥饿, +8心情)、粽子(12文, +22饥饿)

**饮品(drink)** — 4种
- 粗茶(3文, +5饥饿, +3疲劳)、好茶(15文, +3饥饿, +5疲劳, +5心情)
- 米酒(10文, +5心情, -5疲劳)、黄酒(25文, +8心情, -10疲劳)

**药品(medicine)** — 4种
- 草药(20文, +15健康)、金创药(50文, +30健康)
- 安神汤(30文, +20疲劳, +10心情)、人参(100文, +25健康, +15疲劳, +10心情)

**工具(tool)** — 4种
- 锄头(80文, 持有可种田)、鱼竿(60文, 持有可钓鱼)
- 毛笔(30文, 持有可写字/画画)、算盘(50文, 持有可当账房)

**衣物(clothing)** — 4种
- 粗麻衣(50文, +3心情)、棉布衫(150文, +5心情, 御寒)
- 绸缎袍(500文, +12心情, +社交加成)、旧棉袄(80文, 强力御寒)

**材料(material)** — 4种
- 麻布(30文)、棉线(15文)、木材(20文)、铁矿石(40文)

**奢侈品(luxury)** — 4种
- 苏绣手帕(200文, +15心情, 礼物佳品)、玉佩(800文, +20心情, 稀有)
- 古琴(500文, +10心情)、名画(600文, +10心情)

**书籍(book)** — 4种
- 三字经(20文, 可学基础)、论语(80文, 可学进阶)
- 算经(50文)、医书(100文)

**礼物(gift)** — 4种
- 花束(10文, +关系)、点心盒(25文, +关系)、胭脂(60文, +关系大幅)、定情信物(200文, +关系大量)

### 1.3 背包组件与系统

在 ECS 类型中添加：

```typescript
// src/core/ecs/types.ts 新增
export interface InventoryComponent {
  items: InventorySlot[];
  capacity: number;  // 最大格子数，默认20
}

export interface InventorySlot {
  itemId: string;
  count: number;
}
```

在 WorldEngine 中：
- 创建玩家时添加 InventoryComponent（初始背包容量20）
- 添加 `addItem(itemId, count)` / `removeItem(itemId, count)` / `hasItem(itemId)` / `useItem(itemId)` 方法
- `useItem` 应用物品效果到玩家属性，返回叙事文本
- 添加 `getInventory()` 获取背包内容

### 1.4 背包UI

在 `src/components/game/` 下新建 `InventoryPanel.vue`：
- 网格布局显示物品图标（用emoji代替图标资源）
- 每个格子显示物品名 + 数量
- 点击可使用物品（如果usable）
- 背包满时提示

---

## 任务二：店铺交易系统（P0，核心刚需）

### 2.1 店铺定义

在 `src/core/data/` 下新建 `ShopDefs.ts`：

```typescript
interface ShopDef {
  id: string;
  name: string;           // 店铺名
  locationId: string;     // 所在地点
  sellItems: string[];    // 出售的物品ID列表
  buyCategories: ItemCategory[];  // 收购的物品类别
  buyPriceMultiplier: number;  // 收购价倍率（0.4-0.7）
  sellPriceMultiplier: number; // 出售价倍率（0.8-1.2，受季节影响）
  shopkeeperNpcProfession: string; // 对应掌柜的职业
}
```

定义至少6家店铺：

| 店铺 | 地点 | 出售物品 | 收购物品类 |
|------|------|---------|-----------|
| 刘家面馆 | street | 面条、羊肉汤、包子、烧饼 | food |
| 赵记茶楼 | tea_house | 粗茶、好茶、糕点、米酒 | drink, food |
| 回春堂 | clinic | 草药、金创药、安神汤、人参 | material, medicine |
| 王记杂货 | market | 锄头、鱼竿、毛笔、算盘、麻布、棉线 | tool, material |
| 锦绣坊 | cloth_shop | 粗麻衣、棉布衫、绸缎袍、旧棉袄、苏绣手帕 | clothing, luxury |
| 文萃轩 | bookshop | 三字经、论语、算经、医书、花束、点心盒 | book |

### 2.2 交易逻辑

在 WorldEngine 中添加：

```typescript
// 购买物品
buyItem(shopId: string, itemId: string): { success: boolean; message: string }

// 出售物品
sellItem(itemId: string): { success: boolean; message: string }

// 获取店铺信息
getShopInfo(shopId: string): ShopInfo | null

// 获取当前地点的店铺
getShopsAtLocation(locationId: string): ShopDef[]
```

购买逻辑：
1. 检查店铺是否存在且在当前地点
2. 检查物品是否在该店铺出售
3. 计算价格（basePrice × sellPriceMultiplier × 季节系数）
4. 检查玩家铜钱是否足够
5. 扣除铜钱，添加到背包
6. 返回叙事文本（如 "你花了35文买了一碗羊肉汤，热气腾腾的..."）

出售逻辑：
1. 检查背包中是否有该物品
2. 检查是否有店铺收购该类别
3. 计算收购价（basePrice × buyPriceMultiplier）
4. 从背包移除，增加铜钱
5. 返回叙事文本

### 2.3 交易UI

新建 `ShopPanel.vue`：
- 左右两栏：左边店铺商品列表（名称+价格），右边玩家背包
- 购买/出售按钮
- 铜钱余额显示
- 买不起的物品显示灰色

---

## 任务三：行动系统丰富化（P1）

### 3.1 扩展 ActionRegistry

当前行动系统已有基础框架，需要大幅扩展行动数量和叙事质量。

在 `src/core/ai/ActionRegistry.ts` 中添加至少20个新行动：

**工作类（赚钱）：**
- `work_porter` — 码头搬运（体力活，+15文，-20疲劳，需在码头）
- `work_woodcut` — 砍柴（需有斧头，+20文，-25疲劳）
- `work_fishing` — 钓鱼（需有鱼竿，产出鱼，受天气影响）
- `work_farming` — 种田（需有锄头，耗时2AP，产出粮食）
- `work_scribe` — 代写书信（需有毛笔，+25文，需在茶馆/街边）
- `work_hawker` — 摆摊叫卖（需有可卖物品，收入随机）

**生活类（维持生存）：**
- `eat_street_food` — 在路边吃小食（花费5-15文，恢复饥饿）
- `eat_restaurant` — 下馆子（花费50-200文，恢复饥饿+心情）
- `drink_tea` — 喝茶（花费3-15文，恢复少量疲劳+心情）
- `rest_inn` — 住客栈（花费30文，大量恢复疲劳）
- `rest_street` — 露宿街头（免费，少量恢复疲劳，健康-5）
- `visit_doctor` — 看大夫（花费20-100文，恢复健康）

**社交类：**
- `buy_drink_for_npc` — 请NPC喝酒（花费10文，+关系）
- `give_gift` — 送礼（消耗背包中的gift类物品，+关系）
- `play_chess` — 下棋（需在茶馆，+心情，有机会+关系）
- `listen_story` — 听书（需在瓦舍，+心情，获取传闻）

**学习类：**
- `study_book` — 读书（需背包有书，+随机技能经验）
- `practice_calligraphy` — 练字（需有毛笔，+文化相关）
- `learn_trade` — 学手艺（需找到对应NPC，消耗AP+铜钱）

### 3.2 每个行动的叙事文本

每个行动至少3种叙事变体，根据天气/时间/心情随机选择：

以 `eat_street_food` 为例：
- 变体A（晴天）："你在路边摊坐下，要了一份炊饼。阳光照在身上暖洋洋的，炊饼刚出炉，外酥里嫩。"
- 变体B（雨天）："你冒雨走到一个遮雨棚下，买了一碗热气腾腾的面条。虽然简陋，但雨天里吃碗热面格外舒坦。"
- 变体C（冬天）："寒风中，你裹紧衣服走向路边摊，一碗羊肉汤下肚，从胃里暖到心里。"

---

## 任务四：地点描述丰富化（P1）

### 4.1 扩展 LocationDefs

在 `src/core/data/LocationDefs.ts` 中为每个地点添加丰富的描述：

```typescript
interface LocationDef {
  id: string;
  name: string;
  description: string;           // 基础描述
  descriptions: {                 // 根据天气/时间的变体描述
    morning?: string;
    afternoon?: string;
    evening?: string;
    night?: string;
    rainy?: string;
    snowy?: string;
  };
  atmosphere: string;             // 氛围词
  connections: string[];
  // 新增
  availableActions: string[];     // 该地点可执行的行动ID
  ambientSounds?: string;         // 环境音描述
  npcsOftenHere?: string[];       // 常驻NPC职业
}
```

为所有现有地点（street, tea_house, market, dock, inn, clinic, bookshop, cloth_shop, temple, countryside）添加：
- 四时段描述（晨/午/昏/夜）
- 天气变体（雨/雪）
- 氛围描写

每个地点至少6条不同描述文本。

---

## 任务五：日终结算丰富化（P2）

### 5.1 增强 DaySummary

当前的 DaySummary 组件需要展示更丰富的信息：

- 当日收支明细（赚了多少、花了多少、结余）
- 当日重要事件回顾（最多5条）
- NPC动态摘要（同地点NPC的今日动向）
- 身体状态提示（如果饥饿低，提示"肚子咕咕叫"）
- 次日天气预报

### 5.2 夜间随机事件

在 `advanceDay()` 中增加夜间事件触发：
- 30%概率触发夜间事件
- 夜间事件池（至少10种）：被偷、做好梦、偶遇夜归NPC、听到更夫报时、发现路边遗物等

---

## 技术约束

1. 所有代码注释和文本用中文
2. 保持现有 TypeScript 类型风格
3. 不破坏现有调用链和接口
4. 最终必须通过 `npx vue-tsc --noEmit` 编译检查
5. 新文件放置在合理的目录结构中
6. emoji 作为物品图标（🍚🫖💊🔧👕📚🎁 等）

## 文件修改范围

**新建文件：**
1. `src/core/data/ItemDefs.ts` — 物品定义
2. `src/core/data/ShopDefs.ts` — 店铺定义
3. `src/components/game/InventoryPanel.vue` — 背包UI
4. `src/components/game/ShopPanel.vue` — 交易UI

**修改文件：**
5. `src/core/ecs/types.ts` — 添加 InventoryComponent
6. `src/core/world/WorldEngine.ts` — 添加背包/交易/行动方法
7. `src/core/ai/ActionRegistry.ts` — 扩展行动列表
8. `src/core/data/LocationDefs.ts` — 丰富地点描述
9. `src/stores/gameStore.ts` — 适配新系统
10. `src/App.vue` — 集成新UI面板
11. `src/components/game/DaySummary.vue` — 增强结算信息

开始实现吧！优先保证功能正确和编译通过。物品定义和叙事文本要丰富有质感，体现宋朝市井氛围。

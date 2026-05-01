# 丰富性开发任务二 — 地点描述 + 日终结算 + 存档集成 + gameStore完善

## 背景
上一轮已完成了物品/背包系统、店铺交易系统、行动丰富化。本轮继续完善游戏体验闭环。

---

## 任务一：地点描述丰富化（P0）

### 1.1 改造 LocationDefs 接口

在 `src/core/data/LocationDefs.ts` 中：

```typescript
export interface LocationDef {
  id: string;
  name: string;
  description: string;
  connections: string[];
  // 新增
  descriptions: {
    morning?: string;    // 清晨
    afternoon?: string;  // 午后
    evening?: string;    // 黄昏
    night?: string;      // 夜晚
    rainy?: string;      // 雨天
    snowy?: string;      // 雪天
    spring?: string;     // 春
    summer?: string;     // 夏
    autumn?: string;     // 秋
    winter?: string;     // 冬
  };
  atmosphere: string;    // 氛围词（1-2字）
  ambientDetail?: string; // 环境细节描述
  availableShops?: string[]; // 该地点的店铺ID
}
```

### 1.2 为现有18个地点全部丰富描述

每个地点至少写5条变体描述（时段+天气+季节），体现宋朝汴京的市井氛围。

示例 — 大街(street)：
- morning: "晨光初照，大街上已经有早起的商贩在支摊。几个挑夫挑着担子匆匆而过，空气中弥漫着豆浆和油条的香气。"
- afternoon: "午后的阳光洒在青石板路上，大街上人来人往，热闹非凡。卖花的姑娘在街角叫卖，远处传来瓦舍说书先生的声音。"
- evening: "夕阳西斜，大街上的人渐渐少了。铺子开始收摊，灯笼一盏盏亮起来。更夫敲着梆子走过，提醒人们该回家了。"
- night: "夜深了，大街上几乎无人。月光洒在空旷的青石板上，只有几条野狗在街角游荡。远处传来更夫的报时声。"
- rainy: "细雨蒙蒙，大街上的行人撑着油纸伞匆匆而过。雨水顺着屋檐滴落，在青石板上溅起细碎的水花。"
- snowy: "大雪纷飞，大街上一片银白。几个孩童在路边堆雪人，远处的屋顶上积了厚厚的雪。"
- spring: "春日暖阳下，大街两旁的柳树抽出新芽。卖花担子上的桃花杏花开得正艳，空气中满是花香。"
- summer: "盛夏酷暑，大街上热浪滚滚。卖冰饮的小摊前排着长队，人们摇着蒲扇匆匆走在阴凉处。"
- autumn: "秋风送爽，大街上飘着桂花的香味。卖糖炒栗子的小贩吆喝着，金黄的落叶铺了一地。"
- winter: "寒冬腊月，大街上冷冷清清。偶尔有几个裹着棉衣的行人匆匆走过，呵出的白气瞬间消散。"

对所有18个地点（street, market, teahouse, clinic, dock, farmland, residential, mountain, workshop, temple, academy, riverside, gambling_den, brothel, government_office, ruins, inn, bookshop）都要写出类似质量的描述。

### 1.3 提供获取动态描述的方法

```typescript
export function getLocationDescription(
  locationId: string, 
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night',
  weather: string,
  season: string
): string
```
优先级：天气 > 时段 > 季节 > 基础描述

---

## 任务二：日终结算丰富化（P0）

### 2.1 增强 DayResult 接口

在 `src/core/world/WorldEngine.ts` 的 DayResult 中添加：

```typescript
export interface DayResult {
  // ... 现有字段 ...
  // 新增
  dailyIncome: number;       // 当日收入
  dailyExpense: number;      // 当日支出
  transactions: string[];    // 交易记录（如 "购买羊肉汤 -35文"）
  nightEvent: string | null; // 夜间随机事件
  nextDayWeather: string;    // 次日天气预报
  healthWarnings: string[];  // 健康警告（如 "肚子咕咕叫"）
}
```

### 2.2 在 WorldEngine 中追踪收支

- 添加 `dailyIncome` 和 `dailyExpense` 计数器
- 在 `buyItem()` 中记录支出
- 在 `sellItem()` 和工作行动中记录收入
- 在 `advanceDay()` 时汇总并重置

### 2.3 夜间随机事件

在 `advanceDay()` 中添加夜间事件（30%概率触发）：

定义至少15种夜间事件，分3种类型：

**正面事件（30%）：**
1. 做了一个好梦 — 心情+5
2. 月色很美，睡得格外香甜 — 疲劳+10
3. 邻居送来一碗热汤 — 饥饿+10，心情+3
4. 梦见了家乡 — 心情+8
5. 半夜听到更夫的吆喝，觉得安心 — 心情+3

**中性事件（40%）：**
6. 听到远处传来犬吠声 — 无效果
7. 半夜醒来听到雨声 — 无效果
8. 梦到了白天的琐事 — 无效果
9. 更夫路过报时："天干物燥，小心火烛" — 无效果
10. 风吹窗户响了一下 — 无效果

**负面事件（30%）：**
11. 被蚊子吵醒 — 疲劳-5，心情-3
12. 做了噩梦 — 心情-5
13. 肚子饿了睡不着 — 饥饿-10
14. 夜里着了凉 — 健康-5
15. 被老鼠吵醒 — 心情-3

每个事件有叙事文本（50-100字）。

### 2.4 健康警告

根据玩家状态生成警告文本：
- 饥饿 < 30: "肚子咕咕叫，该找点吃的了"
- 饥饿 < 15: "饿得头昏眼花，再不吃东西要出人命了"
- 疲劳 < 30: "疲惫不堪，需要休息"
- 疲劳 < 15: "累得几乎站不住了"
- 健康 < 30: "身体不适，该去看看大夫"
- 健康 < 15: "病得很重，随时可能倒下"
- 心情 < 20: "郁郁寡欢，做什么都提不起劲"
- 铜钱 < 10: "囊中羞涩，该想办法赚点钱了"

### 2.5 增强 DaySummary.vue

在现有组件基础上增加：
- 收支明细区（今日赚了多少/花了多少）
- 夜间事件叙事（有动画展示）
- 健康警告提示（红色闪烁）
- 次日天气预报

---

## 任务三：gameStore 完善（P0）

### 3.1 gameStore 增加背包和交易状态管理

在 `src/stores/gameStore.ts` 中添加：

```typescript
// 新增状态
const showInventory = ref(false);
const showShop = ref<string | null>(null); // 打开的店铺ID
const transactionLog = ref<string[]>([]); // 交易日志
```

添加方法：
- `toggleInventory()` — 切换背包显示
- `openShop(shopId: string)` — 打开店铺
- `closeShop()` — 关闭店铺
- `addTransaction(text: string)` — 记录交易

### 3.2 GameState 扩展

在 GameState 类型中添加：
```typescript
export type GameState = 'menu' | 'creating' | 'playing' | 'event' | 'interacting' | 'daySummary' | 'dead' | 'shopping' | 'inventory';
```

### 3.3 在 App.vue 中正确集成

确保游戏主界面中：
- 背包按钮始终可见（底部工具栏）
- 当前地点有店铺时显示"逛街"按钮
- 打开面板时不影响游戏状态
- 使用 CSS 过渡动画（滑入/淡入）

---

## 任务四：主界面底部工具栏（P1）

### 4.1 在 App.vue 或新建 GameToolbar.vue

底部工具栏包含以下按钮：

| 按钮 | 功能 | 条件 |
|------|------|------|
| 🎒 背包 | 打开背包面板 | 始终可见 |
| 🏪 逛街 | 打开当前地点店铺 | 当前地点有店铺 |
| 👥 人际 | 打开关系面板 | 始终可见 |
| 📜 日志 | 查看行动日志 | 始终可见 |
| ⚙️ 系统 | 存档/读档/设置 | 始终可见 |

每个按钮有 tooltip 和点击动画效果。

---

## 技术约束

1. 所有代码注释和文本用中文
2. 保持现有 TypeScript 类型风格
3. 不破坏现有调用链和接口
4. 最终必须通过 `npx vue-tsc --noEmit` 编译检查
5. 叙事文本要有质感，体现宋朝市井氛围

## 文件修改范围

**主要修改：**
1. `src/core/data/LocationDefs.ts` — 丰富所有18个地点描述
2. `src/core/world/WorldEngine.ts` — 日终结算增强（收支追踪、夜间事件、健康警告）
3. `src/components/game/DaySummary.vue` — 结算UI增强
4. `src/stores/gameStore.ts` — 背包/交易状态管理
5. `src/App.vue` — 底部工具栏、面板集成

开始实现！优先完成任务一（地点描述）和任务二（日终结算），确保编译通过。

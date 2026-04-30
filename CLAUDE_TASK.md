# NPC交互系统重构任务

## 问题诊断

当前NPC交互系统有3大核心问题：

### 问题1：交互选项太重复
- `createTemplates()` 定义了25个固定模板，对所有NPC都一样
- 选项只是条件过滤+按depth排序后`slice(0,5)`硬截断
- 没有根据以下因素动态调整选项：
  - NPC职业（铁匠应该有"打造兵器"选项，郎中应该有"问诊"）
  - NPC性格（暴躁NPC应该有"激将法"，阴沉NPC应该有"套话"）
  - 当前地点（茶馆有"拼桌喝酒"，市集有"讨价还价"）
  - 天气季节（雨天有"共伞"，冬天有"送暖"）
  - 玩家出身（武馆弟子可以"切磋武艺"，画院画工可以"赏画论道"）
  - 双方状态（NPC心情差时出现"安慰"，玩家有钱时出现"请客"）
  - 历史互动（之前送过礼的NPC出现"回礼"，打过架的出现"和解"）

### 问题2：点击行为后演出太单薄
- BriefConsequence 只有1-2句叙事文字，没有演出感
- SceneConsequence 稍好但也很简单（最多1段叙事+1段舞台指示）
- 完全没有利用已有的 SceneLibrary（356个场景事件，10个类别，42个交互模板）
- 缺少多阶段演出：选择→过渡动画→NPC反应→结果展示→后续影响

### 问题3：NPC反应太机械
- NpcReactions 的 reactionMap 是固定的 switch-case
- 同一个 actionType 永远返回相同的反应模式
- 没有考虑：时间变化、地点氛围、最近发生的事件、NPC当前状态

## 重构要求

### 一、动态选项筛选系统（重写 NpcInteractionEngine.ts 的选项生成）

#### 1.1 新增 ActionRegistry 联动
从 `src/core/ai/ActionRegistry.ts` 读取已定义的行动列表，将行动映射为交互选项。
每个行动应有：
- `interactionText`: 在UI上显示的文字（可带动态变量）
- `relevanceScore(ctx) => number`: 根据上下文计算相关度0-100
- `category`: 分类标签

#### 1.2 多维度动态评分
为每个候选选项计算综合得分：
```
score = baseWeight * 
        locationMatch *      // 地点加成 (0.5-2.0)
        personalityMatch *   // 性格契合度 (0.5-2.0)
        relationBonus *      // 关系加成 (-10 ~ +20)
        seasonWeather *      // 季节天气 (0.8-1.5)
        originSynergy *      // 出身协同 (0-15)
        historyBonus *       // 历史互动 (0-10)
        freshnessPenalty *   // 重复惩罚 (本次对话中用过的选项降权)
```

#### 1.3 上下文感知选项生成器
新增函数 `generateDynamicOptions(ctx: InteractionContext, usedOptionIds: Set<string>): InteractionOption[]`
- 从 ActionRegistry + 特殊场景 + 上下文衍生选项 中筛选
- 每次返回 top-6 个最高分选项（而非固定模板）
- 保证至少1个 brief、1个 scene/drama 级别选项
- 根据上下文动态生成选项文案，例如：
  - 对铁匠 → "请他打一把短刀" / "向他请教淬火之法"
  - 对郎中 → "询问调理身体之道" / "求一副方子"
  - 雨天对好友 → "邀她共撑一把伞"
  - 春天对暧昧对象 → "约她去汴河踏青"
  - 对欠你人情的人 → "提起上次的事"

#### 1.4 上下文衍生选项池
新增至少40个上下文敏感的特殊选项，覆盖：

**职业专属（每个职业1-2个）：**
- 铁匠: 打造/修理/请教冶铁
- 郎中: 问诊/求药/讨论医理
- 商贩: 讨价还价/打听货源/合伙提议
- 掌柜: 赊账/打听行情/请求引荐
- 茶馆老板: 拼座/打听消息/询问常客
- 农夫: 询问收成/帮忙干活/借农具
- 渔夫: 买鱼/询问水情/约渔
- 猎户: 询问山情/求购皮毛/结伴入山
- 书生: 论诗/借书/请教典故
- 武师: 切磋/请教招式/比试轻功
- 伶人: 听曲/捧场/后台探访
- 画工: 求画/赏画/学笔法
- 和尚: 请教佛法/化缘/倾诉烦恼
- 乞丐: 打听街巷消息/施舍/询问底细

**天气季节衍生（8-10个）：**
- 雨: 共伞/避雨闲聊/雨中送行
- 雪: 送暖衣/围炉夜话/雪中送炭
- 春: 踏青/放灯/花下饮酒
- 夏: 纳凉/吃瓜/荷塘月色
- 秋: 赏月/登高/菊花酒
- 冬: 温酒/烤火/岁末问候

**关系阶段衍生（8-10个）：**
- 初识(0-10): 自报家门/询问来历/试探性搭话
- 熟悉(11-30): 吐槽日常/分享趣事/小忙
- 好友(31-50): 吐露心事/借钱周转/托付之事
- 至交(51+): 结拜/托孤/生死之交的话题

**状态触发衍生（6-8个）：**
- NPC心情极差(<20): 安慰/询问原因/陪伴
- NPC健康极差(<30): 关切/送药/探望
- NPC贫穷(<20铜钱): 接济/介绍活计/施舍
- 玩家富有(>100铜钱): 请客/送礼/打赏
- 玩家健康很差(<30): 请求照顾/求助/倚靠
- 双方都在茶馆: 拼桌/斗酒/行令

### 二、丰富演出系统（重构 BriefConsequences.ts）

#### 2.1 多阶段演出结构
每次点击选项后，演出应包含多个阶段：

```typescript
interface RichPerformance {
  /** 阶段1: 行动描述（玩家做了什么） */
  actionNarrative: string;
  
  /** 阶段2: 过渡/环境描写（舞台指示） */
  stageDirection?: string;
  
  /** 阶段3: NPC反应（表情/动作/台词） */
  npcResponse?: {
    expression: string;    // 如"微微一愣"/"眼睛一亮"/"皱起眉头"
    gesture: string;       // 如"端起茶杯抿了一口"/"后退半步"/"凑近"
    dialogue: string;      // NPC说的话
    innerThought?: string; // 可选：NPC内心独白
  };
  
  /** 阶段4: 氛围描写（环境/旁观者反应） */
  atmosphere?: string;     // 如"周围人投来好奇的目光"/"茶馆里顿时安静下来"
  
  /** 阶段5: 后续钩子（引发下一步的可能性） */
  followUpHint?: string;   // 如"她似乎还有话要说..."/"这件事似乎没那么简单"
}
```

#### 2.2 每个行动类型至少3个变体
每个 templateId 不再只有1个 narrative 工厂，而是根据上下文选择不同变体：

以"闲聊(chat)"为例，需要至少6种变体：
- **变体A-天气话题**: 根据实际天气生成不同聊天内容
- **变体B-职业话题**: 聊对方职业相关的事
- **变体C-八卦消息**: 聊最近的传闻（从narrativeTags中取材）
- **变体D-回忆往事**: 高好感时聊过去的共同经历
- **变体E-吐槽抱怨**: 双方心情都不好时的吐槽局
- **变体F-规划未来**: 高好感+好心情时聊未来的打算

每种变体都要有不同的：
- 叙事段落（80-150字，不是一句话）
- 舞台指示（环境/动作描写）
- NPC反应（因性格而异）

#### 2.3 重点扩展现有行动的演出质量
对以下高频行动做重点扩展（每个至少200字叙事+舞台指示+NPC反应）：

**brief级（轻量但有质感）：**
- chat: 6个变体，每个80-120字
- compliment: 4个变体（针对外貌/技艺/人品/成就）
- flirt: 5个变体（暗示/明示/肢体语言/诗词/幽默）
- mock: 4个变体（善意/恶意/自嘲/互相）
- comfort: 4个变体（倾听/建议/陪伴/实际行动）
- rumor: 3个变体（确凿消息/模糊传闻/阴谋论）

**scene级（中等演出）：**
- gift: 5个变体（贵重/实用/用心/意外/回礼）
- invite_tea: 4个变体（茶楼/路边摊/家中/夜茶）
- ask_info: 6个变体（商情/人事/江湖/官府/奇闻/秘密）
- learn: 4个变体（基础入门/进阶技巧/行业秘辛/实战演示）
- provoke: 4个变体（言语/行动/借刀杀人/当众羞辱）
- threaten: 3个变体（软威胁/硬威胁/利益交换式威胁）
- apologize: 4个变体（真诚/勉强/用行动表示/第三方调解）
- bet: 4个变体（猜谜/比试/赌运气/赌见识）
- compete: 5个变体（文斗/武斗/技艺/智谋/酒量）
- ask_help: 4个变体（出力/出钱/出关系/出主意）
- request_favor: 4个变体

**drama级（重磅演出）：**
- confess: 4个变体（直接/含蓄/意外/被拒后的坚持）
- recruit: 3个变体
- conspire: 3个变体
- blood_oath: 2个变体
- rescue_from_danger: 3个变体

### 三、NPC反应系统升级（重构 NpcReactions.ts）

#### 3.1 多层反应机制
不再使用简单的 reactionMap[actionType]()，改为：

```typescript
function generateRichReaction(
  ctx: InteractionContext,
  actionType: string,
  outcome: 'success' | 'mixed' | 'fail',
  performance: RichPerformance
): NpcFullReaction {
  // Layer 1: 性格基础反应（决定基调）
  // Layer 2: 关系修正（熟人更放松，陌生人更警惕）
  // Layer 3: 状态叠加（心情差时更容易生气/难过）
  // Layer 4: 历史记忆（如果之前被欺骗过，反应会不同）
  // Layer 5: 随机扰动（避免完全 deterministic）
}
```

#### 3.2 反应要包含丰富的非语言信息
每个反应应包含：
- 微表情描写（嘴角抽动/眼神闪烁/脸色变化）
- 肢体语言（手指敲击/身体前倾后仰/转身/靠近/退开）
- 语气描写（压低声音/提高音量/停顿/语速变化）
- 环境互动（放下手中活计/端起杯子/推开门窗）

### 四、UI适配（更新 NpcInteractionOverlay.vue）

#### 4.1 分阶段展示演出
点击选项后不要一次性显示所有内容，而是：
1. 先显示行动叙述（淡入动画，500ms）
2. 再显示舞台指示（斜体，棕色，300ms后淡入）
3. 再显示NPC反应（带表情颜色，300ms后淡入）
4. 最后显示数值变化和后续选项（200ms后淡入）

可以用 CSS animation 或 Vue transition 实现。

#### 4.2 选项按钮增强
- 显示选项的相关度评分（用星星或颜色深浅表示）
- 动态选项文案（显示具体内容而非固定名称）
- 条件不满足的选项显示灰色+原因提示（tooltip或副标题）
- drama级别选项加特殊边框动画（脉冲效果）

## 技术约束

1. 所有代码注释用中文
2. 保持现有 TypeScript 类型风格
3. InteractionConsequence 接口可以扩展但不能破坏现有调用链
4. interactionStore.ts 的 resolveOption 逻辑可能需要小幅适配
5. 保持向后兼容：WorldEngine 中调用 startNpcInteraction / resolveInteractionOption 的地方不能改接口签名
6. 最终必须通过 `npx vue-tsc --noEmit` 编译检查
7. _rng 参数这次要真正用起来（用于随机变体选择和扰动）

## 文件修改范围

主要修改：
1. `src/core/ai/NpcInteractionEngine.ts` — 重写选项生成逻辑
2. `src/core/ai/NpcReactions.ts` — 重写反应系统
3. `src/core/ai/BriefConsequences.ts` — 扩展为 RichPerformance 系统
4. `src/components/game/NpcInteractionOverlay.vue` — UI分阶段演出
5. `src/stores/interactionStore.ts` — 适配新的数据结构

可选修改：
6. `src/core/ai/SceneLibrary/types.ts` — 如果需要新类型
7. `src/core/ai/ActionRegistry.ts` — 如果需要添加 interactionMetadata 字段

开始实现吧！优先保证功能正确和编译通过，UI动画可以简化。" --allowedTools "Read,Edit,Write,Bash" --max-turns 40' Enter
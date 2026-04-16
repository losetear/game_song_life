// === L0 多步演出 — 冲突 (Multistep Conflict) ===
//
// 多步演出：从口角到动手，NPC自动根据性格选择走向，每 tick 推进一个阶段。

import type { L0PhaseScene } from '../../../ai/sceneLibrary/types';

export const MULTISTEP_CONFLICT_SCENES: L0PhaseScene[] = [
  // ══════════════════════════════════════════════════════════════════
  // 街头斗殴升级 — Street Brawl Escalation
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'ms_street_brawl',
    name: '街头口角',
    description: '两个NPC在街头发生口角，从言语冲突可能升级为肢体冲突',
    isMultiStep: true,
    goalCategory: 'conflict',
    outcomeType: 'contested',
    conditions: {
      actorTraits: [],
      actorForbiddenTraits: [],
      targetRequired: true,
      location: ['east_market', 'west_market', 'south_street', 'north_street', 'center_street'],
      minNearbyNpcs: 2,
    },
    success: { narrative: '', effects: {} }, // 多步演出不用这个
    weight: 5,
    cooldownTicks: 20,
    priority: 4,
    tags: ['conflict', 'street', 'escalation'],
    openingNarrative: '{npcName}与{targetName}在街上撞了个满怀。货物散落一地，两人互不相让，争吵声渐渐大了起来。',
    entryPhase: 'brawl_1',
    phases: {
      // ── 第一阶段：口角 ──
      brawl_1: {
        phaseId: 'brawl_1',
        phaseType: 'dialogue',
        narrative: '「你瞎了眼不成！看看我的货物！」{npcName}怒道。\n{targetName}也不甘示弱：「明明是你撞的我，还想赖账？」\n周围的人开始驻足围观。两个卖力气的脚夫在旁边看热闹，不肯走开。',
        choices: [
          {
            id: 'argue_loud',
            text: '提高嗓门，寸步不让',
            chooser: 'actor',
            consequence: { nextPhase: 'brawl_2a' },
          },
          {
            id: 'insult',
            text: '骂了一句难听的',
            chooser: 'actor',
            consequence: {
              immediateEffects: { mood: -3, social: -2 },
              nextPhase: 'brawl_2a',
            },
          },
          {
            id: 'try_calm',
            text: '深吸一口气，试着说理',
            chooser: 'actor',
            condition: { field: 'personality', operator: 'includes', value: '温和' },
            consequence: { nextPhase: 'brawl_2b' },
          },
        ],
      },

      // ── 第二阶段A：冲突升级 ──
      brawl_2a: {
        phaseId: 'brawl_2a',
        phaseType: 'contested',
        narrative: '两人越吵越凶，推搡起来。{npcName}一把揪住{targetName}的衣领，{targetName}也伸手去推。\n围观的人越来越多，有人在喊"别打了"，有人在起哄。',
        choices: [
          {
            id: 'throw_punch',
            text: '忍不了了，先动手再说',
            chooser: 'actor',
            condition: { field: 'personality', operator: 'includes', value: '暴躁' },
            consequence: {
              resolution: {
                type: 'contested',
                contestedStat: { actor: 'strength', target: 'strength' },
              },
              tieredResults: {
                critical_success: {
                  narrative: '{npcName}一拳正中{targetName}面门！对方踉跄后退，捂着鼻子蹲了下去。围观的人群发出一阵惊呼。',
                  effects: { mood: 5, health: -3, social: -5 },
                },
                success: {
                  narrative: '{npcName}率先出拳，打中了{targetName}的肩膀。对方也推了一把，两人扭打在一起。',
                  effects: { mood: 2, health: -8, social: -3 },
                },
                failure: {
                  narrative: '{npcName}出拳被{targetName}闪开了！反被一把推倒在地。围观的人发出一阵哄笑。',
                  effects: { mood: -10, health: -12, social: -8 },
                },
              },
              nextPhase: 'brawl_3a',
            },
          },
          {
            id: 'push_shove',
            text: '用力推对方一把',
            chooser: 'actor',
            consequence: {
              resolution: {
                type: 'contested',
                contestedStat: { actor: 'strength', target: 'strength' },
              },
              tieredResults: {
                success: {
                  narrative: '{npcName}猛地一推，{targetName}后退了好几步撞在了墙上。围观的人纷纷让开。',
                  effects: { mood: 3, health: -2, social: -3 },
                },
                failure: {
                  narrative: '{npcName}推了一下没推动，反被{targetName}扣住了手腕。两人僵持着。',
                  effects: { mood: -5, health: -5, social: -2 },
                },
              },
              nextPhase: 'brawl_3a',
            },
          },
          {
            id: 'back_down',
            text: '突然意识到打起来不划算，退一步',
            chooser: 'actor',
            consequence: {
              immediateEffects: { mood: -5, social: -3 },
              nextPhase: 'brawl_3b',
            },
          },
        ],
      },

      // ── 第二阶段B：缓和 ──
      brawl_2b: {
        phaseId: 'brawl_2b',
        phaseType: 'dialogue',
        narrative: '{npcName}压住火气说：「算了算了，都是出来讨生活的，何必呢？」\n{targetName}犹豫了一下，周围的街坊也劝了起来：「就是，有什么话好好说。」',
        choices: [
          {
            id: 'settle_peace',
            text: '主动提出各退一步',
            chooser: 'actor',
            consequence: {
              immediateEffects: { mood: 5, social: 5 },
              relationChange: 5,
              nextPhase: null,
              endingNarrative: '{npcName}把散落的货物捡起来分了分，两人各拿各的。虽然心里还有些不痛快，但总算没闹大。\n围观的街坊们散了，有人小声说："这人还挺讲道理的。"',
            },
          },
          {
            id: 'demand_apology',
            text: '要求对方先道歉',
            chooser: 'actor',
            consequence: {
              resolution: { type: 'chance', successChance: 50 },
              tieredResults: {
                success: {
                  narrative: '{targetName}看了看围观的人，哼了一声，别过头说了句"行了，算我不好。"事情就此了结。',
                  effects: { mood: 8, social: 3 },
                },
                failure: {
                  narrative: '{targetName}梗着脖子不肯服软：「凭什么我先道歉？」眼看又要吵起来，巡街的甲士刚好经过，两人只得各走各的。',
                  effects: { mood: -3, social: -2 },
                },
              },
              nextPhase: null,
            },
          },
        ],
      },

      // ── 第三阶段A：打完了 ──
      brawl_3a: {
        phaseId: 'brawl_3a',
        phaseType: 'reaction',
        narrative: '闹出的动静引来了巡街甲士。两个穿着皂衣的差役挤进人群：「干什么呢！都住手！」\n围观的人一哄而散。',
        choices: [
          {
            id: 'flee_guard',
            text: '趁乱溜走',
            chooser: 'actor',
            consequence: {
              immediateEffects: { mood: -3, social: -5 },
              relationChange: -8,
              nextPhase: null,
              endingNarrative: '{npcName}趁甲士不注意，从人缝中钻了出去。一口气跑了两条街才停下来，心跳还在加速。\n衣服上沾了灰，嘴角有点疼——不知道什么时候碰的。这事传出去可不好听。',
            },
          },
          {
            id: 'explain_guard',
            text: '留下来跟甲士说明情况',
            chooser: 'actor',
            consequence: {
              immediateEffects: { mood: -2, social: -2 },
              relationChange: -5,
              nextPhase: null,
              endingNarrative: '{npcName}如实跟甲士说了事情经过。甲士听完训了两人一顿：「下次再闹，都给我蹲大牢去！」\n两人各自被罚了五文铜钱的"和解费"。走的时候{targetName}恶狠狠地瞪了{npcName}一眼。这笔仇怕是结下了。',
            },
          },
        ],
      },

      // ── 第三阶段B：忍了 ──
      brawl_3b: {
        phaseId: 'brawl_3b',
        phaseType: 'narration',
        narrative: '{npcName}咬了咬牙，终于还是松开了手。\n「行，今天算我倒霉。」说着弯腰捡起自己的东西，头也不回地走了。\n身后传来{targetName}得意的笑声。{npcName}攥紧了拳头，指甲掐进了肉里。',
        choices: [
          {
            id: 'swallow_pride',
            text: '认了，回家消消气',
            chooser: 'actor',
            consequence: {
              immediateEffects: { mood: -8 },
              relationChange: -3,
              nextPhase: null,
              endingNarrative: '{npcName}低着头穿过人群，有人窃窃私语，有人摇头。走了好一阵子，怒气才慢慢消退，取而代之的是一种窝囊的感觉。\n今天这事，怕是记在心里了。',
            },
          },
        ],
      },
    },
  },
];

// === L0 精细场景 — 隐藏秘密 (Secrets) ===
// 新类别：基于隐藏特质的深层叙事

import { L0Scene } from '../../../ai/sceneLibrary/types';

const S = { actorTraits: [] as string[], actorForbiddenTraits: [] as string[], targetRequired: false };

export const SECRETS_SCENES: L0Scene[] = [
  {
    id: 'sec_greed_reveal', name: '贪婪显露', description: '隐藏的贪婪本性暴露',
    goalCategory: 'secrets', outcomeType: 'certain', weight: 2, cooldownTicks: 12,
    tags: ['secrets', 'greed', 'reveal'],
    conditions: { actorTraits: ['精明'], actorForbiddenTraits: [], actorMaxStress: 30, targetRequired: true, targetMinCopper: 30 },
    success: {
      narrative: '面前堆着金银，{npcName}的眼睛一下子直了。不由自主地伸手去摸，指尖在铜板上缓缓滑过。这一幕被{targetName}看在了眼里。',
      effects: { mood: 5, copper: 5 }, targetEffects: { mood: -3 }, relationChange: -5,
      memoryTag: '贪婪暴露', traitReveal: 'greed',
    },
  },
  {
    id: 'sec_honor_reveal', name: '义举', description: '隐藏的荣誉感驱使做出正义之事',
    goalCategory: 'secrets', outcomeType: 'certain', weight: 3, cooldownTicks: 10,
    tags: ['secrets', 'honor', 'reveal'],
    conditions: { actorTraits: [], actorForbiddenTraits: [], targetRequired: true, targetMinHealth: 30, targetRelationType: 'stranger' },
    success: {
      narrative: '{npcName}看见{targetName}倒在路边，几乎没有犹豫就冲了上去。旁人问起为什么，{npcName}愣了一下："看见了总不能不管。"',
      effects: { mood: 8, health: -3 }, targetEffects: { health: 10, mood: 10 }, relationChange: 15,
      memoryTag: '义举', traitReveal: 'honor',
    },
  },
  {
    id: 'sec_ambition_reveal', name: '野心流露', description: '不经意间透露出远大野心',
    goalCategory: 'secrets', outcomeType: 'certain', weight: 2, cooldownTicks: 12,
    tags: ['secrets', 'ambition', 'reveal'],
    conditions: { actorTraits: ['精明'], actorForbiddenTraits: [], targetRequired: true, targetRelationType: 'friend', minNearbyNpcs: 1 },
    success: {
      narrative: '酒过三巡，{npcName}忽然压低声音说了一句："你觉得……这个城，还可以怎么变？"眼睛里闪着一种平时看不到的光。{targetName}怔了一下。',
      effects: { mood: 3 }, targetEffects: { mood: -3 }, relationChange: -2,
      memoryTag: '野心暴露', traitReveal: 'ambition',
    },
  },
  {
    id: 'sec_loyalty_test', name: '忠诚考验', description: '面临利益与忠诚的抉择',
    goalCategory: 'secrets', outcomeType: 'contested', weight: 2, cooldownTicks: 15,
    contestedStat: { actor: 'loyalty', target: 'wallet' },
    tags: ['secrets', 'loyalty', 'dilemma'],
    conditions: { actorTraits: [], actorForbiddenTraits: [], actorMinCopper: 10, targetRequired: true, targetMinCopper: 50, targetDifferentFaction: true },
    success: {
      narrative: '{targetName}开了个价。{npcName}沉默了许久，最后摇了摇头。"有些东西，不卖。"转过身去，头也不回。',
      effects: { mood: 5, copper: -10 }, relationChange: 5,
      memoryTag: '忠诚考验', traitReveal: 'loyalty',
    },
    failure: {
      narrative: '{targetName}开了个价。{npcName}看着那袋铜钱，咽了口唾沫。"……成交。"接过来的一瞬间，手微微发抖。',
      effects: { copper: 20, mood: -10, safety: -5 }, relationChange: -10,
      memoryTag: '背叛',
    },
  },
  {
    id: 'sec_dark_past', name: '往事浮现', description: '不为人知的过去被提起',
    goalCategory: 'secrets', outcomeType: 'certain', weight: 1, cooldownTicks: 15,
    tags: ['secrets', 'past', 'emotional'],
    conditions: { actorTraits: [], actorForbiddenTraits: [], actorMinStress: 40, targetRequired: true, targetRelationType: 'close_friend' },
    success: {
      narrative: '不知怎么聊到了从前。{npcName}忽然不说话了，目光变得很远。"那都是很久以前的事了。"声音低得几乎听不见。{targetName}没有追问。',
      effects: { mood: -8 }, targetEffects: { mood: -3 }, relationChange: 5,
      memoryTag: '往事', stressChange: 5,
    },
  },
  {
    id: 'sec_betrayal', name: '背叛', description: '背叛朋友的信任',
    goalCategory: 'secrets', outcomeType: 'contested', weight: 1, cooldownTicks: 20,
    contestedStat: { actor: 'cunning', target: 'judgment' },
    tags: ['secrets', 'betrayal', 'dark'],
    conditions: { actorTraits: ['狡猾'], actorForbiddenTraits: ['正直', '善良'], actorMaxCopper: 30, targetRequired: true, targetRelationType: 'close_friend', targetMinCopper: 30 },
    success: {
      narrative: '{npcName}趁着{targetName}不在，翻了他的包袱。把里面的铜钱统统拿走了。心里有个声音说"不该"，但手没有停。',
      effects: { copper: 25, mood: -5, safety: -15 }, targetEffects: { copper: -25, mood: -20 }, relationChange: -50,
      memoryTag: '背叛朋友', stressChange: 10,
    },
    failure: {
      narrative: '{npcName}刚伸手，{targetName}就从后面出现了。四目相对，谁都没说话。空气凝固了。',
      effects: { mood: -20, safety: -20 }, targetEffects: { mood: -15 }, relationChange: -40,
      memoryTag: '差点背叛',
    },
  },
  {
    id: 'sec_blackmail', name: '被勒索', description: '被发现了秘密，遭到要挟',
    goalCategory: 'secrets', outcomeType: 'contested', weight: 1, cooldownTicks: 15,
    contestedStat: { actor: 'courage', target: 'cunning' },
    tags: ['secrets', 'blackmail', 'dark'],
    conditions: { actorTraits: [], actorForbiddenTraits: [], actorMinCopper: 20, targetRequired: true, targetTraits: ['狡猾'] },
    success: {
      narrative: '"你不想让别人知道吧？"{targetName}笑得不怀好意。{npcName}咬了咬牙，一把推开了他。"你尽管说，我问心无愧。"',
      effects: { mood: -5, safety: -5 }, relationChange: -20,
      memoryTag: '被勒索', stressChange: 8,
    },
    failure: {
      narrative: '"你不想让别人知道吧？"{targetName}笑得不怀好意。{npcName}低下了头，从腰间解下了钱袋。"……你要多少？"',
      effects: { copper: -20, mood: -15, safety: -10 }, targetEffects: { copper: 20 }, relationChange: -25,
      memoryTag: '屈辱', stressChange: 15,
    },
  },
  {
    id: 'sec_confession', name: '忏悔', description: '在寺庙中忏悔过去的罪过',
    goalCategory: 'secrets', outcomeType: 'certain', weight: 2, cooldownTicks: 15,
    tags: ['secrets', 'temple', 'redemption'],
    conditions: { actorTraits: ['善良'], actorForbiddenTraits: [], actorMinStress: 70, targetRequired: false, location: ['temple'] },
    success: {
      narrative: '{npcName}在佛像前跪了很久。终于开口，把压在心里的话一句一句说了出来。说完之后，好像卸下了千斤重担。',
      effects: { mood: 5 },
      stressChange: -20,
      memoryTag: '忏悔',
    },
  },
];

# 18 - NPC 移动与建筑内实体管理

## 问题

1. NPC 位置在初始化时分配后永不移动
2. 进入建筑后显示父 grid 的所有实体（不真实）
3. 没有基于行为的移动逻辑

## 方案

### 一、NPC 每回合移动

在 `simulateL0Action` 和 `simulateL1Batch` 中，NPC 根据行为移动到对应 grid：

| 行为 | 目标 grid |
|------|-----------|
| 吃饭 | center_street（炊饼铺附近） |
| 休息 | homeId 对应的建筑 grid |
| 打工（码头） | dock |
| 打工（茶馆） | tea_house |
| 买东西 | east_market |
| 消费 | east_market / tea_house |
| 工作时间 | workplaceId 对应的建筑 grid |
| 社交 | center_street / tea_house |
| 默认 | 住所 grid |

移动函数：
```typescript
private moveNPCToGrid(entityId: number, targetGrid: string) {
  const pos = this.em.getComponent(entityId, 'Position');
  if (!pos) return;
  // 从旧 grid 移除
  this.worldMap.removeEntity(entityId);
  // 更新位置
  pos.gridId = targetGrid;
  // 加入新 grid
  this.worldMap.addEntity(entityId, targetGrid);
}
```

### 二、L0 NPC 日程表

每个 L0 NPC 有一个根据时辰的默认日程：

```typescript
const DAILY_SCHEDULE: Record<string, Record<number, string>> = {
  'merchant': { 
    0: 'center_street',   // 子时：在家
    1: 'center_street',   // 丑时：在家
    // ...
    7: 'east_market',     // 辰时：开店
    8: 'east_market',     // 巳时：看店
    9: 'east_market',     // 午时：看店
    10: 'tea_house',      // 未时：喝茶休息
    11: 'center_street',  // 申时：收摊回家
  },
  // ... 每个职业不同
};
```

但如果 NPC 状态有特殊需求（饿了/累了/没钱），行为优先级覆盖日程。

### 三、建筑内实体管理

#### 3.1 getNearbyEntities 在室内时只显示真正在建筑内的实体

当前逻辑：在 interior grid 时查询父 grid 的所有实体（太多不真实）

修改为：
```typescript
getNearbyEntities(playerId: number): any[] {
  const pos = this.em.getComponent(playerId, 'Position');
  let gridId = pos.gridId;
  
  if (gridId.startsWith('interior_')) {
    // 提取建筑 ID
    const buildingId = parseInt(gridId.replace('interior_', ''));
    // 只返回与该建筑有关联的实体
    return this.getEntitiesInBuilding(buildingId, gridId);
  }
  
  // 室外：返回当前 grid 的实体
  return this.getEntitiesInGrid(gridId);
}

private getEntitiesInBuilding(buildingId: number, interiorGrid: string): any[] {
  const building = this.em.getComponent(buildingId, 'Building');
  const buildingPos = this.em.getComponent(buildingId, 'Position');
  
  // 1. 建筑主人
  const ownerId = building?.ownerId;
  // 2. 建筑的工作人员（workplaceId == buildingId 的 NPC）
  // 3. 当前选择在此建筑内的 NPC（位置被移到 interior grid 的）
  // 4. 建筑内的物品
  
  const results = [];
  const parentGrid = buildingPos?.gridId || 'center_street';
  
  // 查找父 grid 中与此建筑有关的实体
  const entities = this.worldMap.getEntitiesInGrid(parentGrid);
  for (const eid of entities) {
    if (eid === this.playerId) continue;
    const type = this.em.getType(eid);
    
    if (type === 'npc') {
      // 所有者
      if (eid === ownerId) { results.push(eid); continue; }
      // 工作人员
      const identity = this.em.getComponent(eid, 'Identity');
      if (identity?.workplaceId === buildingId) { results.push(eid); continue; }
      // 当前在建筑内的（概率：建筑类型决定）
      if (building?.type === 'shop' && Math.random() < 0.1) { results.push(eid); continue; }
      if (building?.type === 'teahouse' && Math.random() < 0.15) { results.push(eid); continue; }
      if (building?.type === 'house' && Math.random() < 0.05) { results.push(eid); continue; }
    }
    
    if (type === 'item') {
      // 部分物品在建筑内
      if (Math.random() < 0.1) { results.push(eid); continue; }
    }
  }
  
  return results.map(id => this.formatEntityData(id));
}
```

#### 3.2 简化方案（推荐）

不过度复杂化。改为：
- 室外：显示当前 grid 的所有实体
- 室内：显示所有者 + 工作人员 + 随机访客（基于建筑类型概率）+ 建筑内物品
- 数量控制在 5-15 个（不要几百个）

### 四、NPC 位置初始化改进

初始化时根据职业分配位置：
- merchant → east_market / cloth_shop / pharmacy
- fisherman → dock / upstream / downstream
- farmer → east_farm / south_farm
- doctor → east_market（药铺附近）
- hunter → shallow_mountain
- craftsman → center_street / east_market
- 其他 → residential_north / residential_south

## 开发优先级

1. P0: NPC 每回合根据行为移动位置
2. P0: 进入建筑只显示相关的实体（非全 grid）
3. P1: NPC 日程表系统
4. P2: NPC 位置初始化按职业分配

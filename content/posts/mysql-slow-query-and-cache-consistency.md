---
title: 慢查询治理与缓存一致性：从深分页回表到旁路缓存踩坑
date: 2025-11-22
category: 后端
tags: MySQL, 性能优化, 缓存
summary: 梳理日常后端排障中最典型的两类存储瓶颈：大表深分页下的无效回表扫描，以及高并发读写交错时的 Cache-Aside 脏数据窗口。
featured: false
shelfId: backend-arch
relatedIds: distributed-idempotency-and-locks, linux-server-docker-hardening-checklist
---

在业务数据量突破千万行之后，早期跑得飞快的列表接口和简单缓存封装往往会集中暴露性能毛刺。与其盲目升级数据库规格，不如先把执行计划里的回表放大和缓存失效策略理顺。

## 一、深分页优化：用延迟关联或游标替代大 Offset

当接口执行 `LIMIT 200000, 20` 时，InnoDB 需要先根据二级索引回表捞出 200020 行完整记录，再丢弃前 20 万行，产生大量随机磁盘 I/O。

如果业务允许按上一页末尾主键做「游标翻页（Seek Method）」，查询耗时可以稳定在常数级；如果后台管理端必须保留跳页能力，则应改写为覆盖索引子查询延迟关联。

```sql
-- 延迟关联：子查询仅扫描二级覆盖索引拿主键，外层只回表 20 次
SELECT t.id, t.order_no, t.amount, t.created_at
FROM trade_order t
INNER JOIN (
    SELECT id FROM trade_order
    WHERE user_id = 10482 AND status = 2
    ORDER BY created_at DESC
    LIMIT 200000, 20
) idx ON t.id = idx.id;
```

## 二、Cache-Aside 的更新顺序与击穿防护

围绕「先更库还是先删缓存」的争论很多，工程上最务实的标准依然是**先更新数据库，提交成功后再删除缓存**。如果删除失败，通过订阅 Binlog 或轻量重试队列做异步补偿，避免业务主流程被缓存组件拖垮。

- 热点大 Key 严禁设置整齐划一的 TTL，加上 5%～15% 的随机抖动防止集体雪崩。
- 针对突发热点查询使用进程内 SingleFlight（合并回源请求），保证缓存失效瞬间只有一个协程打到数据库。
- 区分「空结果短缓存」与「异常不缓存」，防止恶意遍历不存在的 ID 穿透到底层存储。

---
title: 高并发写链路设计：幂等令牌、分布式锁与事务边界收敛
date: 2026-07-18
category: 后端
tags: 分布式, Redis, 事务设计
summary: 复盘核心写接口在重试风暴与并发点击下的防重方案：用唯一业务键兜底数据库最终幂等，并把外部 RPC 彻底移出本地长事务。
featured: true
shelfId: backend-arch
relatedIds: mysql-slow-query-and-cache-consistency, production-agent-loop-and-guardrails
---

线上写接口出问题，十有八九不是单机吞吐不够，而是客户端弱网重试、消息队列重复投递与网关超时重发叠加在一起，击穿了没有做严格幂等校验的业务代码。

很多团队习惯在入口处加一把 Redis 分布式锁就觉得万事大吉，但锁只能解决「同一时刻的并发互斥」，解决不了「锁释放之后的先后重复请求」。真正稳健的写链路，必须把并发控制与状态幂等拆成两层来设计。

> 分布式锁管的是并发串行化，而数据库唯一约束与状态机流转管的才是全生命周期的幂等正确性。

## 一、双层防重：Redis 前置挡流 + 唯一业务索引兜底

对于下单、扣款、发券这类敏感写操作，建议由上游传入或由服务端预签发带有业务语义的 `idempotency_key`。请求到达时先通过 Redis `SET key value NX EX` 拦截毫秒级连击，再落库依赖唯一索引做最终防线。

- 前置锁过期时间必须大于接口 P99 耗时，但切忌盲目开启无限 Watchdog 续期掩盖死锁。
- 释放锁时必须通过 Lua 脚本比对当前线程持有的随机 `token`，严禁直接执行裸 `DEL` 误删其他实例刚拿到的锁。
- 数据库表必须建立 `(tenant_id, biz_type, idempotency_key)` 联合唯一索引，捕获唯一键冲突后直接按原单状态幂等返回。

```lua
-- 安全释放分布式锁：仅当持有者标识一致时删除
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
else
    return 0
end
```

## 二、把外部 RPC 与消息发送移出数据库事务

排查数据库连接池被打满的故障时，最常见的反模式就是在 `@Transactional` 或显式事务块里同步调用第三方 HTTP 接口、下游 RPC 甚至直接发 MQ。一旦下游抖动超时 3 秒，数据库连接和行锁就会被白白占满 3 秒。

更干净的做法是「前置查询校验 ➔ 极小编程式事务落库（同时写入本地消息表 Outbox） ➔ 事务提交后异步触发下游通知」，把单次事务持锁时间严格压在 10ms 以内。

- 严禁在事务内执行任何网络 I/O（RPC、HTTP、对象存储上传）。
- 采用状态机条件更新 `UPDATE orders SET status = 'PAID' WHERE id = ? AND status = 'INIT'`，利用受影响行数天然实现乐观并发保护。

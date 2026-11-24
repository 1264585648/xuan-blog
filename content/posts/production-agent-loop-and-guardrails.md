---
title: 从 Demo 到生产：构建可控的 ReAct Agent 循环与熔断护栏
date: 2026-08-19
category: Agent
tags: AI Agent, LangGraph, 架构控制
summary: 为什么百行代码的 Agent Demo 一上生产就陷入死循环或上下文爆炸？总结工具边界收敛、状态裁剪与人工审批挂起的落地经验。
featured: true
shelfId: agent-engineering
relatedIds: mcp-server-for-backend-debugging, ai-coding-subscriptions-comparison-2026
---

搭一个能调搜索和查库的 Agent 原型只需要半天，但要让它在真实生产环境里稳定达到 95% 以上的任务完成率，背后全是对不确定性的工程约束。

很多初期项目最大的误区是把「自主性」等同于「放任模型自由发挥」：一口气挂载三十多个粒度过细的工具，不限制推理轮次，也不压缩工具返回的大段原始 JSON，结果不仅 Token 账单失控，模型还极易在连续报错中迷失主线目标。

> 生产级 Agent 的核心原则：能用确定性状态机编排的流程绝不交给随机推理，只把真正需要语义判断与动态容错的节点交给大模型。

## 一、工具设计：粗粒度聚合优于底层 API 直出

不要直接把微服务的底层 CRUD 接口原封不动暴露给模型。面向 Agent 设计的 Tool 应当贴合「人类研发排查问题的一步完整动作」，从源头减少不必要的往返轮次。

- 合并高频连调接口：例如将「查用户 ID ➔ 查最近订单 ➔ 查支付流水」聚合成一个只读诊断工具。
- 精简返回负载：工具内部先完成字段投影与截断（例如日志最多返回前后 30 行关键堆栈），避免单次 Observation 塞爆上下文窗口。
- 错误提示具备可行动性：参数校验失败时返回明确的修正指引，而不是把整段 Java/Go 异常堆栈原样抛给模型。

## 二、执行状态机：步数熔断、重复动作检测与 HITL

无论采用自研循环还是基于 LangGraph 构建图状态机，都必须在每轮迭代外层加上硬性护栏（Guardrails），杜绝无限重试与越权写操作。

```python
MAX_STEPS = 10

def agent_guard_step(state: AgentState) -> str:
    if state.step_count >= MAX_STEPS:
        return "fallback_summary"
    # 检测连续两次调用完全相同的工具与参数，立即打断死循环
    if state.is_repeating_last_tool_call():
        state.inject_hint("检测到重复无效调用，请更换排查路径或直接汇总已知结论。")
    if state.pending_tool.is_write_operation:
        return "await_human_approval"
    return "execute_tool"
```

- 读写分离授权：查询类工具默认自动放行，涉及修改线上配置、执行变更 SQL 或触发工单的操作一律挂起进入 Human-in-the-Loop 审批态。
- 全链路轨迹落盘：记录每一轮的耗时、Token 消耗与工具入参出参，积累真实 Bad Case 作为后续回归评测集。

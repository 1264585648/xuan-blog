---
title: 用 MCP 协议打通后端研发上下文：把日志与只读库接入 Agent
date: 2026-05-26
category: Agent
tags: MCP, 后端效能, 工具链
summary: 基于 Model Context Protocol 封装内部排障工具集，实现一次编写即可在本地 IDE、命令行与自研 Agent 平台间无缝复用。
featured: false
shelfId: agent-engineering
relatedIds: production-agent-loop-and-guardrails, distributed-idempotency-and-locks
---

在没有统一协议之前，给不同客户端（编辑器插件、内部排障机器人、命令行助手）接入公司内部的表结构查询和日志检索，往往要把同一套胶水代码按各自的 Function Schema 重写好几遍。

引入 MCP（Model Context Protocol）之后，工具能力与宿主客户端彻底解耦：后端团队只需要维护一个标准 MCP Server，所有兼容协议的 AI 客户端都能直接挂载调用。

## 一、聚焦三大原语：Resources、Tools 与 Prompts

设计研发辅助类 MCP Server 时，合理拆分原语职责比堆砌功能更重要：

- **Resources（静态/半静态上下文）**：暴露核心库表 DDL、错误码字典与服务拓扑说明，按 URI 按需读取。
- **Tools（受控动态查询）**：封装带时间窗限制的 TraceID 日志拉取、慢 SQL 执行计划诊断与测试环境 Redis 键值查询。
- **Prompts（标准化排障模板）**：内置「线上接口超时根因分析」「DML 变更前影响面核查」等高频提示词脚手架。

```typescript
server.tool(
  "query_trace_logs",
  "按 traceId 聚合检索最近 2 小时的异常与慢调用日志摘要",
  {
    traceId: z.string().min(8).describe("全链路追踪 TraceID"),
    onlyError: z.boolean().default(true).describe("是否仅过滤 WARN/ERROR 级别"),
  },
  async ({ traceId, onlyError }) => {
    const rows = await logClient.fetchCompactByTrace(traceId, { onlyError, limit: 40 });
    return { content: [{ type: "text", text: formatCompactTimeline(rows) }] };
  }
);
```

## 二、安全底线：专用只读账号与行级脱敏

把真实研发环境数据接给大模型时，必须在 MCP Server 层做物理隔离，绝不能信任模型生成的任意 SQL。

- 数据库连接强制使用只读副本账号，并在网关层限制单次查询超时（如 `MAX_EXECUTION_TIME=2000`）与最大返回行数。
- 输出返回给客户端前统一经过正则脱敏过滤器，自动掩码手机号、身份证、密钥与鉴权 Token。

---
title: 新购云服务器初始化与 Docker 容器化部署基线清单
date: 2025-09-14
category: 服务器
tags: Linux, Docker, 安全运维
summary: 每次入手新 VPS 必跑的一套标准化配置清单：SSH 密钥加固、Docker 绕过防火墙坑点修复、日志体积限制与轻量监控。
featured: false
shelfId: server-infra
relatedIds: cloudflare-edge-proxy-and-static-deploy, mysql-slow-query-and-cache-consistency
---

手里维护着几台跑自建工具、API 网关和定时脚本的 Linux 云服务器。为了避免每次新开机器都凭记忆零散敲命令，我把必做的安全加固和容器规范整理成了一份固定基线清单。

## 一、首日安全三板斧：密钥登录、改端口与防爆破

新机器拿到公网 IP 后几分钟内就会被全网自动化脚本扫到 22 端口。初始化第一步永远是创建普通 sudo 用户、写入公钥，并彻底关闭密码登录与 Root 直连。

- 修改 `/etc/ssh/sshd_config` 中的 `PasswordAuthentication no` 与 `PermitRootLogin no`，先新开终端测试公钥能连上再重启 `sshd`，防止把自己锁在门外。
- 启用 `fail2ban` 或轻量级防火墙白名单，仅对外暴露 `80`、`443` 与自定义 SSH 端口。
- 开启内核 BBR 拥塞控制（`net.ipv4.tcp_congestion_control=bbr`），显著改善跨地域链路的吞吐与尾延迟。

## 二、必防大坑：Docker 端口映射绕过 UFW 与日志撑爆磁盘

在 Ubuntu/Debian 上装完 Docker 后有两个极易踩中的隐蔽大坑：**一是 `-p 8080:8080` 会直接修改 `iptables` 绕过 UFW 防火墙把数据库或内网服务裸奔在公网上；二是容器默认不限制 `json-file` 日志大小，跑半年就能把几十 G 系统盘塞满。**

部署任何内部组件时，务必显式绑定本地回环地址 `127.0.0.1:8080:8080`，并在 `/etc/docker/daemon.json` 中全局收敛日志上限：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  },
  "live-restore": true
}
```

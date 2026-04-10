# Ralph Claude

更易使用的 [Ralph](https://github.com/snarktank/ralph) —— 一个基于 Web UI 的 AI 自动编程循环工具。

Ralph 通过反复调用 Claude Code CLI，自动逐条实现 PRD（产品需求文档）中的 Story，直到全部完成。

## 功能特性

- **可视化 PRD 管理**：通过拖拽看板创建、编辑、排序 Story
- **一键启动**：点击按钮启动 Ralph 自动循环
- **实时日志流**：WebSocket 实时展示 Claude 运行日志
- **进度追踪**：Story 状态实时更新（待处理 → 进行中 → 已完成）
- **进度记录**：查看和编辑 `progress.txt` 学习记录
- **Git 历史**：查看 Ralph 提交的代码变更
- **跨平台**：支持 macOS 和 Windows

## 前置要求

- Node.js 18+
- [Claude Code CLI](https://docs.anthropic.com/claude-code) 已安装（`claude` 命令可用）
- Git

## 安装与启动

```bash
# 克隆仓库
git clone <repo-url>
cd ralph-claude

# 安装所有依赖
npm install

# 启动（前后端同时启动）
npm run dev
```

浏览器打开 http://localhost:5173

## 使用方法

### 1. 选择项目

点击顶部的 **📁 选择项目目录** 按钮，选择你要开发的 git 仓库目录。

### 2. 创建 PRD

进入 **PRD 管理** 页面，点击"创建 prd.json"，然后添加 Story。

每个 Story 包含：
- **标题**：简洁描述要实现的功能
- **描述**：详细说明技术要求、背景
- **验收标准**：明确的完成条件列表

> 提示：Story 的粒度很重要！每个 Story 应该能在一个上下文窗口内完成，例如"添加用户登录 API"而不是"实现整个用户系统"。

### 3. 启动 Ralph

进入 **仪表盘** 页面，点击 **▶ 启动 Ralph**。

Ralph 会按顺序：
1. 选取第一个待处理 Story
2. 构建 prompt 并调用 Claude Code
3. 运行质量检查（typecheck + test）
4. 通过后自动 git commit
5. 更新 `progress.txt`
6. 继续下一个 Story

### 4. 监控进度

- **仪表盘**：实时查看日志和 Story 状态统计
- **PRD 管理**：查看各 Story 的完成状态和 commit hash
- **进度记录**：查看 Ralph 积累的项目知识
- **Git 历史**：查看所有自动提交

## 项目结构（ralph-claude 本身）

```
ralph-claude/
├── backend/          # Node.js + Express + WebSocket 服务器
│   └── src/
│       ├── services/ralphRunner.ts   # 核心循环逻辑
│       └── ...
└── frontend/         # React + Vite + Tailwind CSS
    └── src/
        ├── pages/    # 四个主页面
        └── ...
```

## 端口

| 服务 | 端口 |
|------|------|
| 前端（Vite） | 5173 |
| 后端（Express + WS） | 3001 |

## prd.json 格式

```json
{
  "project": "my-app",
  "version": "1.0.0",
  "created": "2026-04-10T00:00:00.000Z",
  "stories": [
    {
      "id": "story-001",
      "title": "添加用户登录 API",
      "description": "实现 POST /auth/login 接口，返回 JWT token",
      "acceptanceCriteria": [
        "POST /auth/login 返回 { token: string }",
        "密码错误返回 401",
        "单元测试覆盖"
      ],
      "status": "pending",
      "priority": 1,
      "completedAt": null,
      "commitHash": null
    }
  ]
}
```

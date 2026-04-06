# 📈 Virtual Stock Exchange (VSE)

**[English](#english) | [中文](#中文)**

---

<a name="english"></a>
## English

### Introduction

Virtual Stock Exchange (VSE) is a professional-grade stock market simulator inspired by MT4/MT5 trading terminals. It provides a realistic trading experience with real-time price simulation, market impact mechanics, and a full suite of technical analysis tools — all without risking real money.

Whether you're a beginner learning to trade or an experienced trader testing strategies, VSE offers an immersive environment with candlestick charts, multiple order types, and a competitive leaderboard.

### Features

#### 📊 Real-Time Market Simulation
- Random walk price model with mean reversion — prices behave realistically
- **Market impact engine** — your large orders actually move the price (buy pushes up, sell pushes down)
- 800ms tick interval for smooth, responsive price action
- Real-time bid/ask spread visualization

#### 🕯️ Professional Charting
- MT4-style candlestick charts powered by [TradingView lightweight-charts](https://github.com/tradingview/lightweight-charts)
- **7 timeframes**: 1m, 5m, 15m, 1H, 4H, 1D, 1W
- **10 technical indicators**:
  - Trend: SMA 20, EMA 9, EMA 21, Bollinger Bands, VWAP
  - Momentum: RSI (14), MACD (12, 26, 9), Stochastic (14, 3)
  - Volatility: ATR (14)
  - Volume: Volume histogram
- Crosshair with OHLC data display
- Dark / Light theme toggle

#### 💹 Trading Engine
- **Market orders** — instant execution at current bid/ask
- **Limit orders** — buy below / sell above a target price
- **Stop orders** — buy above / sell below a trigger price
- Percentage-based quantity shortcuts (25% / 50% / 75% / 100%)
- Automatic pending order execution when price conditions are met

#### 📋 Order Book
- Live simulated order book with 7 levels of depth
- Bid/ask volume visualization with depth bars
- Real-time spread display

#### 💼 Portfolio Management
- Real-time unrealized P&L tracking
- Position details: shares, average cost, current value
- Complete trade history with realized P&L
- Auto-saving portfolio state

#### 🔔 Price Alerts
- Price Above / Price Below alerts
- Stop Loss / Take Profit triggers
- Toast notifications when alerts fire
- Server-side alert monitoring

#### 🏆 Trading Competitions
- Create custom competitions with configurable duration and starting balance
- Join active competitions and compete against other traders
- Real-time leaderboard ranked by return percentage
- Competition status tracking (upcoming / active / ended)

#### 👥 User System
- Email registration and login with JWT authentication
- OAuth simulation (Google, GitHub)
- Persistent portfolio across sessions
- Global leaderboard ranked by total equity

#### 📡 Real-Time Sync
- WebSocket connection for live price streaming
- Frontend-backend data synchronization
- Auto-reconnect on connection loss
- Fallback to local simulation when server is unavailable

### 12 Tradeable Symbols

| Symbol | Company | Sector | Volatility |
|--------|---------|--------|------------|
| AAPL | Apple Inc. | Technology | Low |
| TSLA | Tesla Inc. | EV | High |
| NVDA | NVIDIA Corp. | Semiconductors | High |
| MSFT | Microsoft Corp. | Technology | Low |
| AMZN | Amazon.com Inc. | E-Commerce | Medium |
| GOOGL | Alphabet Inc. | Technology | Low |
| META | Meta Platforms | Social Media | Medium |
| AMD | Advanced Micro Devices | Semiconductors | High |
| NFLX | Netflix Inc. | Streaming | Medium |
| COIN | Coinbase Global | Crypto | Very High |
| BABA | Alibaba Group | E-Commerce | High |
| SPY | S&P 500 ETF | ETF | Very Low |

### Tech Stack

#### Frontend
- **React 18** — UI framework
- **Tailwind CSS** — utility-first styling
- **lightweight-charts** — TradingView charting library
- **Custom indicators** — pure JavaScript, no external dependencies

#### Backend
- **Node.js + Express** — REST API server
- **SQLite (better-sqlite3)** — embedded database with WAL mode
- **WebSocket (ws)** — real-time data streaming
- **JWT + bcrypt** — authentication and password hashing

### Project Structure

```
virtual-stock-exchange/
├── public/
│   └── index.html
├── server/
│   ├── index.js          # Express server + WebSocket
│   ├── routes.js         # API routes (auth, trade, alerts, competitions)
│   ├── market.js         # Market simulation engine
│   └── db.js             # SQLite database setup
├── src/
│   ├── components/
│   │   ├── AuthModal.jsx       # Login / Register modal
│   │   ├── Chart.jsx           # Candlestick chart with indicators
│   │   ├── Watchlist.jsx       # Symbol list with live prices
│   │   ├── OrderBook.jsx       # Bid/ask order book
│   │   ├── TradePanel.jsx      # Order entry form
│   │   ├── Portfolio.jsx       # Positions & trade history
│   │   ├── PendingOrders.jsx   # Active limit/stop orders
│   │   ├── AlertsPanel.jsx     # Price alert management
│   │   ├── AlertToast.jsx      # Toast notifications
│   │   ├── Leaderboard.jsx     # Global leaderboard
│   │   └── CompetitionPanel.jsx # Competition system
│   ├── hooks/
│   │   ├── useMarket.js        # Market state & trading logic
│   │   └── useWebSocket.js     # WebSocket connection
│   ├── utils/
│   │   ├── api.js              # Backend API client
│   │   ├── auth.js             # Local auth utilities
│   │   ├── indicators.js       # Technical indicator calculations
│   │   ├── alerts.js           # Alert management
│   │   └── competition.js      # Competition utilities
│   ├── data/
│   │   └── stocks.js           # Stock definitions & history generation
│   ├── App.jsx                 # Main application
│   ├── index.js                # Entry point
│   └── index.css               # Global styles & theming
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

### Getting Started

#### Prerequisites
- Node.js 18+
- npm

#### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

#### Running

```bash
# Start backend server (port 3001)
cd server && node index.js &

# Start frontend dev server (port 3000)
npm start
```

Open [http://localhost:3000](http://localhost:3000) to start trading.

#### Production Build

```bash
npm run build
cd server && node index.js
```

The server will serve the built frontend and API on port 3001.

### Virtual Balance

You start with **$100,000** in virtual cash. No real money involved — just the thrill of the market.

---

<a name="中文"></a>
## 中文

### 项目简介

Virtual Stock Exchange (VSE) 是一款专业级的虚拟股票交易模拟器，灵感来自 MT4/MT5 交易终端。它提供逼真的交易体验，包括实时价格模拟、市场冲击机制和完整的技术分析工具——全部不需要真实资金。

无论你是学习交易的新手，还是测试策略的经验交易者，VSE 都提供了一个沉浸式的环境，配有K线图、多种订单类型和竞争排行榜。

### 功能特性

#### 📊 实时市场模拟
- 带均值回归的随机漫步价格模型——价格行为逼真
- **市场冲击引擎**——你的大额订单真的会影响价格（买入推高，卖出压低）
- 800ms 报价间隔，价格变化流畅响应
- 实时买卖价差可视化

#### 🕯️ 专业图表
- MT4 风格 K 线图，由 [TradingView lightweight-charts](https://github.com/tradingview/lightweight-charts) 驱动
- **7 个时间周期**：1分钟、5分钟、15分钟、1小时、4小时、1天、1周
- **10 个技术指标**：
  - 趋势类：SMA 20、EMA 9、EMA 21、布林带、VWAP
  - 动量类：RSI (14)、MACD (12, 26, 9)、随机指标 (14, 3)
  - 波动类：ATR (14)
  - 成交量：成交量柱状图
- 十字光标显示 OHLC 数据
- 深色 / 浅色主题切换

#### 💹 交易引擎
- **市价单**——按当前买卖价即时成交
- **限价单**——低于目标价买入 / 高于目标价卖出
- **止损单**——高于触发价买入 / 低于触发价卖出
- 百分比快捷输入（25% / 50% / 75% / 100%）
- 价格条件满足时自动执行挂单

#### 📋 订单簿
- 实时模拟订单簿，7 档深度
- 买卖量深度柱状图
- 实时价差显示

#### 💼 投资组合管理
- 实时浮动盈亏追踪
- 持仓详情：股数、均价、当前市值
- 完整交易历史与已实现盈亏
- 投资组合状态自动保存

#### 🔔 价格提醒
- 价格上方 / 价格下方提醒
- 止损 / 止盈触发器
- 提醒触发时弹出通知
- 服务端提醒监控

#### 🏆 交易竞赛
- 创建自定义竞赛，可配置时长和初始资金
- 加入活跃竞赛与其他交易者竞争
- 实时排行榜按收益率排名
- 竞赛状态追踪（未开始 / 进行中 / 已结束）

#### 👥 用户系统
- 邮箱注册登录，JWT 认证
- OAuth 模拟登录（Google、GitHub）
- 跨会话持久化投资组合
- 全球排行榜按总资产排名

#### 📡 实时同步
- WebSocket 连接实时推送行情
- 前后端数据同步
- 连接断开自动重连
- 服务不可用时回退到本地模拟

### 12 个交易品种

| 代码 | 公司 | 行业 | 波动率 |
|------|------|------|--------|
| AAPL | 苹果公司 | 科技 | 低 |
| TSLA | 特斯拉 | 电动车 | 高 |
| NVDA | 英伟达 | 半导体 | 高 |
| MSFT | 微软 | 科技 | 低 |
| AMZN | 亚马逊 | 电商 | 中 |
| GOOGL | 谷歌 | 科技 | 低 |
| META | Meta | 社交媒体 | 中 |
| AMD | 超威半导体 | 半导体 | 高 |
| NFLX | 奈飞 | 流媒体 | 中 |
| COIN | Coinbase | 加密货币 | 极高 |
| BABA | 阿里巴巴 | 电商 | 高 |
| SPY | 标普500 ETF | ETF | 极低 |

### 技术栈

#### 前端
- **React 18** — UI 框架
- **Tailwind CSS** — 原子化 CSS 框架
- **lightweight-charts** — TradingView 图表库
- **自研指标** — 纯 JavaScript 实现，无外部依赖

#### 后端
- **Node.js + Express** — REST API 服务器
- **SQLite (better-sqlite3)** — 嵌入式数据库，WAL 模式
- **WebSocket (ws)** — 实时数据推送
- **JWT + bcrypt** — 认证与密码哈希

### 项目结构

```
virtual-stock-exchange/
├── public/
│   └── index.html
├── server/
│   ├── index.js          # Express 服务器 + WebSocket
│   ├── routes.js         # API 路由（认证、交易、提醒、竞赛）
│   ├── market.js         # 市场模拟引擎
│   └── db.js             # SQLite 数据库初始化
├── src/
│   ├── components/
│   │   ├── AuthModal.jsx       # 登录/注册弹窗
│   │   ├── Chart.jsx           # K线图与技术指标
│   │   ├── Watchlist.jsx       # 品种列表与实时报价
│   │   ├── OrderBook.jsx       # 买卖盘口
│   │   ├── TradePanel.jsx      # 下单面板
│   │   ├── Portfolio.jsx       # 持仓与交易历史
│   │   ├── PendingOrders.jsx   # 挂单管理
│   │   ├── AlertsPanel.jsx     # 价格提醒管理
│   │   ├── AlertToast.jsx      # 消息通知
│   │   ├── Leaderboard.jsx     # 全球排行榜
│   │   └── CompetitionPanel.jsx # 竞赛系统
│   ├── hooks/
│   │   ├── useMarket.js        # 市场状态与交易逻辑
│   │   └── useWebSocket.js     # WebSocket 连接
│   ├── utils/
│   │   ├── api.js              # 后端 API 客户端
│   │   ├── auth.js             # 本地认证工具
│   │   ├── indicators.js       # 技术指标计算
│   │   ├── alerts.js           # 提醒管理
│   │   └── competition.js      # 竞赛工具
│   ├── data/
│   │   └── stocks.js           # 股票定义与历史数据生成
│   ├── App.jsx                 # 主应用
│   ├── index.js                # 入口
│   └── index.css               # 全局样式与主题
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

### 快速开始

#### 环境要求
- Node.js 18+
- npm

#### 安装

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..
```

#### 启动

```bash
# 启动后端服务器（端口 3001）
cd server && node index.js &

# 启动前端开发服务器（端口 3000）
npm start
```

打开 [http://localhost:3000](http://localhost:3000) 开始交易。

#### 生产构建

```bash
npm run build
cd server && node index.js
```

服务器将在端口 3001 提供前端和 API 服务。

### 虚拟资金

初始资金 **$100,000** 虚拟美元。不涉及真实资金——纯粹享受市场的刺激。

---

## License

MIT

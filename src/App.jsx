import React, { useState, useEffect } from 'react';
import { useMarket } from './hooks/useMarket';
import Watchlist from './components/Watchlist';
import Chart from './components/Chart';
import OrderBook from './components/OrderBook';
import TradePanel from './components/TradePanel';
import Portfolio from './components/Portfolio';
import AlertToast from './components/AlertToast';
import AuthModal from './components/AuthModal';
import Leaderboard from './components/Leaderboard';
import AlertsPanel from './components/AlertsPanel';
import PendingOrders from './components/PendingOrders';
import CompetitionPanel from './components/CompetitionPanel';
import { getCurrentUser, logout } from './utils/auth';

export default function App() {
  const [user, setUser] = useState(() => getCurrentUser());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showCompetition, setShowCompetition] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('vse_theme') || 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const {
    stocks, selectedStock, selectedSymbol, setSelectedSymbol,
    timeframe, setTimeframe,
    portfolio, executeTrade, alerts,
    pendingOrders, placePendingOrder, cancelPendingOrder,
  } = useMarket(user);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vse_theme', theme);
  }, [theme]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    window.addEventListener('click', handler, { once: true });
    return () => window.removeEventListener('click', handler);
  }, [userMenuOpen]);

  const handleAuth = (u) => setUser(u);
  const handleLogout = () => { logout(); setUser(null); setUserMenuOpen(false); };
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col h-screen overflow-hidden select-none" style={{ background: 'var(--bg-primary)' }}>

      {/* Auth gate */}
      {!user && <AuthModal onAuth={handleAuth} />}

      {/* ═══ Top Bar ═══ */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b flex-shrink-0 gap-2"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', height: '38px' }}>
        {/* Left: Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="font-bold text-sm tracking-wider" style={{ color: 'var(--gold)' }}>VSE</div>
          <div className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>Virtual Stock Exchange</div>
          <div className="w-px h-4" style={{ background: 'var(--border-color)' }} />
          <div className="pulse-dot" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>LIVE</span>
          {/* Mobile toggles */}
          <button className="md:hidden text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            onClick={() => setSidebarOpen(v => !v)}>☰</button>
          <button className="lg:hidden text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            onClick={() => setRightPanelOpen(v => !v)}>⊞</button>
        </div>

        {/* Center: selected stock ticker */}
        {selectedStock && (
          <div className="flex items-center gap-3 text-xs font-mono flex-1 justify-center">
            <span className="font-bold" style={{ color: 'var(--text-bright)' }}>{selectedStock.symbol}</span>
            <span className={`font-bold text-sm ${selectedStock.changePct >= 0 ? 'price-up' : 'price-down'}`}>
              ${selectedStock.currentPrice.toFixed(2)}
            </span>
            <span className={`hidden sm:inline ${selectedStock.changePct >= 0 ? 'price-up' : 'price-down'}`}>
              {selectedStock.changePct >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}
              &nbsp;({selectedStock.changePct >= 0 ? '+' : ''}{selectedStock.changePct.toFixed(2)}%)
            </span>
            <span className="hidden md:inline" style={{ color: 'var(--text-muted)' }}>Vol: {(selectedStock.volume/1000).toFixed(0)}K</span>
          </div>
        )}

        {/* Right: Actions + user */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono hidden xl:inline" style={{ color: 'var(--text-muted)' }}>
            Cash: <span style={{ color: 'var(--text-bright)' }}>${portfolio.balance.toLocaleString()}</span>
            &nbsp;P&L: <span className={portfolio.pnl >= 0 ? 'price-up' : 'price-down'}>
              {portfolio.pnl >= 0 ? '+' : ''}${portfolio.pnl.toLocaleString()}
            </span>
          </span>

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          <button onClick={() => setShowAlerts(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            🔔
          </button>

          <button onClick={() => setShowCompetition(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hidden sm:flex"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            🏆
          </button>

          {/* User menu */}
          {user && (
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
                className="flex items-center gap-1.5 px-2 py-1 rounded transition-all"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
                  style={{ background: 'rgba(38,166,154,0.3)', color: 'var(--up-color)' }}>
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: 'var(--text-primary)' }}>{user.username}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>▾</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 rounded-lg shadow-xl z-50 w-44 py-1 fade-in"
                  style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                  <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--bg-hover)' }}>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-bright)' }}>{user.username}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>
                  <button onClick={() => { setShowCompetition(true); setUserMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-dark-600" style={{ color: 'var(--text-secondary)' }}>
                    🏆 Competition
                  </button>
                  <button onClick={() => { setShowAlerts(true); setUserMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-dark-600" style={{ color: 'var(--text-secondary)' }}>
                    🔔 My Alerts
                  </button>
                  <div style={{ borderTop: '1px solid var(--bg-hover)', marginTop: '4px' }} />
                  <button onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs" style={{ color: 'var(--down-color)' }}>
                    ⎋ Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Watchlist (collapsible on mobile) */}
        <div className={`flex-shrink-0 border-r transition-all duration-200 ${sidebarOpen ? '' : 'hidden md:block'}`}
          style={{ width: '160px', borderColor: 'var(--border-color)' }}>
          <Watchlist stocks={stocks} selectedSymbol={selectedSymbol} setSelectedSymbol={setSelectedSymbol} />
        </div>

        {/* Chart + Portfolio */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <Chart stock={selectedStock} timeframe={timeframe} setTimeframe={setTimeframe} theme={theme} />
          </div>
          <div className="flex-shrink-0 border-t" style={{ height: '200px', borderColor: 'var(--border-color)' }}>
            <div style={{ height:'100%', overflow:'hidden' }}>
              <Portfolio portfolio={portfolio} stocks={stocks} />
            </div>
          </div>
        </div>

        {/* Order Book + Trade Panel (collapsible on mobile) */}
        <div className={`flex-shrink-0 flex flex-col border-l transition-all duration-200 ${rightPanelOpen ? '' : 'hidden lg:flex'}`}
          style={{ width: '340px', borderColor: 'var(--border-color)' }}>
          <div className="flex flex-1 overflow-hidden">
            <div style={{ width:'160px', borderRight:'1px solid var(--border-color)' }}>
              <OrderBook stock={selectedStock} />
            </div>
            <div style={{ width:'180px' }}>
              <TradePanel stock={selectedStock} portfolio={portfolio} executeTrade={executeTrade} placePendingOrder={placePendingOrder} />
            </div>
          </div>
          <PendingOrders orders={pendingOrders} onCancel={cancelPendingOrder} />
        </div>
      </div>

      {/* ═══ Status Bar ═══ */}
      <div className="status-bar">
        <div className="flex items-center gap-3">
          <span>📡 Connected</span>
          <span>•</span>
          <span>{stocks.length} symbols</span>
          {pendingOrders.length > 0 && (
            <>
              <span>•</span>
              <span>📋 {pendingOrders.length} pending</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>Equity: <span style={{ color: 'var(--text-primary)' }}>
            ${(portfolio.balance + Object.entries(portfolio.positions).reduce((s, [sym, pos]) => {
              const stock = stocks.find(st => st.symbol === sym);
              return s + (stock ? stock.currentPrice * pos.shares : 0);
            }, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span></span>
          <span>•</span>
          <span>{dateStr} {timeStr}</span>
        </div>
      </div>

      {/* ═══ Modals ═══ */}
      {showLeaderboard && <Leaderboard currentUser={user} onClose={() => setShowLeaderboard(false)} />}
      {showCompetition && <CompetitionPanel user={user} onClose={() => setShowCompetition(false)} />}
      {showAlerts && user && (
        <AlertsPanel userId={user.id} stocks={stocks} selectedSymbol={selectedSymbol} onClose={() => setShowAlerts(false)} />
      )}

      {/* Toast alerts */}
      <AlertToast alerts={alerts} />
    </div>
  );
}

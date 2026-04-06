import React, { useState, useEffect } from 'react';
import { useMarket } from './hooks/useMarket';
import { useLang } from './i18n/LanguageContext';
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
  const { t, lang, toggleLang } = useLang();
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vse_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    window.addEventListener('click', handler, { once: true });
    return () => window.removeEventListener('click', handler);
  }, [userMenuOpen]);

  const handleAuth = (u) => setUser(u);
  const handleLogout = () => { logout(); setUser(null); setUserMenuOpen(false); };
  const toggleTheme = () => setTheme(th => th === 'dark' ? 'light' : 'dark');

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex flex-col h-screen overflow-hidden select-none" style={{ background: 'var(--bg-primary)' }}>

      {!user && <AuthModal onAuth={handleAuth} />}

      {/* ═══ Top Bar ═══ */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b flex-shrink-0 gap-2"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', height: '38px' }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="font-bold text-sm tracking-wider" style={{ color: 'var(--gold)' }}>{t('vse')}</div>
          <div className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>{t('vseFullName')}</div>
          <div className="w-px h-4" style={{ background: 'var(--border-color)' }} />
          <div className="pulse-dot" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('live')}</span>
          <button className="md:hidden text-xs px-2 py-0.5 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle watchlist">☰</button>
          <button className="lg:hidden text-xs px-2 py-0.5 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            onClick={() => setRightPanelOpen(v => !v)}
            aria-label="Toggle order panel">⊞</button>
        </div>

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

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono hidden xl:inline" style={{ color: 'var(--text-muted)' }}>
            {t('cash')}: <span style={{ color: 'var(--text-bright)' }}>${portfolio.balance.toLocaleString()}</span>
            &nbsp;{t('pnl')}: <span className={portfolio.pnl >= 0 ? 'price-up' : 'price-down'}>
              {portfolio.pnl >= 0 ? '+' : ''}${portfolio.pnl.toLocaleString()}
            </span>
          </span>

          <button onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all font-bold tracking-wider min-w-[56px] min-h-[44px] lang-toggle-btn"
            style={{ background: 'var(--gold)', color: '#1a1a2e', border: '2px solid transparent', boxShadow: '0 0 12px rgba(255,215,0,0.3)' }}
            title={lang === 'en' ? '切换到中文' : 'Switch to English'}
            aria-label={lang === 'en' ? '切换到中文' : 'Switch to English'}>
            🌐 {lang === 'en' ? '中文' : 'English'}
          </button>

          <button onClick={toggleTheme}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all min-w-[44px] min-h-[44px]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            title={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
            aria-label={theme === 'dark' ? t('switchToLight') : t('switchToDark')}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          <button onClick={() => setShowAlerts(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all min-w-[44px] min-h-[44px]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            aria-label={t('alerts')}>
            🔔
          </button>

          <button onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all min-w-[44px] min-h-[44px]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            aria-label={t('leaderboard')}>
            🏅
          </button>

          <button onClick={() => setShowCompetition(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hidden sm:flex min-w-[44px] min-h-[44px]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            aria-label={t('competition')}>
            🏆
          </button>

          {user && (
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
                className="flex items-center gap-1.5 px-2 py-1 rounded transition-all min-h-[44px]"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                aria-label={`${user.username} menu`}
                aria-expanded={userMenuOpen}>
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
                  style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}
                  role="menu">
                  <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--bg-hover)' }}>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-bright)' }}>{user.username}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>
                  <button onClick={() => { setShowCompetition(true); setUserMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }} role="menuitem">
                    🏆 {t('competition')}
                  </button>
                  <button onClick={() => { setShowAlerts(true); setUserMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }} role="menuitem">
                    {t('myAlerts')}
                  </button>
                  <div style={{ borderTop: '1px solid var(--bg-hover)', marginTop: '4px' }} />
                  <button onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs" style={{ color: 'var(--down-color)' }} role="menuitem">
                    {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-shrink-0 border-r transition-all duration-200 ${sidebarOpen ? '' : 'hidden md:block'}`}
          style={{ width: '160px', borderColor: 'var(--border-color)' }}>
          <Watchlist stocks={stocks} selectedSymbol={selectedSymbol} setSelectedSymbol={setSelectedSymbol} />
        </div>

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
          <span>{t('connected')}</span>
          <span>•</span>
          <span>{stocks.length} {t('symbols')}</span>
          {pendingOrders.length > 0 && (
            <>
              <span>•</span>
              <span>📋 {pendingOrders.length} {t('pending')}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>{t('equity')}: <span style={{ color: 'var(--text-primary)' }}>
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

      <AlertToast alerts={alerts} />
    </div>
  );
}

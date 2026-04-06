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

  const {
    stocks, selectedStock, selectedSymbol, setSelectedSymbol,
    timeframe, setTimeframe,
    portfolio, executeTrade, alerts,
    pendingOrders, placePendingOrder, cancelPendingOrder,
  } = useMarket(user);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    window.addEventListener('click', handler, { once: true });
    return () => window.removeEventListener('click', handler);
  }, [userMenuOpen]);

  const handleAuth = (u) => setUser(u);
  const handleLogout = () => { logout(); setUser(null); setUserMenuOpen(false); };

  return (
    <div className="flex flex-col h-screen bg-dark-900 overflow-hidden select-none">

      {/* Auth gate */}
      {!user && <AuthModal onAuth={handleAuth} />}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-dark-800 border-b border-dark-500 flex-shrink-0 gap-3">
        {/* Left: Logo + status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-gold font-bold text-base tracking-wider">VSE</div>
          <div className="text-gray-500 text-xs hidden sm:block">Virtual Stock Exchange</div>
          <div className="w-px h-4 bg-dark-400" />
          <div className="w-2 h-2 rounded-full bg-up animate-pulse" />
          <span className="text-xs text-gray-500">LIVE</span>
        </div>

        {/* Center: selected stock ticker */}
        {selectedStock && (
          <div className="flex items-center gap-3 text-xs font-mono flex-1 justify-center">
            <span className="text-white font-bold">{selectedStock.symbol}</span>
            <span className={`font-bold text-sm ${selectedStock.changePct >= 0 ? 'price-up' : 'price-down'}`}>
              ${selectedStock.currentPrice.toFixed(2)}
            </span>
            <span className={selectedStock.changePct >= 0 ? 'price-up' : 'price-down'}>
              {selectedStock.changePct >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}
              &nbsp;({selectedStock.changePct >= 0 ? '+' : ''}{selectedStock.changePct.toFixed(2)}%)
            </span>
            <span className="text-gray-500 hidden md:block">Vol: {(selectedStock.volume/1000).toFixed(0)}K</span>
          </div>
        )}

        {/* Right: Actions + user */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500 font-mono hidden lg:block">
            Cash: <span className="text-white">${portfolio.balance.toLocaleString()}</span>
            &nbsp;P&L: <span className={portfolio.pnl >= 0 ? 'price-up' : 'price-down'}>
              {portfolio.pnl >= 0 ? '+' : ''}${portfolio.pnl.toLocaleString()}
            </span>
          </span>

          {/* Alerts button */}
          <button
            onClick={() => setShowAlerts(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-600 hover:bg-dark-500 border border-dark-400 rounded text-xs text-gray-300 transition-all"
          >
            🔔 Alerts
          </button>

          {/* Leaderboard button */}
          <button
            onClick={() => setShowCompetition(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-600 hover:bg-dark-500 border border-dark-400 rounded text-xs text-gray-300 transition-all"
          >
            🏆 Competition
          </button>

          {/* User menu */}
          {user && (
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
                className="flex items-center gap-2 px-2 py-1.5 bg-dark-600 hover:bg-dark-500 border border-dark-400 rounded transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-up/30 flex items-center justify-center text-xs font-bold text-up overflow-hidden">
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    : user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-white hidden sm:block">{user.username}</span>
                <span className="text-gray-500 text-xs">▾</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-dark-700 border border-dark-400 rounded-lg shadow-xl z-50 w-44 py-1">
                  <div className="px-3 py-2 border-b border-dark-600">
                    <div className="text-white text-xs font-bold">{user.username}</div>
                    <div className="text-gray-500 text-xs truncate">{user.email}</div>
                    <div className="text-xs text-gray-600 mt-0.5 capitalize">{user.provider}</div>
                  </div>
                  <button
                    onClick={() => setShowCompetition(true)}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600">
                    🏆 Competition
                  </button>
                  <button
                    onClick={() => setShowAlerts(true)}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600">
                    🔔 My Alerts
                  </button>
                  <div className="border-t border-dark-600 mt-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-down hover:bg-dark-600">
                    ⎋ Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Watchlist */}
        <div className="flex-shrink-0 border-r border-dark-500" style={{width: '160px'}}>
          <Watchlist stocks={stocks} selectedSymbol={selectedSymbol} setSelectedSymbol={setSelectedSymbol} />
        </div>

        {/* Chart + Portfolio */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-hidden" style={{minHeight: 0}}>
            <Chart stock={selectedStock} timeframe={timeframe} setTimeframe={setTimeframe} />
          </div>
          <div className="flex-shrink-0 border-t border-dark-500" style={{height: '200px'}}>
            <div style={{height:'100%', overflow:'hidden'}}>
              <Portfolio portfolio={portfolio} stocks={stocks} />
            </div>
          </div>
        </div>

        {/* Order Book + Trade Panel */}
        <div className="flex-shrink-0 flex flex-col border-l border-dark-500" style={{width: '340px'}}>
          <div style={{width:'160px', borderRight:'1px solid #2a2a35', flex:'1 1 auto', overflow:'hidden'}}>
            <OrderBook stock={selectedStock} />
          </div>
          <div style={{width:'180px', flex:'1 1 auto', overflow:'hidden'}}>
            <TradePanel stock={selectedStock} portfolio={portfolio} executeTrade={executeTrade} placePendingOrder={placePendingOrder} />
          </div>
          <PendingOrders orders={pendingOrders} onCancel={cancelPendingOrder} />
        </div>
      </div>

      {/* Modals */}
      {showLeaderboard && (
        <Leaderboard currentUser={user} onClose={() => setShowLeaderboard(false)} />
      )}
      {showCompetition && (
        <CompetitionPanel user={user} onClose={() => setShowCompetition(false)} />
      )}
      {showAlerts && user && (
        <AlertsPanel
          userId={user.id}
          stocks={stocks}
          selectedSymbol={selectedSymbol}
          onClose={() => setShowAlerts(false)}
        />
      )}

      {/* Toast alerts */}
      <AlertToast alerts={alerts} />
    </div>
  );
}

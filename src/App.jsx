import React, { useState } from 'react';
import { useMarket } from './hooks/useMarket';
import Watchlist from './components/Watchlist';
import Chart from './components/Chart';
import OrderBook from './components/OrderBook';
import TradePanel from './components/TradePanel';
import Portfolio from './components/Portfolio';
import AlertToast from './components/AlertToast';

export default function App() {
  const {
    stocks, selectedStock, selectedSymbol, setSelectedSymbol,
    timeframe, setTimeframe,
    portfolio, executeTrade, alerts,
  } = useMarket();

  const [bottomTab, setBottomTab] = useState('portfolio');

  return (
    <div className="flex flex-col h-screen bg-dark-900 overflow-hidden select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-dark-800 border-b border-dark-500 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-gold font-bold text-base tracking-wider">VSE</div>
          <div className="text-gray-500 text-xs">Virtual Stock Exchange</div>
          <div className="w-px h-4 bg-dark-400" />
          <div className="w-2 h-2 rounded-full bg-up animate-pulse" />
          <span className="text-xs text-gray-500">MARKET OPEN</span>
        </div>
        {selectedStock && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-white font-bold">{selectedStock.symbol}</span>
            <span className={`font-bold text-sm ${selectedStock.changePct >= 0 ? 'price-up' : 'price-down'}`}>
              ${selectedStock.currentPrice.toFixed(2)}
            </span>
            <span className={selectedStock.changePct >= 0 ? 'price-up' : 'price-down'}>
              {selectedStock.changePct >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({selectedStock.changePct >= 0 ? '+' : ''}{selectedStock.changePct.toFixed(2)}%)
            </span>
            <span className="text-gray-500">Vol: {(selectedStock.volume / 1000).toFixed(0)}K</span>
          </div>
        )}
        <div className="text-xs text-gray-500 font-mono">
          Cash: <span className="text-white">${portfolio.balance.toLocaleString()}</span>
          &nbsp;|&nbsp;P&L: <span className={portfolio.pnl >= 0 ? 'price-up' : 'price-down'}>
            {portfolio.pnl >= 0 ? '+' : ''}${portfolio.pnl.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Watchlist */}
        <div className="flex-shrink-0 border-r border-dark-500" style={{width: '160px'}}>
          <Watchlist stocks={stocks} selectedSymbol={selectedSymbol} setSelectedSymbol={setSelectedSymbol} />
        </div>

        {/* Center: Chart + bottom panel */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Chart */}
          <div className="flex-1 overflow-hidden" style={{minHeight: 0}}>
            <Chart stock={selectedStock} timeframe={timeframe} setTimeframe={setTimeframe} />
          </div>

          {/* Bottom panel */}
          <div className="flex-shrink-0 border-t border-dark-500" style={{height: '200px'}}>
            <div className="flex items-center gap-1 px-3 py-1 bg-dark-800 border-b border-dark-600">
              {['portfolio'].map(t => (
                <button key={t} className={`tab-btn ${bottomTab === t ? 'active' : ''}`}
                  onClick={() => setBottomTab(t)}>Portfolio & History</button>
              ))}
            </div>
            <div style={{height: 'calc(200px - 30px)', overflow: 'hidden'}}>
              <Portfolio portfolio={portfolio} stocks={stocks} />
            </div>
          </div>
        </div>

        {/* Right: Order Book + Trade Panel */}
        <div className="flex-shrink-0 flex border-l border-dark-500" style={{width: '340px'}}>
          <div style={{width: '160px', borderRight: '1px solid #2a2a35'}}>
            <OrderBook stock={selectedStock} />
          </div>
          <div style={{width: '180px'}}>
            <TradePanel stock={selectedStock} portfolio={portfolio} executeTrade={executeTrade} />
          </div>
        </div>
      </div>

      {/* Alerts */}
      <AlertToast alerts={alerts} />
    </div>
  );
}

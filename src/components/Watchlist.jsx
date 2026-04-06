import React, { useRef } from 'react';

export default function Watchlist({ stocks, selectedSymbol, setSelectedSymbol }) {
  const prevPrices = useRef({});

  return (
    <div className="flex flex-col h-full bg-dark-800 border-r border-dark-500">
      <div className="px-3 py-2 border-b border-dark-500 text-xs text-gray-400 uppercase tracking-widest font-semibold">
        Market Watch
      </div>
      {/* Header */}
      <div className="grid text-xs text-gray-500 px-2 py-1 border-b border-dark-600" style={{gridTemplateColumns:'2fr 1.5fr 1fr'}}>
        <span>Symbol</span><span className="text-right">Price</span><span className="text-right">Chg%</span>
      </div>
      <div className="overflow-y-auto flex-1">
        {stocks.map(stock => {
          const prev = prevPrices.current[stock.symbol];
          const flash = prev !== undefined ? (stock.currentPrice > prev ? 'flash-up' : stock.currentPrice < prev ? 'flash-down' : '') : '';
          prevPrices.current[stock.symbol] = stock.currentPrice;
          const isUp = stock.changePct >= 0;

          return (
            <div
              key={stock.symbol}
              className={`ticker-row grid items-center px-2 py-1.5 ${flash} ${selectedSymbol === stock.symbol ? 'active' : ''}`}
              style={{gridTemplateColumns:'2fr 1.5fr 1fr'}}
              onClick={() => setSelectedSymbol(stock.symbol)}
            >
              <div>
                <div className="text-xs font-semibold text-white">{stock.symbol}</div>
                <div className="text-gray-500" style={{fontSize:'9px'}}>{stock.sector}</div>
              </div>
              <div className={`text-right text-xs font-mono font-semibold ${isUp ? 'price-up' : 'price-down'}`}>
                {stock.currentPrice.toFixed(2)}
              </div>
              <div className={`text-right text-xs font-mono ${isUp ? 'price-up' : 'price-down'}`}>
                {isUp ? '+' : ''}{stock.changePct.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

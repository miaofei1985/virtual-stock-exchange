import React, { useRef, useState, useMemo } from 'react';
import { useLang } from '../i18n/LanguageContext';

export default function Watchlist({ stocks, selectedSymbol, setSelectedSymbol }) {
  const { t, lang } = useLang();
  const prevPrices = useRef({});
  const [search, setSearch] = useState('');
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vse_watchlist')) || []; } catch { return []; }
  });
  const [toast, setToast] = useState(null);

  const toggleWatchlist = (symbol, e) => {
    e.stopPropagation();
    setWatchlist(prev => {
      const next = prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol];
      localStorage.setItem('vse_watchlist', JSON.stringify(next));
      return next;
    });
    const isAdded = !watchlist.includes(symbol);
    setToast({ symbol, isAdded, id: Date.now() });
    setTimeout(() => setToast(null), 1500);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = stocks;
    if (q) {
      list = stocks.filter(s =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
      );
    }
    // Sort: starred first, then by symbol
    return [...list].sort((a, b) => {
      const aStar = watchlist.includes(a.symbol) ? 0 : 1;
      const bStar = watchlist.includes(b.symbol) ? 0 : 1;
      if (aStar !== bStar) return aStar - bStar;
      return a.symbol.localeCompare(b.symbol);
    });
  }, [stocks, search, watchlist]);

  const placeholder = lang === 'zh' ? '搜索代码或名称...' : 'Search symbol or name...';

  return (
    <div className="flex flex-col h-full bg-dark-800 border-r border-dark-500 relative">
      <div className="px-3 py-2 border-b border-dark-500 text-xs text-gray-400 uppercase tracking-widest font-semibold">
        {t('marketWatch')}
      </div>

      {/* Search input */}
      <div className="px-2 py-1.5 border-b border-dark-600">
        <input
          type="text"
          className="input-dark w-full text-xs"
          placeholder={placeholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '4px 8px', fontSize: '11px' }}
        />
      </div>

      <div className="grid text-xs text-gray-500 px-2 py-1 border-b border-dark-600" style={{gridTemplateColumns:'2fr 1.5fr 1fr'}}>
        <span>{t('symbol')}</span><span className="text-right">{t('price')}</span><span className="text-right">{t('chgPct')}</span>
      </div>
      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-600 py-8 text-xs">
            {lang === 'zh' ? '未找到匹配的品种' : 'No matching symbols'}
          </div>
        ) : filtered.map(stock => {
          const prev = prevPrices.current[stock.symbol];
          const flash = prev !== undefined ? (stock.currentPrice > prev ? 'flash-up' : stock.currentPrice < prev ? 'flash-down' : '') : '';
          prevPrices.current[stock.symbol] = stock.currentPrice;
          const isUp = stock.changePct >= 0;
          const starred = watchlist.includes(stock.symbol);

          return (
            <div key={stock.symbol}
              className={`ticker-row grid items-center px-2 py-1.5 ${flash} ${selectedSymbol === stock.symbol ? 'active' : ''}`}
              style={{gridTemplateColumns:'2fr 1.5fr 1fr'}}
              onClick={() => setSelectedSymbol(stock.symbol)}>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => toggleWatchlist(stock.symbol, e)}
                  className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-xs hover:scale-110 transition-transform"
                  title={starred ? (lang === 'zh' ? '取消自选' : 'Remove from watchlist') : (lang === 'zh' ? '加入自选' : 'Add to watchlist')}>
                  {starred ? '⭐' : '☆'}
                </button>
                <div>
                  <div className="text-xs font-semibold text-white">{stock.symbol}</div>
                  <div className="text-gray-500 truncate" style={{fontSize:'9px', maxWidth:'80px'}} title={stock.name}>{stock.name}</div>
                </div>
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

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-md text-xs font-medium shadow-lg border transition-all"
          style={{
            animation: 'fadeSlide 0.2s ease',
            background: 'var(--bg-panel)',
            borderColor: toast.isAdded ? 'var(--up-color)' : 'var(--border-color)',
            color: toast.isAdded ? 'var(--up-color)' : 'var(--text-secondary)',
          }}>
          {toast.isAdded ? '⭐' : '☆'} {toast.symbol} {toast.isAdded
            ? (lang === 'zh' ? '已加入自选' : 'Added to watchlist')
            : (lang === 'zh' ? '已取消自选' : 'Removed from watchlist')}
        </div>
      )}
    </div>
  );
}

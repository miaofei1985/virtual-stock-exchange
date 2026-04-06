import React, { useMemo } from 'react';
import { useLang } from '../i18n/LanguageContext';

// Deterministic order book generation based on price
function generateBook(midPrice, spread) {
  const asks = [], bids = [];
  let askAccum = 0, bidAccum = 0;
  for (let i = 0; i < 8; i++) {
    const depth = i + 1;
    // Volume decreases with distance from mid, with some deterministic variation
    const baseVol = Math.max(50, Math.floor(2000 / (depth * 0.8)));
    const askVol = Math.floor(baseVol * (1 + (Math.sin(midPrice * 10 + i) * 0.3)));
    const bidVol = Math.floor(baseVol * (1 + (Math.cos(midPrice * 10 + i) * 0.3)));
    const askP = +(midPrice + spread * depth * 1.1).toFixed(2);
    const bidP = +(midPrice - spread * depth * 1.1).toFixed(2);
    askAccum += askVol;
    bidAccum += bidVol;
    asks.push({ price: askP, volume: askVol, total: askAccum });
    bids.push({ price: bidP, volume: bidVol, total: bidAccum });
  }
  return { asks, bids };
}

export default function OrderBook({ stock }) {
  const { t } = useLang();
  const book = useMemo(() => {
    if (!stock) return { asks: [], bids: [] };
    const spread = Math.max(stock.ask - stock.bid, 0.01);
    return generateBook((stock.bid + stock.ask) / 2, spread);
  }, [stock?.currentPrice]);

  const { asks, bids } = book;
  const maxVol = useMemo(() => Math.max(...asks.map(a => a.volume), ...bids.map(b => b.volume), 1), [asks, bids]);

  if (!stock) return null;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
      <div className="px-3 py-2 border-b text-xs uppercase tracking-widest font-semibold"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
        {t('orderBook')}
      </div>
      <div className="order-book-row py-1 border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--bg-hover)' }}>
        <span>{t('price')}</span><span className="text-right">{t('vol')}</span><span className="text-right">{t('total')}</span>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col-reverse">
        {asks.slice(0, 7).reverse().map((row, i) => (
          <div key={i} className="order-book-row relative py-0.5">
            <div className="absolute inset-0 right-auto" style={{width: `${(row.volume/maxVol)*100}%`, background: 'rgba(239,83,80,0.12)'}} />
            <span className="price-down relative z-10">{row.price.toFixed(2)}</span>
            <span className="text-right relative z-10" style={{ color: 'var(--text-primary)' }}>{row.volume.toLocaleString()}</span>
            <span className="text-right relative z-10" style={{ color: 'var(--text-muted)' }}>{row.total.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-2 py-1 border-y"
        style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-color)' }}>
        <span className="text-xs font-bold" style={{ color: 'var(--text-bright)' }}>{stock.currentPrice.toFixed(2)}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('spread')}: {(stock.ask - stock.bid).toFixed(2)}</span>
      </div>
      <div className="flex-1 overflow-hidden">
        {bids.slice(0, 7).map((row, i) => (
          <div key={i} className="order-book-row relative py-0.5">
            <div className="absolute inset-0 right-auto" style={{width: `${(row.volume/maxVol)*100}%`, background: 'rgba(38,166,154,0.12)'}} />
            <span className="price-up relative z-10">{row.price.toFixed(2)}</span>
            <span className="text-right relative z-10" style={{ color: 'var(--text-primary)' }}>{row.volume.toLocaleString()}</span>
            <span className="text-right relative z-10" style={{ color: 'var(--text-muted)' }}>{row.total.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

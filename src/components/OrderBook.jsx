import React, { useMemo } from 'react';
import { useLang } from '../i18n/LanguageContext';

function generateBook(midPrice, spread) {
  const asks = [], bids = [];
  for (let i = 0; i < 8; i++) {
    const askP = +(midPrice + spread * (i + 1) * (1 + Math.random() * 0.3)).toFixed(2);
    const bidP = +(midPrice - spread * (i + 1) * (1 + Math.random() * 0.3)).toFixed(2);
    const askVol = Math.floor(100 + Math.random() * 2000);
    const bidVol = Math.floor(100 + Math.random() * 2000);
    asks.push({ price: askP, volume: askVol });
    bids.push({ price: bidP, volume: bidVol });
  }
  asks.sort((a, b) => a.price - b.price);
  bids.sort((a, b) => b.price - a.price);
  return { asks, bids };
}

export default function OrderBook({ stock }) {
  const { t } = useLang();
  const { asks, bids } = useMemo(() => {
    if (!stock) return { asks: [], bids: [] };
    const spread = stock.ask - stock.bid;
    return generateBook((stock.bid + stock.ask) / 2, Math.max(spread, 0.01));
  }, [stock?.currentPrice]);

  const maxVol = useMemo(() => Math.max(...asks.map(a => a.volume), ...bids.map(b => b.volume)), [asks, bids]);

  if (!stock) return null;

  return (
    <div className="flex flex-col h-full bg-dark-800 border-r border-dark-500">
      <div className="px-3 py-2 border-b border-dark-500 text-xs text-gray-400 uppercase tracking-widest font-semibold">
        {t('orderBook')}
      </div>
      <div className="order-book-row text-gray-500 py-1 border-b border-dark-600">
        <span>{t('price')}</span><span className="text-right">{t('vol')}</span><span className="text-right">{t('total')}</span>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col-reverse">
        {asks.slice(0, 7).reverse().map((row, i) => (
          <div key={i} className="order-book-row relative py-0.5">
            <div className="absolute inset-0 right-auto bg-red-900/20" style={{width: `${(row.volume/maxVol)*100}%`}} />
            <span className="price-down relative z-10">{row.price.toFixed(2)}</span>
            <span className="text-right relative z-10 text-gray-300">{row.volume.toLocaleString()}</span>
            <span className="text-right relative z-10 text-gray-500">{(row.price * row.volume).toLocaleString(undefined,{maximumFractionDigits:0})}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-2 py-1 bg-dark-700 border-y border-dark-500">
        <span className="text-xs font-bold text-white">{stock.currentPrice.toFixed(2)}</span>
        <span className="text-xs text-gray-500">{t('spread')}: {(stock.ask - stock.bid).toFixed(2)}</span>
      </div>
      <div className="flex-1 overflow-hidden">
        {bids.slice(0, 7).map((row, i) => (
          <div key={i} className="order-book-row relative py-0.5">
            <div className="absolute inset-0 right-auto bg-teal-900/20" style={{width: `${(row.volume/maxVol)*100}%`}} />
            <span className="price-up relative z-10">{row.price.toFixed(2)}</span>
            <span className="text-right relative z-10 text-gray-300">{row.volume.toLocaleString()}</span>
            <span className="text-right relative z-10 text-gray-500">{(row.price * row.volume).toLocaleString(undefined,{maximumFractionDigits:0})}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

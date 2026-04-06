import React from 'react';
import { useLang } from '../i18n/LanguageContext';

export default function PendingOrders({ orders, onCancel }) {
  const { t } = useLang();
  if (orders.length === 0) return null;

  const typeLabels = {
    limit_buy: { label: t('limitBuy'), color: 'price-up' },
    limit_sell: { label: t('limitSell'), color: 'price-down' },
    stop_buy: { label: t('stopBuy'), color: 'price-up' },
    stop_sell: { label: t('stopSell'), color: 'price-down' },
  };

  return (
    <div style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
      <div className="px-3 py-1.5 text-xs uppercase tracking-widest font-semibold border-b flex items-center justify-between"
        style={{ color: 'var(--text-muted)', borderColor: 'var(--bg-hover)' }}>
        <span>{t('pendingOrders')} ({orders.length})</span>
      </div>
      <div className="max-h-40 overflow-auto">
        {orders.map(o => {
          const info = typeLabels[o.type] || { label: o.type, color: '' };
          return (
            <div key={o.id} className="flex items-center justify-between px-3 py-1.5 border-b text-xs"
              style={{ borderColor: 'var(--bg-surface)' }}>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${info.color}`}>{info.label}</span>
                <span style={{ color: 'var(--text-bright)' }} className="font-bold">{o.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{o.quantity} @ ${o.triggerPrice.toFixed(2)}</span>
                <button onClick={() => onCancel(o.id)}
                  className="price-down hover:opacity-80 px-2 py-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`${t('orderCancelled')}: ${o.type} ${o.symbol}`}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

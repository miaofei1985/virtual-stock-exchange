import React from 'react';
import { useLang } from '../i18n/LanguageContext';

export default function PendingOrders({ orders, onCancel }) {
  const { t } = useLang();
  if (orders.length === 0) return null;

  const typeLabels = {
    limit_buy: { label: t('limitBuy'), color: 'text-up' },
    limit_sell: { label: t('limitSell'), color: 'text-down' },
    stop_buy: { label: t('stopBuy'), color: 'text-up' },
    stop_sell: { label: t('stopSell'), color: 'text-down' },
  };

  return (
    <div className="border-t border-dark-500 bg-dark-800">
      <div className="px-3 py-1.5 text-xs text-gray-400 uppercase tracking-widest font-semibold border-b border-dark-600 flex items-center justify-between">
        <span>{t('pendingOrders')} ({orders.length})</span>
      </div>
      <div className="max-h-40 overflow-auto">
        {orders.map(o => {
          const info = typeLabels[o.type] || { label: o.type, color: 'text-gray-400' };
          return (
            <div key={o.id} className="flex items-center justify-between px-3 py-1.5 border-b border-dark-700 hover:bg-dark-700 text-xs">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${info.color}`}>{info.label}</span>
                <span className="text-white font-bold">{o.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-mono">{o.quantity} @ ${o.triggerPrice.toFixed(2)}</span>
                <button onClick={() => onCancel(o.id)}
                  className="text-down hover:text-red-300 px-1" title={t('orderCancelled')}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

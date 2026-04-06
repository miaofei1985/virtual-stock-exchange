import React from 'react';

const TYPE_LABELS = {
  limit_buy: { label: 'Limit Buy', color: 'text-up' },
  limit_sell: { label: 'Limit Sell', color: 'text-down' },
  stop_buy: { label: 'Stop Buy', color: 'text-up' },
  stop_sell: { label: 'Stop Sell', color: 'text-down' },
};

export default function PendingOrders({ orders, onCancel }) {
  if (orders.length === 0) return null;

  return (
    <div className="border-t border-dark-500 bg-dark-800">
      <div className="px-3 py-1.5 text-xs text-gray-400 uppercase tracking-widest font-semibold border-b border-dark-600 flex items-center justify-between">
        <span>Pending Orders ({orders.length})</span>
      </div>
      <div className="max-h-40 overflow-auto">
        {orders.map(o => {
          const info = TYPE_LABELS[o.type] || { label: o.type, color: 'text-gray-400' };
          return (
            <div key={o.id} className="flex items-center justify-between px-3 py-1.5 border-b border-dark-700 hover:bg-dark-700 text-xs">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${info.color}`}>{info.label}</span>
                <span className="text-white font-bold">{o.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-mono">{o.quantity} @ ${o.triggerPrice.toFixed(2)}</span>
                <button
                  onClick={() => onCancel(o.id)}
                  className="text-down hover:text-red-300 px-1"
                  title="Cancel order"
                >✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

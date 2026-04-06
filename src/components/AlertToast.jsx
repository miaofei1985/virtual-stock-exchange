import React from 'react';

export default function AlertToast({ alerts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {alerts.map(a => (
        <div key={a.id}
          className={`px-4 py-2.5 rounded-md text-sm font-mono font-medium shadow-xl border transition-all
            ${a.type === 'success' ? 'bg-dark-700 border-up text-up' :
              a.type === 'error' ? 'bg-dark-700 border-down text-down' :
              'bg-dark-700 border-yellow-500 text-yellow-400'}`}
          style={{animation: 'fadeSlide 0.25s ease'}}>
          {a.msg}
        </div>
      ))}
      <style>{`@keyframes fadeSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

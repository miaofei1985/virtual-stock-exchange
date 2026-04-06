import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL ||
  (window.location.protocol === 'https:' ? `wss://${window.location.host}` : `ws://${window.location.hostname}:3001`);

export function useWebSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [stocks, setStocks] = useState(null);
  const listenersRef = useRef([]);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log('📡 WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'stocks' || msg.type === 'tick') {
            setStocks(msg.data);
            listenersRef.current.forEach(fn => fn(msg.data));
          }
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        // Auto-reconnect after 3s
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    } catch {}
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const subscribe = useCallback((fn) => {
    listenersRef.current.push(fn);
    return () => { listenersRef.current = listenersRef.current.filter(l => l !== fn); };
  }, []);

  return { connected, stocks, subscribe };
}

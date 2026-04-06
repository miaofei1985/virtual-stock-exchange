import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { calcSMA, calcEMA, calcBollinger, calcRSI, calcMACD, calcVolume } from '../utils/indicators';
import { TIMEFRAMES } from '../data/stocks';

const INDICATOR_OPTIONS = ['Volume', 'SMA 20', 'EMA 9', 'EMA 21', 'Bollinger', 'RSI', 'MACD'];

export default function Chart({ stock, timeframe, setTimeframe }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const subChartRef = useRef(null);
  const seriesRefs = useRef({});
  const [indicators, setIndicators] = useState(['Volume', 'EMA 9', 'EMA 21']);
  const [crosshairData, setCrosshairData] = useState(null);

  const toggleIndicator = (ind) => {
    setIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
  };

  const buildCharts = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const h = container.clientHeight;
    const w = container.clientWidth;
    const hasSubChart = indicators.includes('RSI') || indicators.includes('MACD');

    // Cleanup
    if (chartRef.current) { try { chartRef.current.remove(); } catch {} chartRef.current = null; }
    if (subChartRef.current) { try { subChartRef.current.remove(); } catch {} subChartRef.current = null; }
    seriesRefs.current = {};

    const mainH = hasSubChart ? Math.floor(h * 0.65) : h;
    const subH = hasSubChart ? h - mainH : 0;

    const baseOpts = {
      layout: { background: { color: '#141418' }, textColor: '#888' },
      grid: { vertLines: { color: '#1e1e26' }, horzLines: { color: '#1e1e26' } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#555', style: 1 }, horzLine: { color: '#555', style: 1 } },
      rightPriceScale: { borderColor: '#2a2a35', scaleMargins: { top: 0.08, bottom: hasSubChart ? 0.05 : 0.08 } },
      timeScale: { borderColor: '#2a2a35', timeVisible: true, secondsVisible: false },
    };

    // Main chart
    const mainDiv = document.createElement('div');
    mainDiv.style.cssText = `width:${w}px;height:${mainH}px;`;
    container.appendChild(mainDiv);
    const chart = createChart(mainDiv, { ...baseOpts, width: w, height: mainH });
    chartRef.current = chart;

    const candles = stock?.history?.[timeframe];
    if (!candles || candles.length === 0) return;

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a', downColor: '#ef5350',
      borderUpColor: '#26a69a', borderDownColor: '#ef5350',
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });
    candleSeries.setData(candles);
    candleSeriesRef.current = candleSeries;

    // Volume histogram on main chart
    if (indicators.includes('Volume')) {
      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volSeries.setData(calcVolume(candles));
      seriesRefs.current['Volume'] = volSeries;
    }

    // Overlays on main chart
    if (indicators.includes('SMA 20')) {
      const s = chart.addLineSeries({ color: '#f0b90b', lineWidth: 1, priceLineVisible: false });
      s.setData(calcSMA(candles, 20));
      seriesRefs.current['SMA 20'] = s;
    }
    if (indicators.includes('EMA 9')) {
      const s = chart.addLineSeries({ color: '#2196f3', lineWidth: 1, priceLineVisible: false });
      s.setData(calcEMA(candles, 9));
      seriesRefs.current['EMA 9'] = s;
    }
    if (indicators.includes('EMA 21')) {
      const s = chart.addLineSeries({ color: '#ff9800', lineWidth: 1, priceLineVisible: false });
      s.setData(calcEMA(candles, 21));
      seriesRefs.current['EMA 21'] = s;
    }
    if (indicators.includes('Bollinger')) {
      const { upper, middle, lower } = calcBollinger(candles);
      const opts = { lineWidth: 1, priceLineVisible: false };
      const u = chart.addLineSeries({ ...opts, color: '#9c27b0' });
      const m = chart.addLineSeries({ ...opts, color: '#9c27b0', lineStyle: 2 });
      const l = chart.addLineSeries({ ...opts, color: '#9c27b0' });
      u.setData(upper); m.setData(middle); l.setData(lower);
    }

    // Crosshair
    chart.subscribeCrosshairMove(param => {
      if (!param.time) { setCrosshairData(null); return; }
      const cd = param.seriesData.get(candleSeries);
      if (cd) setCrosshairData(cd);
    });

    // Sub chart (RSI or MACD)
    if (hasSubChart && subH > 0) {
      const subDiv = document.createElement('div');
      subDiv.style.cssText = `width:${w}px;height:${subH}px;margin-top:2px;`;
      container.appendChild(subDiv);
      const subChart = createChart(subDiv, {
        ...baseOpts, width: w, height: subH,
        timeScale: { ...baseOpts.timeScale, visible: false },
        rightPriceScale: { borderColor: '#2a2a35', scaleMargins: { top: 0.1, bottom: 0.1 } },
      });
      subChartRef.current = subChart;

      if (indicators.includes('RSI')) {
        const rsiData = calcRSI(candles);
        const rsiSeries = subChart.addLineSeries({ color: '#e91e63', lineWidth: 1.5, priceLineVisible: false });
        rsiSeries.setData(rsiData);
        // OB/OS lines
        const ob = subChart.addLineSeries({ color: 'rgba(239,83,80,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false });
        const os = subChart.addLineSeries({ color: 'rgba(38,166,154,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false });
        if (rsiData.length) {
          const t0 = rsiData[0].time, t1 = rsiData[rsiData.length - 1].time;
          ob.setData([{ time: t0, value: 70 }, { time: t1, value: 70 }]);
          os.setData([{ time: t0, value: 30 }, { time: t1, value: 30 }]);
        }
      }

      if (indicators.includes('MACD')) {
        const { macdLine, signalLine, histogram } = calcMACD(candles);
        const hist = subChart.addHistogramSeries({ priceLineVisible: false });
        hist.setData(histogram);
        const ml = subChart.addLineSeries({ color: '#2196f3', lineWidth: 1.5, priceLineVisible: false });
        ml.setData(macdLine);
        const sl = subChart.addLineSeries({ color: '#ff9800', lineWidth: 1.5, priceLineVisible: false });
        sl.setData(signalLine);
      }

      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range) subChart.timeScale().setVisibleLogicalRange(range);
      });
    }

    chart.timeScale().fitContent();
  }, [stock?.symbol, timeframe, indicators]);

  useEffect(() => {
    buildCharts();
    return () => {
      if (chartRef.current) { try { chartRef.current.remove(); } catch {} chartRef.current = null; }
      if (subChartRef.current) { try { subChartRef.current.remove(); } catch {} subChartRef.current = null; }
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [buildCharts]);

  // Update last candle on price tick
  useEffect(() => {
    const candles = stock?.history?.[timeframe];
    if (!candles?.length || !candleSeriesRef.current) return;
    try { candleSeriesRef.current.update(candles[candles.length - 1]); } catch {}
  }, [stock?.currentPrice]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-dark-500 bg-dark-800 flex-shrink-0 flex-wrap">
        {/* Timeframes */}
        <div className="flex gap-1">
          {TIMEFRAMES.map(tf => (
            <button key={tf.label} className={`tab-btn ${timeframe === tf.label ? 'active' : ''}`}
              onClick={() => setTimeframe(tf.label)}>{tf.label}</button>
          ))}
        </div>
        <div className="w-px h-4 bg-dark-400 mx-1" />
        {/* Indicators */}
        <div className="flex gap-1 flex-wrap">
          {INDICATOR_OPTIONS.map(ind => (
            <button key={ind} className={`tab-btn text-xs ${indicators.includes(ind) ? 'active' : ''}`}
              onClick={() => toggleIndicator(ind)}>{ind}</button>
          ))}
        </div>
        {/* Crosshair data */}
        {crosshairData && (
          <div className="ml-auto flex gap-3 text-xs font-mono">
            <span>O: <span className={crosshairData.open <= crosshairData.close ? 'price-up' : 'price-down'}>${crosshairData.open}</span></span>
            <span>H: <span className="price-up">${crosshairData.high}</span></span>
            <span>L: <span className="price-down">${crosshairData.low}</span></span>
            <span>C: <span className={crosshairData.open <= crosshairData.close ? 'price-up' : 'price-down'}>${crosshairData.close}</span></span>
          </div>
        )}
      </div>
      {/* Chart container */}
      <div ref={containerRef} className="flex-1 overflow-hidden" style={{ minHeight: 0 }} />
    </div>
  );
}

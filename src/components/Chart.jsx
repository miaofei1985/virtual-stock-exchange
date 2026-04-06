import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { calcSMA, calcEMA, calcBollinger, calcRSI, calcMACD, calcVolume, calcATR, calcStochastic, calcVWAP } from '../utils/indicators';
import { TIMEFRAMES } from '../data/stocks';
import { useLang } from '../i18n/LanguageContext';

export default function Chart({ stock, timeframe, setTimeframe, theme }) {
  const { t } = useLang();
  const INDICATOR_OPTIONS = [
    { key: 'Volume', label: t('volume') },
    { key: 'SMA 20', label: t('sma20') },
    { key: 'EMA 9', label: t('ema9') },
    { key: 'EMA 21', label: t('ema21') },
    { key: 'Bollinger', label: t('bollinger') },
    { key: 'RSI', label: t('rsi') },
    { key: 'MACD', label: t('macd') },
    { key: 'ATR', label: t('atr') },
    { key: 'Stochastic', label: t('stochastic') },
    { key: 'VWAP', label: t('vwap') },
  ];

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const subChartRef = useRef(null);
  const seriesRefs = useRef({});
  const [indicators, setIndicators] = useState(['Volume', 'EMA 9', 'EMA 21']);
  const [crosshairData, setCrosshairData] = useState(null);
  const isDark = theme === 'dark';

  const toggleIndicator = (key) => {
    setIndicators(prev => prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]);
  };

  const colors = {
    dark: {
      bg: '#141418', text: '#888', grid: '#1e1e26', border: '#2a2a35',
      crosshair: '#555', upCandle: '#26a69a', downCandle: '#ef5350',
    },
    light: {
      bg: '#ffffff', text: '#666', grid: '#f0f0f0', border: '#e0e0e0',
      crosshair: '#aaa', upCandle: '#26a69a', downCandle: '#ef5350',
    },
  }[isDark ? 'dark' : 'light'];

  const buildCharts = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const h = container.clientHeight;
    const w = container.clientWidth;
    const hasSubChart = indicators.includes('RSI') || indicators.includes('MACD') || indicators.includes('ATR') || indicators.includes('Stochastic');

    if (chartRef.current) { try { chartRef.current.remove(); } catch {} chartRef.current = null; }
    if (subChartRef.current) { try { subChartRef.current.remove(); } catch {} subChartRef.current = null; }
    seriesRefs.current = {};

    const mainH = hasSubChart ? Math.floor(h * 0.65) : h;
    const subH = hasSubChart ? h - mainH : 0;

    const baseOpts = {
      layout: { background: { color: colors.bg }, textColor: colors.text },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      crosshair: { mode: CrosshairMode.Normal, vertLine: { color: colors.crosshair, style: 1 }, horzLine: { color: colors.crosshair, style: 1 } },
      rightPriceScale: { borderColor: colors.border, scaleMargins: { top: 0.08, bottom: hasSubChart ? 0.05 : 0.08 } },
      timeScale: { borderColor: colors.border, timeVisible: true, secondsVisible: false },
    };

    const mainDiv = document.createElement('div');
    mainDiv.style.cssText = `width:${w}px;height:${mainH}px;`;
    container.appendChild(mainDiv);
    const chart = createChart(mainDiv, { ...baseOpts, width: w, height: mainH });
    chartRef.current = chart;

    const candles = stock?.history?.[timeframe];
    if (!candles || candles.length === 0) return;

    const candleSeries = chart.addCandlestickSeries({
      upColor: colors.upCandle, downColor: colors.downCandle,
      borderUpColor: colors.upCandle, borderDownColor: colors.downCandle,
      wickUpColor: colors.upCandle, wickDownColor: colors.downCandle,
    });
    candleSeries.setData(candles);
    candleSeriesRef.current = candleSeries;

    if (indicators.includes('Volume')) {
      const volSeries = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol', scaleMargins: { top: 0.8, bottom: 0 } });
      volSeries.setData(calcVolume(candles));
      seriesRefs.current['Volume'] = volSeries;
    }
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
    if (indicators.includes('VWAP')) {
      const s = chart.addLineSeries({ color: '#e040fb', lineWidth: 1.5, lineStyle: 3, priceLineVisible: false });
      s.setData(calcVWAP(candles));
      seriesRefs.current['VWAP'] = s;
    }

    chart.subscribeCrosshairMove(param => {
      if (!param.time) { setCrosshairData(null); return; }
      const cd = param.seriesData.get(candleSeries);
      if (cd) setCrosshairData(cd);
    });

    if (hasSubChart && subH > 0) {
      const subDiv = document.createElement('div');
      subDiv.style.cssText = `width:${w}px;height:${subH}px;margin-top:2px;`;
      container.appendChild(subDiv);
      const subChart = createChart(subDiv, {
        ...baseOpts, width: w, height: subH,
        timeScale: { ...baseOpts.timeScale, visible: false },
        rightPriceScale: { borderColor: colors.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
      });
      subChartRef.current = subChart;

      if (indicators.includes('RSI')) {
        const rsiData = calcRSI(candles);
        const rsiSeries = subChart.addLineSeries({ color: '#e91e63', lineWidth: 1.5, priceLineVisible: false });
        rsiSeries.setData(rsiData);
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
      if (indicators.includes('ATR')) {
        const atrData = calcATR(candles);
        const atrSeries = subChart.addLineSeries({ color: '#00bcd4', lineWidth: 1.5, priceLineVisible: false });
        atrSeries.setData(atrData);
      }
      if (indicators.includes('Stochastic')) {
        const { kLine, dLine } = calcStochastic(candles);
        const kSeries = subChart.addLineSeries({ color: '#2196f3', lineWidth: 1.5, priceLineVisible: false });
        kSeries.setData(kLine);
        const dSeries = subChart.addLineSeries({ color: '#ff9800', lineWidth: 1.5, priceLineVisible: false });
        dSeries.setData(dLine);
        const ob = subChart.addLineSeries({ color: 'rgba(239,83,80,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false });
        const os = subChart.addLineSeries({ color: 'rgba(38,166,154,0.4)', lineWidth: 1, lineStyle: 2, priceLineVisible: false });
        if (kLine.length) {
          const t0 = kLine[0].time, t1 = kLine[kLine.length - 1].time;
          ob.setData([{ time: t0, value: 80 }, { time: t1, value: 80 }]);
          os.setData([{ time: t0, value: 20 }, { time: t1, value: 20 }]);
        }
      }

      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range) subChart.timeScale().setVisibleLogicalRange(range);
      });
    }

    chart.timeScale().fitContent();
  }, [stock?.symbol, timeframe, indicators, theme]);

  useEffect(() => {
    buildCharts();
    return () => {
      if (chartRef.current) { try { chartRef.current.remove(); } catch {} chartRef.current = null; }
      if (subChartRef.current) { try { subChartRef.current.remove(); } catch {} subChartRef.current = null; }
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [buildCharts]);

  useEffect(() => {
    const candles = stock?.history?.[timeframe];
    if (!candles?.length || !candleSeriesRef.current) return;
    try { candleSeriesRef.current.update(candles[candles.length - 1]); } catch {}
  }, [stock?.currentPrice]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-panel flex-shrink-0 flex-wrap toolbar-bg">
        <div className="flex gap-1">
          {TIMEFRAMES.map(tf => (
            <button key={tf.label} className={`tab-btn ${timeframe === tf.label ? 'active' : ''}`}
              onClick={() => setTimeframe(tf.label)}>{tf.label}</button>
          ))}
        </div>
        <div className="w-px h-4 bg-divider mx-1" />
        <div className="flex gap-1 flex-wrap">
          {INDICATOR_OPTIONS.map(ind => (
            <button key={ind.key} className={`tab-btn text-xs ${indicators.includes(ind.key) ? 'active' : ''}`}
              onClick={() => toggleIndicator(ind.key)}>{ind.label}</button>
          ))}
        </div>
        {crosshairData && (
          <div className="ml-auto flex gap-3 text-xs font-mono hidden md:flex">
            <span>{t('open')}: <span className={crosshairData.open <= crosshairData.close ? 'price-up' : 'price-down'}>${crosshairData.open}</span></span>
            <span>{t('high')}: <span className="price-up">${crosshairData.high}</span></span>
            <span>{t('low')}: <span className="price-down">${crosshairData.low}</span></span>
            <span>{t('close')}: <span className={crosshairData.open <= crosshairData.close ? 'price-up' : 'price-down'}>${crosshairData.close}</span></span>
          </div>
        )}
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" style={{ minHeight: 0 }} />
    </div>
  );
}

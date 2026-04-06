// Technical Indicators Calculator

export function calcSMA(candles, period) {
  return candles.map((c, i) => {
    if (i < period - 1) return null;
    const slice = candles.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, x) => sum + x.close, 0) / period;
    return { time: c.time, value: +avg.toFixed(4) };
  }).filter(Boolean);
}

export function calcEMA(candles, period) {
  const k = 2 / (period + 1);
  const result = [];
  let ema = candles[0]?.close || 0;
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) continue;
    if (i === period - 1) {
      ema = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
    } else {
      ema = candles[i].close * k + ema * (1 - k);
    }
    result.push({ time: candles[i].time, value: +ema.toFixed(4) });
  }
  return result;
}

export function calcBollinger(candles, period = 20, stdDev = 2) {
  const upper = [], lower = [], middle = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((s, c) => s + c.close, 0) / period;
    const variance = slice.reduce((s, c) => s + Math.pow(c.close - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    const t = candles[i].time;
    middle.push({ time: t, value: +mean.toFixed(4) });
    upper.push({ time: t, value: +(mean + stdDev * sd).toFixed(4) });
    lower.push({ time: t, value: +(mean - stdDev * sd).toFixed(4) });
  }
  return { upper, middle, lower };
}

export function calcRSI(candles, period = 14) {
  if (candles.length < period + 1) return [];
  const result = [];
  let gains = 0, losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < candles.length; i++) {
    if (i > period) {
      const diff = candles[i].close - candles[i - 1].close;
      avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = +(100 - 100 / (1 + rs)).toFixed(2);
    result.push({ time: candles[i].time, value: rsi });
  }
  return result;
}

export function calcMACD(candles, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(candles, fast);
  const emaSlow = calcEMA(candles, slow);
  const startIdx = slow - 1;
  const macdLine = [];

  for (let i = 0; i < emaSlow.length; i++) {
    const fastVal = emaFast[emaFast.length - emaSlow.length + i];
    if (!fastVal) continue;
    macdLine.push({ time: emaSlow[i].time, value: +(fastVal.value - emaSlow[i].value).toFixed(4) });
  }

  const k = 2 / (signal + 1);
  const signalLine = [];
  let sigEma = macdLine.slice(0, signal).reduce((s, c) => s + c.value, 0) / signal;
  const histogram = [];

  for (let i = 0; i < macdLine.length; i++) {
    if (i < signal - 1) continue;
    if (i === signal - 1) {
      sigEma = macdLine.slice(0, signal).reduce((s, c) => s + c.value, 0) / signal;
    } else {
      sigEma = macdLine[i].value * k + sigEma * (1 - k);
    }
    signalLine.push({ time: macdLine[i].time, value: +sigEma.toFixed(4) });
    histogram.push({ time: macdLine[i].time, value: +(macdLine[i].value - sigEma).toFixed(4), color: macdLine[i].value >= sigEma ? '#26a69a' : '#ef5350' });
  }
  return { macdLine, signalLine, histogram };
}

export function calcVolume(candles) {
  return candles.map(c => ({
    time: c.time,
    value: c.volume,
    color: c.close >= c.open ? 'rgba(38,166,154,0.6)' : 'rgba(239,83,80,0.6)',
  }));
}

// Average True Range
export function calcATR(candles, period = 14) {
  if (candles.length < period + 1) return [];
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], prev = candles[i - 1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close)));
  }
  const result = [];
  let atr = trs.slice(0, period).reduce((s, v) => s + v, 0) / period;
  result.push({ time: candles[period].time, value: +atr.toFixed(4) });
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    result.push({ time: candles[i + 1].time, value: +atr.toFixed(4) });
  }
  return result;
}

// Stochastic Oscillator (%K, %D)
export function calcStochastic(candles, kPeriod = 14, dPeriod = 3) {
  if (candles.length < kPeriod) return { kLine: [], dLine: [] };
  const kLine = [];
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(c => c.high));
    const low = Math.min(...slice.map(c => c.low));
    const k = high === low ? 50 : ((candles[i].close - low) / (high - low)) * 100;
    kLine.push({ time: candles[i].time, value: +k.toFixed(2) });
  }
  const dLine = [];
  for (let i = dPeriod - 1; i < kLine.length; i++) {
    const avg = kLine.slice(i - dPeriod + 1, i + 1).reduce((s, p) => s + p.value, 0) / dPeriod;
    dLine.push({ time: kLine[i].time, value: +avg.toFixed(2) });
  }
  return { kLine, dLine };
}

// Volume Weighted Average Price
export function calcVWAP(candles) {
  let cumTPV = 0, cumVol = 0;
  return candles.map(c => {
    const tp = (c.high + c.low + c.close) / 3;
    cumTPV += tp * c.volume;
    cumVol += c.volume;
    return { time: c.time, value: cumVol === 0 ? tp : +(cumTPV / cumVol).toFixed(4) };
  });
}

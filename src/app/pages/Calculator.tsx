import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const card = { background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '1rem' };

export function Calculator() {
  const [balance, setBalance] = useState('10000');
  const [risk, setRisk] = useState('1');
  const [entry, setEntry] = useState('96450');
  const [sl, setSl] = useState('95200');
  const [tp, setTp] = useState('98800');

  const calc = useMemo(() => {
    const b = parseFloat(balance) || 0;
    const r = parseFloat(risk) || 0;
    const e = parseFloat(entry) || 0;
    const s = parseFloat(sl) || 0;
    const t = parseFloat(tp) || 0;
    if (!b || !r || !e || !s || !t || e === s) return null;

    const riskAmount = b * (r / 100);
    const riskPerUnit = Math.abs(e - s);
    const positionSize = riskAmount / riskPerUnit;
    const rewardPerUnit = Math.abs(t - e);
    const rrRatio = rewardPerUnit / riskPerUnit;
    const potentialProfit = positionSize * rewardPerUnit;

    return { riskAmount, positionSize, rrRatio, potentialProfit };
  }, [balance, risk, entry, sl, tp]);

  const rrGood = (calc?.rrRatio ?? 0) >= 2;

  const inputStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--bg-border)',
    color: 'var(--text-primary)',
    borderRadius: '0.5rem',
  };

  return (
    <div className="p-4 md:p-6 max-w-[700px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="mb-6 text-center">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Position Size Calculator</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Calculate your exact position size, risk, and potential profit</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inputs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.06 }}
          className="p-5 rounded-2xl" style={card}>
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Trade inputs</p>
          <div className="space-y-4">
            {[
              { label: 'Account balance ($)', value: balance, set: setBalance, prefix: '$' },
              { label: 'Risk per trade (%)', value: risk, set: setRisk, prefix: '%' },
              { label: 'Entry price', value: entry, set: setEntry, prefix: '' },
              { label: 'Stop loss', value: sl, set: setSl, prefix: '' },
              { label: 'Take profit', value: tp, set: setTp, prefix: '' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                <div className="relative">
                  {f.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{f.prefix}</span>
                  )}
                  <input
                    type="number"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    className="w-full py-2.5 rounded-lg text-sm font-mono outline-none"
                    style={{ ...inputStyle, paddingLeft: f.prefix ? '1.75rem' : '0.75rem', paddingRight: '0.75rem' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.12 }}
          className="flex flex-col gap-3">
          {/* Max risk */}
          <div className="p-4 rounded-2xl" style={{ ...card, borderTop: '3px solid var(--g-danger)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Max risk amount</p>
            <p className="font-mono font-bold text-2xl" style={{ color: 'var(--g-danger)' }}>
              ${calc ? calc.riskAmount.toFixed(2) : '—'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {risk}% of ${parseFloat(balance || '0').toLocaleString()}
            </p>
          </div>

          {/* Position size */}
          <div className="p-4 rounded-2xl" style={{ ...card, borderTop: '3px solid var(--gold)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Position size</p>
            <p className="font-mono font-bold text-2xl" style={{ color: 'var(--gold)' }}>
              {calc ? calc.positionSize.toFixed(4) : '—'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>units to buy/sell</p>
          </div>

          {/* R:R + Profit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl" style={card}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>R:R Ratio</p>
              <p className="font-mono font-bold text-xl" style={{ color: calc ? (rrGood ? 'var(--g-success)' : 'var(--g-danger)') : 'var(--text-muted)' }}>
                {calc ? `${calc.rrRatio.toFixed(1)}R` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-2xl" style={card}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Potential profit</p>
              <p className="font-mono font-bold text-xl" style={{ color: 'var(--g-success)' }}>
                {calc ? `$${calc.potentialProfit.toFixed(2)}` : '—'}
              </p>
            </div>
          </div>

          {/* Verdict */}
          {calc && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}
              className="p-4 rounded-2xl flex items-start gap-3"
              style={{
                background: rrGood ? 'var(--g-success-muted)' : 'var(--g-danger-muted)',
                border: `1px solid ${rrGood ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
                borderRadius: '1rem',
              }}>
              {rrGood
                ? <CheckCircle size={18} style={{ color: 'var(--g-success)', flexShrink: 0 }} />
                : <AlertTriangle size={18} style={{ color: 'var(--g-danger)', flexShrink: 0 }} />
              }
              <div>
                <p className="text-sm font-semibold" style={{ color: rrGood ? 'var(--g-success)' : 'var(--g-danger)' }}>
                  {rrGood ? 'Good risk management' : 'Poor R:R ratio'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {rrGood
                    ? 'This trade meets the 2R minimum. Acceptable to take.'
                    : `R:R is ${calc.rrRatio.toFixed(1)}R. Minimum recommended is 2R.`}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

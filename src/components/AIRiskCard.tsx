import React from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { MineProfile } from '../lib/aiClient';
import { deterministicKeyFactors, deterministicTrendDirection } from '../lib/mineProfile';
import { riskBandTone, RiskBand } from '../lib/riskEngine';

interface AIRiskCardProps {
  profile: MineProfile;
  onViewFullAnalysis: () => void;
  compact?: boolean;
}

export const AIRiskCard: React.FC<AIRiskCardProps> = ({ profile, onViewFullAnalysis, compact = false }) => {
  const band = (profile.riskBand.charAt(0) + profile.riskBand.slice(1).toLowerCase()) as RiskBand;
  const tone = riskBandTone(band);
  const factors = deterministicKeyFactors(profile);
  const trendDir = deterministicTrendDirection(profile);

  return (
    <div className={`bg-white border ${tone.border} rounded-lg shadow-2xs overflow-hidden`}>
      <div className={`px-3 py-2 flex items-center justify-between bg-emerald-50 border-b ${tone.border}`}>
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#0B6B4A]" />
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">AI Risk Assessment</span>
        </div>
        <span className="text-[9px] font-mono text-slate-400">MineMitra AI</span>
      </div>
      <div className="p-3 space-y-2.5">
        <div>
          <div className="text-xs font-bold text-slate-900 truncate">{profile.mine}</div>
          <div className="text-[10px] text-slate-400 font-mono">{profile.subsidiary}</div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-extrabold text-slate-900">{profile.riskScore}</span>
            <span className="text-xs text-slate-400"> /100</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tone.bg} ${tone.text} ${tone.border}`}>{band}</span>
        </div>

        <div className="flex items-center space-x-1 text-[10px] font-semibold">
          {trendDir === 'up' && <><TrendingUp className="w-3 h-3 text-red-600" /><span className="text-red-600">Increasing Risk</span></>}
          {trendDir === 'down' && <><TrendingDown className="w-3 h-3 text-emerald-600" /><span className="text-emerald-600">Decreasing Risk</span></>}
          {trendDir === 'flat' && <><Minus className="w-3 h-3 text-slate-400" /><span className="text-slate-500">Stable</span></>}
        </div>

        {!compact && (
          <div className="pt-1.5 border-t border-slate-100">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Key Factors — Point Breakdown</div>
            <ul className="space-y-0.5">
              {factors.map((f) => (
                <li key={f.label} className="text-[11px] text-slate-600 flex items-start justify-between space-x-1.5">
                  <span className="flex items-start space-x-1 min-w-0">
                    <span className="text-slate-300 mt-0.5 shrink-0">•</span>
                    <span className="truncate">{f.label}</span>
                  </span>
                  {f.points > 0 && (
                    <span className="shrink-0 font-mono font-bold text-[10px] text-amber-700">+{f.points % 1 === 0 ? f.points : f.points.toFixed(1)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onViewFullAnalysis}
          className="w-full mt-1 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-bold rounded-md flex items-center justify-center space-x-1"
        >
          <span>View Full Analysis</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

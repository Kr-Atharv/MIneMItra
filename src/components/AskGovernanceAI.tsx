import React, { useState } from 'react';
import { Sparkles, Send, Loader2, MessageCircleQuestion, Clock } from 'lucide-react';
import { useGovernance } from '../context/GovernanceContext';
import { buildGroundedContext } from '../lib/dutyContext';
import { askGovernanceAi, AskAiResult, isRateLimited, RATE_LIMIT_MESSAGE } from '../lib/aiClient';
import { useAiQueueLength } from '../lib/aiRequestQueue';

// Step 4: shown for every role, ahead of the role-specific suggestions,
// so "What's my duty today?" is the one question every officer can ask
// from either the typing (4a) or voice (4b) assistant.
export const DUTY_QUESTION = "What's my duty today?";

export const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  corporate_director: [
    'Which mines currently have the highest compliance risk?',
    'Which subsidiary has the most overdue corrective actions?',
    'Which mines have declining compliance?'
  ],
  audit_compliance_officer: [
    'Which statutory items are currently overdue?',
    'Which mines currently have the highest compliance risk?'
  ],
  field_inspector: ['Why is my assigned mine classified at its current risk level?'],
  safety_officer: ['Why is my mine classified at its current risk level?'],
  maintenance_officer: ['Why is my mine classified at its current risk level?']
};

interface ChatEntry {
  question: string;
  result: AskAiResult;
}

export const AskGovernanceAI: React.FC = () => {
  const { currentRole, activeRoleProfile, complaints, filteredComplaintsForRole } = useGovernance();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const queueLength = useAiQueueLength();

  const roleLabel = currentRole.replace(/_/g, ' ');
  const suggestions = [DUTY_QUESTION, ...(SUGGESTED_QUESTIONS[currentRole] || [])];

  const ask = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    const context = buildGroundedContext(currentRole, activeRoleProfile.mineId, complaints, filteredComplaintsForRole);
    const result = await askGovernanceAi(q.trim(), context, roleLabel);
    setHistory((prev) => [...prev, { question: q.trim(), result }]);
    setQuestion('');
    setLoading(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center space-x-2">
        <MessageCircleQuestion className="w-4 h-4 text-[#0B6B4A]" />
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Ask Governance AI</h3>
        <span className="text-[9px] font-mono text-slate-400 ml-auto">MineMitra AI • scoped to your role</span>
      </div>
      <div className="p-4 space-y-3">
        {history.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-[#0B6B4A] hover:bg-emerald-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {history.map((entry, i) => (
            <div key={i} className="space-y-1.5">
              <div className="text-[12px] font-semibold text-slate-800 flex items-start space-x-1.5">
                <span className="text-slate-400">Q:</span>
                <span>{entry.question}</span>
              </div>
              <div className="text-[12px] text-slate-700 bg-slate-50 border border-slate-200 rounded p-2.5 flex items-start space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p>{entry.result.answer}</p>
                  {entry.result.degraded && isRateLimited(entry.result.degradedReason) && (
                    <p className="text-amber-600 text-[10px] mt-1 font-semibold flex items-center space-x-1">
                      <Clock className="w-3 h-3" /><span>{RATE_LIMIT_MESSAGE}</span>
                    </p>
                  )}
                  {entry.result.degraded && !isRateLimited(entry.result.degradedReason) && (
                    <p className="text-amber-600 text-[10px] mt-1 font-semibold">AI temporarily unavailable — this may be a fallback response.</p>
                  )}
                  {entry.result.citedData.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {entry.result.citedData.map((c, j) => (
                        <span key={j} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask(question)}
            placeholder={`Ask about ${currentRole === 'corporate_director' ? 'mines, subsidiaries or risk trends' : 'your mine\'s data'}...`}
            disabled={loading}
            className="flex-1 text-xs border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#004D40]"
          />
          <button
            onClick={() => ask(question)}
            disabled={loading || !question.trim()}
            className="px-3 py-2 bg-[#004D40] hover:bg-[#00382E] disabled:opacity-40 text-white rounded"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {loading && queueLength > 0 && (
          <p className="text-[10px] text-slate-400 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Waiting for {queueLength} other AI request{queueLength > 1 ? 's' : ''} ahead of this one...</span>
          </p>
        )}
      </div>
    </div>
  );
};

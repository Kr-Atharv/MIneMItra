import React, { useEffect, useRef, useState } from 'react';
import { Bot, Mic, MicOff, X, Volume2, Send, Loader2, Clock, Sparkles, AlertTriangle, Languages } from 'lucide-react';
import { useGovernance } from '../context/GovernanceContext';
import { buildGroundedContext } from '../lib/dutyContext';
import { askGovernanceAi, AskAiResult, isRateLimited, RATE_LIMIT_MESSAGE } from '../lib/aiClient';
import { useAiQueueLength } from '../lib/aiRequestQueue';
import { DUTY_QUESTION } from './AskGovernanceAI';

/**
 * Step 4b — a robot-styled voice assistant, distinct from the typing
 * chatbot (4a / AskGovernanceAI.tsx) only in *how* a question gets asked.
 * It calls the exact same askGovernanceAi() pipeline — no second AI call
 * path — and is strictly read-only/answer-only: it never creates,
 * assigns, or resolves anything. All actions still go through the
 * existing UI buttons (human-in-the-loop, consistent with the rest of
 * the app).
 *
 * Uses the browser's native Web Speech API (SpeechRecognition for
 * voice-to-text, SpeechSynthesisUtterance for spoken replies) — free, no
 * API key, no backend dependency. Feature-detected: on unsupported
 * browsers (Safari/non-Chromium) the mic is hidden entirely and the panel
 * falls back to text-only.
 *
 * Step 6 fixes:
 *  - The mic previously died silently on the second tap (calling
 *    `.start()` on a recognizer that's already running throws
 *    InvalidStateError, which was uncaught) and gave no feedback on
 *    permission-denied / no-speech / insecure-origin failures — it just
 *    looked "not listening". Every failure path now surfaces a clear
 *    message and always resets state cleanly.
 *  - Added an English/Hindi toggle that drives BOTH the recognizer's
 *    `lang` (listening) and the synthesis utterance's `lang` + matching
 *    voice (speaking), instead of the hardcoded 'en-IN'.
 */

// The Web Speech API isn't in TypeScript's default DOM lib, and its shape
// varies slightly (prefixed vs unprefixed) — a small local, deliberately
// loose type is simpler and safer here than pulling in a third-party
// @types package for a handful of fields.
interface MinimalSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getSpeechRecognitionCtor(): (new () => MinimalSpeechRecognition) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

type VoiceLanguage = 'en-IN' | 'hi-IN';

const LANGUAGE_LABEL: Record<VoiceLanguage, string> = {
  'en-IN': 'English',
  'hi-IN': 'हिंदी'
};

const UI_TEXT: Record<
  VoiceLanguage,
  {
    placeholder: string;
    listening: string;
    micTitleOn: string;
    micTitleOff: string;
    permissionDenied: string;
    noSpeech: string;
    genericError: string;
    insecure: string;
    noMic: string;
    network: string;
    notSupported: string;
  }
> = {
  'en-IN': {
    placeholder: 'Type or use the mic...',
    listening: 'Listening…',
    micTitleOn: 'Stop listening',
    micTitleOff: 'Ask by voice',
    permissionDenied: "Microphone permission denied — allow mic access in your browser's site settings, then try again.",
    noSpeech: 'No speech detected — try again.',
    genericError: 'Voice recognition failed — please try again.',
    insecure: 'Voice input needs a secure (https) connection.',
    noMic: 'No microphone found — check that one is connected and not muted.',
    network: "Couldn't reach the voice recognition service — check your internet connection and try again.",
    notSupported: 'This browser cannot recognize speech in the selected language.'
  },
  'hi-IN': {
    placeholder: 'टाइप करें या माइक का उपयोग करें...',
    listening: 'सुन रहा हूँ…',
    micTitleOn: 'सुनना बंद करें',
    micTitleOff: 'आवाज़ से पूछें',
    permissionDenied: 'माइक्रोफ़ोन की अनुमति नहीं मिली — ब्राउज़र सेटिंग्स में माइक एक्सेस दें और फिर प्रयास करें।',
    noSpeech: 'कोई आवाज़ नहीं मिली — फिर से प्रयास करें।',
    genericError: 'आवाज़ पहचान विफल रही — कृपया फिर से प्रयास करें।',
    insecure: 'आवाज़ इनपुट के लिए सुरक्षित (https) कनेक्शन ज़रूरी है।',
    noMic: 'कोई माइक्रोफ़ोन नहीं मिला — जांचें कि वह कनेक्ट है और म्यूट नहीं है।',
    network: 'आवाज़ पहचान सेवा तक नहीं पहुंच सका — अपना इंटरनेट कनेक्शन जांचें और फिर प्रयास करें।',
    notSupported: 'यह ब्राउज़र चुनी गई भाषा में आवाज़ पहचान नहीं सकता।'
  }
};

interface VoiceEntry {
  question: string;
  result: AskAiResult;
}

export const DutyVoiceAssistant: React.FC = () => {
  const { currentRole, activeRoleProfile, complaints, filteredComplaintsForRole } = useGovernance();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [language, setLanguage] = useState<VoiceLanguage>('en-IN');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<VoiceEntry[]>([]);
  const queueLength = useAiQueueLength();
  const t = UI_TEXT[language];

  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const isStartingRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const speechSupported = typeof window !== 'undefined' && Boolean(getSpeechRecognitionCtor());
  const synthesisSupported = isSpeechSynthesisSupported();
  // Web Speech API (both recognition and synthesis) only works on secure
  // origins — surfacing this up front avoids a confusing silent failure.
  const isSecureContext = typeof window === 'undefined' || window.isSecureContext !== false;

  useEffect(() => {
    if (!synthesisSupported) return;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [synthesisSupported]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (synthesisSupported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickVoiceFor = (lang: VoiceLanguage): SpeechSynthesisVoice | undefined => {
    const voices = voicesRef.current;
    if (!voices.length) return undefined;
    // Exact match first (e.g. "hi-IN"), then a loose language-family match
    // (e.g. any "hi-*") — many desktop browsers only ship "hi-IN" while
    // some Android builds expose slightly different region codes.
    const exact = voices.find((v) => v.lang === lang);
    if (exact) return exact;
    const family = lang.split('-')[0];
    return voices.find((v) => v.lang?.toLowerCase().startsWith(family));
  };

  const speak = (text: string) => {
    if (!synthesisSupported) return;
    // Mine sites are noisy and audio alone isn't reliable, so the answer
    // is always shown as text too (also matters for accessibility) — see
    // the history render below.
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.lang = language;
    const voice = pickVoiceFor(language);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    setMicError(null);
    setLoading(true);
    const roleLabel = currentRole.replace(/_/g, ' ');
    const context = buildGroundedContext(currentRole, activeRoleProfile.mineId, complaints, filteredComplaintsForRole);
    const result = await askGovernanceAi(question.trim(), context, roleLabel);
    setHistory((prev) => [...prev, { question: question.trim(), result }]);
    setTextInput('');
    setLoading(false);
    speak(result.answer);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    isStartingRef.current = false;
  };

  const startListening = async () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    // Guards the bug that made the mic look "dead": calling start() while
    // a recognizer instance is already starting/running throws
    // InvalidStateError, which silently aborted the whole flow with no
    // user-visible feedback. Stop any live instance first and use a
    // starting-flag so rapid double-taps can't race.
    if (isListening || isStartingRef.current) return;
    if (!isSecureContext) {
      setMicError(t.insecure);
      return;
    }
    recognitionRef.current?.abort();
    setMicError(null);
    isStartingRef.current = true;

    // Pre-flight mic permission/device check via getUserMedia. This is
    // what actually explains the "listens for an instant then fails"
    // symptom: SpeechRecognition's own onerror only reports a terse code
    // (often just 'network' or 'audio-capture' with no detail), while
    // getUserMedia's rejection tells us plainly whether it's a missing
    // device, a blocked permission, or the mic being used elsewhere — so
    // we check that FIRST and stop immediately after, before ever
    // starting recognition.
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        isStartingRef.current = false;
        setIsListening(false);
        const name = err?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setMicError(t.permissionDenied);
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setMicError(t.noMic);
        } else if (name === 'NotReadableError') {
          setMicError(`${t.noMic} (${name}: mic may be in use by another app)`);
        } else {
          setMicError(`${t.genericError} (${name || 'mic check failed'})`);
        }
        return;
      }
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;
    recognition.onstart = () => {
      isStartingRef.current = false;
      setIsListening(true);
    };
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript;
      if (transcript) void ask(transcript);
    };
    recognition.onerror = (event: any) => {
      isStartingRef.current = false;
      setIsListening(false);
      const code = event?.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        setMicError(t.permissionDenied);
      } else if (code === 'no-speech') {
        setMicError(t.noSpeech);
      } else if (code === 'audio-capture') {
        setMicError(t.noMic);
      } else if (code === 'network') {
        setMicError(t.network);
      } else if (code === 'language-not-supported' || code === 'bad-grammar') {
        setMicError(t.notSupported);
      } else if (code !== 'aborted') {
        // Unknown/undocumented code — show it rather than hiding it, so
        // a real cause is never masked behind a generic message again.
        setMicError(`${t.genericError} (${code || 'unknown error'})`);
      }
    };
    recognition.onend = () => {
      isStartingRef.current = false;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err: any) {
      // start() throws synchronously if the browser thinks a session is
      // still active — surface it instead of leaving the mic looking
      // unresponsive.
      isStartingRef.current = false;
      setIsListening(false);
      setMicError(`${t.genericError} (${err?.name || 'start() threw'})`);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end space-y-3">
      {isOpen && (
        <div className="w-[calc(100vw-2.5rem)] max-w-sm bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
          <div className="px-3.5 py-2.5 bg-[#004D40] text-white flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <Bot className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wide truncate">Duty Assistant</span>
              {!speechSupported && (
                <span className="text-[9px] bg-white/15 px-1.5 py-0.5 rounded shrink-0">Text-only on this browser</span>
              )}
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              {speechSupported && (
                <button
                  onClick={() => setLanguage((l) => (l === 'en-IN' ? 'hi-IN' : 'en-IN'))}
                  disabled={loading || isListening}
                  className="flex items-center space-x-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 rounded px-1.5 py-1 disabled:opacity-40"
                  title="Switch voice language"
                >
                  <Languages className="w-3 h-3" />
                  <span>{LANGUAGE_LABEL[language]}</span>
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 rounded p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
            {history.length === 0 && (
              <button
                onClick={() => ask(DUTY_QUESTION)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-[#0B6B4A] hover:bg-emerald-50"
              >
                {DUTY_QUESTION}
              </button>
            )}
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
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{queueLength > 0 ? `Waiting for ${queueLength} other request${queueLength > 1 ? 's' : ''}...` : 'Thinking...'}</span>
              </div>
            )}
            {isListening && (
              <div className="flex items-center space-x-2 text-[11px] text-emerald-700 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <span>{t.listening}</span>
              </div>
            )}
            {micError && (
              <div className="flex items-start space-x-1.5 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded p-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{micError}</span>
              </div>
            )}
          </div>

          <div className="p-2.5 border-t border-slate-100 flex items-center space-x-2">
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask(textInput)}
              placeholder={t.placeholder}
              disabled={loading}
              className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#004D40]"
            />
            {speechSupported && (
              <button
                onClick={() => (isListening ? stopListening() : startListening())}
                disabled={loading}
                className={`shrink-0 p-1.5 rounded ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title={isListening ? t.micTitleOn : t.micTitleOff}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={() => ask(textInput)}
              disabled={loading || !textInput.trim()}
              className="shrink-0 p-1.5 rounded bg-[#004D40] hover:bg-[#00382E] disabled:opacity-40 text-white"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="px-2.5 pb-2 text-[9px] text-slate-400 flex items-center space-x-1">
            <Volume2 className="w-2.5 h-2.5" />
            <span>Answer-only — this assistant never files, assigns, or resolves anything by voice.</span>
          </div>
        </div>
      )}

      {/* Robot avatar toggle — small/collapsed by default so it doesn't
          compete with the sidebar's "Ask Governance AI" card. Swaps to a
          mic glyph with a listening ring + label while capturing speech,
          so the "is it actually listening" state is visible at a glance. */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-12 h-12 rounded-full bg-[#0B6B4A] hover:bg-[#0B6B4A]/90 text-white shadow-lg flex items-center justify-center"
        title="Duty Assistant"
      >
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
            <span className="absolute -inset-1.5 rounded-full border-2 border-emerald-400 animate-pulse" />
            <span className="absolute -top-7 right-0 whitespace-nowrap text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded shadow">
              {t.listening}
            </span>
          </>
        )}
        {isListening ? <Mic className="w-5 h-5 relative animate-pulse" /> : <Bot className="w-5 h-5 relative" />}
      </button>
    </div>
  );
};

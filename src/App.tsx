import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy, Check, RefreshCw, Mail,
  Sparkles, History, X, Clock, Eye, EyeOff,
  ChevronRight, Trash2, Globe, MessageSquareText,
  AlertCircle,
} from 'lucide-react';
import { rewriteEmail, Tone, EmailResult } from './services/claudeService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Types ──────────────────────────────────────────────────────────────────

interface HistoryItem {
  id: string;
  original: string;
  subject: string;
  body: string;
  tone: Tone;
  language: 'ko' | 'en';
  timestamp: number;
}

// ── Storage helpers ────────────────────────────────────────────────────────

const HISTORY_KEY = 'email-rewriter-history-v2';
const API_KEY_STORAGE = 'email-rewriter-api-key';

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch { return []; }
}

function saveHistory(history: HistoryItem[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* noop */ }
}

function loadApiKey(): string {
  try { return localStorage.getItem(API_KEY_STORAGE) ?? ''; } catch { return ''; }
}

function saveApiKey(key: string) {
  try { localStorage.setItem(API_KEY_STORAGE, key); } catch { /* noop */ }
}

// ── Tone config ────────────────────────────────────────────────────────────

const TONES: { value: Tone; emoji: string; label: string; desc: string }[] = [
  { value: 'formal',     emoji: '🎩', label: '정중한',     desc: '상사·외부 업체에 적합한 격식 말투' },
  { value: 'soft',       emoji: '🌸', label: '부드러운',   desc: '배려가 느껴지는 따뜻한 말투' },
  { value: 'concise',    emoji: '⚡', label: '간결한',     desc: '핵심만 짧고 명확하게' },
  { value: 'friendly',   emoji: '😊', label: '친근한',     desc: '편안하고 따뜻한 동료 말투' },
  { value: 'casual',     emoji: '💬', label: '캐주얼',     desc: '격식을 덜 차린 편안한 말투' },
  { value: 'persuasive', emoji: '🎯', label: '설득력 있는', desc: '논리적이고 행동을 이끄는 말투' },
];

// ── Copy hook ──────────────────────────────────────────────────────────────

function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    }).catch(() => alert('클립보드 복사에 실패했습니다.'));
  }, [timeout]);
  return { copied, copy };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CopyButton({ text, size = 'sm' }: { text: string; size?: 'sm' | 'xs' }) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={() => copy(text)}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border transition-all font-semibold',
        size === 'sm'
          ? 'px-3 py-1.5 text-xs'
          : 'px-2 py-1 text-[10px]',
        copied
          ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
          : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600',
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? '복사됨' : '복사'}
    </button>
  );
}

function ToneCard({
  tone,
  selected,
  onClick,
}: {
  tone: typeof TONES[0];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150 group',
        selected
          ? 'border-indigo-500 bg-indigo-50/60 shadow-sm shadow-indigo-100'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none mt-0.5">{tone.emoji}</span>
        <div className="min-w-0">
          <p className={cn('text-sm font-bold leading-tight', selected ? 'text-indigo-700' : 'text-slate-800')}>
            {tone.label}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">{tone.desc}</p>
        </div>
        {selected && (
          <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
        )}
      </div>
    </button>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  // State
  const [apiKey, setApiKey] = useState(loadApiKey);
  const [showKey, setShowKey] = useState(false);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<EmailResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tone, setTone] = useState<Tone>('formal');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Persist
  useEffect(() => { saveHistory(history); }, [history]);
  useEffect(() => { if (apiKey) saveApiKey(apiKey); }, [apiKey]);

  // Handle rewrite
  const handleRewrite = async () => {
    if (!input.trim() || isLoading) return;
    if (!apiKey.trim()) { setError('Anthropic API Key를 먼저 입력해주세요.'); return; }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const emailResult = await rewriteEmail(apiKey, input, { tone, language });
      setResult(emailResult);

      const newItem: HistoryItem = {
        id: Math.random().toString(36).slice(2),
        original: input,
        subject: emailResult.subject,
        body: emailResult.body,
        tone,
        language,
        timestamp: Date.now(),
      };
      setHistory(prev => [newItem, ...prev].slice(0, 20));

      // Scroll to result
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRewrite();
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInput(item.original);
    setResult({ subject: item.subject, body: item.body });
    setTone(item.tone);
    setLanguage(item.language);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const toneLabel = TONES.find(t => t.value === tone);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-20">

        {/* ── Header ──────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200/60">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                직장인 메일 비서
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                보내기 전에 이거 돌리면 메일 퀄리티 달라집니다
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-xl border border-transparent hover:border-slate-200 transition-all"
              aria-label="히스토리"
            >
              <History className="w-5 h-5" />
              {history.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-white" />
              )}
            </button>
          </div>
        </motion.header>

        {/* ── API Key ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={cn(
                'w-2 h-2 rounded-full transition-colors',
                apiKey.startsWith('AIza') ? 'bg-emerald-400 shadow-sm shadow-emerald-200' : 'bg-slate-300'
              )} />
            </div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex-shrink-0">
              API Key
            </label>
            <div className="flex-1 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 pr-10 text-sm font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-xs text-indigo-500 hover:text-indigo-700 font-semibold underline underline-offset-2 transition-colors"
            >
              키 발급 →
            </a>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 ml-5">
            🔒 API Key는 브라우저에만 저장되며 외부 서버로 전송되지 않습니다.
          </p>
        </motion.div>

        {/* ── Main grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left: Input + Output */}
          <div className="lg:col-span-8 space-y-5">

            {/* Input card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <MessageSquareText className="w-4 h-4 text-slate-400" />
                  원문 입력
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  {(['ko', 'en'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        'px-3 py-1 text-xs font-bold rounded-md transition-all',
                        language === lang
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600',
                      )}
                    >
                      <Globe className="w-3 h-3 inline mr-1 opacity-70" />
                      {lang === 'ko' ? '한국어' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={"다듬고 싶은 내용을 자유롭게 적어주세요.\n\n예) 내일 3시 회의 가능한지 확인해주세요. 장소는 2층 회의실이고 30분 정도 걸릴 것 같습니다."}
                className="w-full h-44 px-5 py-4 text-[15px] text-slate-700 placeholder:text-slate-300 focus:outline-none resize-y leading-relaxed bg-transparent"
              />

              {/* Card footer */}
              <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {input.length > 0 ? `${input.length}자` : '⌘ + Enter로 빠르게 변환'}
                </span>
                <button
                  onClick={handleRewrite}
                  disabled={!input.trim() || isLoading || !apiKey.trim()}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
                    (!input.trim() || isLoading || !apiKey.trim())
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200/60 hover:shadow-lg hover:shadow-indigo-200/80 hover:scale-[1.02] active:scale-[0.98]',
                  )}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      변환 중…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      비즈니스 메일로 변환
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 text-red-700 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Output */}
            <AnimatePresence>
              {result && (
                <motion.div
                  ref={resultRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="bg-white/90 backdrop-blur-sm border border-indigo-100 rounded-2xl overflow-hidden shadow-md shadow-indigo-100/30"
                >
                  {/* Result header */}
                  <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-50/80 to-violet-50/80 border-b border-indigo-100/60">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200" />
                      <span className="text-sm font-bold text-indigo-700">변환 완료</span>
                      <span className="text-xs text-indigo-400 bg-indigo-100/80 px-2 py-0.5 rounded-full font-medium">
                        {toneLabel?.emoji} {toneLabel?.label}
                      </span>
                    </div>
                    <CopyButton text={`제목: ${result.subject}\n\n${result.body}`} />
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Subject */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">📌 제목</p>
                        <CopyButton text={result.subject} size="xs" />
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[15px] font-semibold text-slate-800 leading-snug">
                        {result.subject}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-dashed border-slate-200" />

                    {/* Body */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">📄 본문</p>
                        <CopyButton text={result.body} size="xs" />
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {result.body}
                      </div>
                    </div>
                  </div>

                  {/* Footer: send hint */}
                  <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      💡 본문을 복사해 메일 앱에 바로 붙여넣기 하세요
                    </p>
                    <button
                      onClick={() => { setInput(''); setResult(null); setError(''); inputRef.current?.focus(); }}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 font-semibold transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> 새로 작성
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Tone + History sidebar */}
          <div className="lg:col-span-4 space-y-5">

            {/* Tone selector */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 shadow-sm"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3.5">
                말투 설정
              </p>
              <div className="space-y-2">
                {TONES.map(t => (
                  <ToneCard
                    key={t.value}
                    tone={t}
                    selected={tone === t.value}
                    onClick={() => setTone(t.value)}
                  />
                ))}
              </div>
            </motion.div>

            {/* Recent history mini */}
            {history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">최근 기록</p>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                  >
                    전체 보기
                  </button>
                </div>
                <div className="space-y-2">
                  {history.slice(0, 3).map(item => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left px-3.5 py-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group"
                    >
                      <p className="text-xs font-semibold text-slate-700 truncate leading-snug">
                        {item.subject}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="mt-12 text-center text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()}{' '}
          <a
            href="https://github.com/developerjini/ProfessionalEmailRewriter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-600 transition-colors"
          >
            직장인 메일 비서
          </a>
          {' '}made by 개발자지니 · Powered by Claude AI
        </footer>
      </div>

      {/* ── History drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ opacity: 0, x: 360 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 360 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  히스토리 ({history.length})
                </h2>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 전체 삭제
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-16">
                    <Mail className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">아직 기록이 없습니다.</p>
                  </div>
                ) : (
                  history.map(item => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group"
                    >
                      <p className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">
                        {item.subject}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                        {item.original}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleString('ko-KR', {
                            month: 'numeric', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                          {TONES.find(t => t.value === item.tone)?.emoji} {TONES.find(t => t.value === item.tone)?.label}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium ml-auto">
                          {item.language === 'ko' ? '🇰🇷' : '🇺🇸'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-[11px] text-slate-400 text-center">
                  최대 20개 기록이 저장됩니다
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
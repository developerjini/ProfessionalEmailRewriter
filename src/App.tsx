/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Copy,
  Check,
  RefreshCw,
  Mail,
  MessageSquareText,
  Sparkles,
  ChevronRight,
  History,
  X,
  Clock
} from 'lucide-react';
import { rewriteText, Tone, RewriteOptions } from './services/geminiService';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HistoryItem {
  id: string;
  original: string;
  rewritten: string;
  timestamp: number;
}

const HISTORY_STORAGE_KEY = 'email-rewriter-history';

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

function saveHistory(history: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage 사용 불가 환경에서는 무시
  }
}

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState<Tone>('formal');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const handleRewrite = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const result = await rewriteText(input, { tone, language } satisfies RewriteOptions);
      if (result) {
        setOutput(result);
        const newItem: HistoryItem = {
          id: Math.random().toString(36).substring(2),
          original: input,
          rewritten: result,
          timestamp: Date.now(),
        };
        setHistory(prev => {
          const updated = [newItem, ...prev].slice(0, 10);
          return updated;
        });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert('클립보드 복사에 실패했습니다. 직접 텍스트를 선택해 복사해 주세요.');
    });
  }, [output]);

  const tones: { value: Tone; label: string; description: string }[] = [
    { value: 'formal', label: '정중한 (Formal)', description: '상사나 외부 업체에 적합한 격식 있는 말투' },
    { value: 'semi-formal', label: '부드러운 (Semi-formal)', description: '동료나 협업 부서에 적합한 친근하면서도 예의 바른 말투' },
    { value: 'concise', label: '간결한 (Concise)', description: '핵심 내용만 명확하게 전달하는 효율적인 말투' },
    { value: 'friendly', label: '친근한 (Friendly)', description: '가까운 동료에게 보내는 따뜻한 말투' },
    { value: 'casual', label: '캐주얼 (Casual)', description: '격식을 덜 차린 편안하고 일상적인 말투' },
    { value: 'persuasive', label: '설득력 있음 (Persuasive)', description: '상대방의 동의나 협조를 이끌어내는 논리적인 말투' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">직장인 메일 비서</h1>
              <p className="text-sm text-slate-500 font-medium">보내기 전에 이거 돌리면 메일 퀄리티 달라집니다</p>
            </div>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
            aria-label="히스토리 보기"
          >
            <History className="w-5 h-5" />
            {history.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white" />
            )}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Input Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                  <MessageSquareText className="w-4 h-4" />
                  원문 입력
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLanguage('ko')}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                      language === 'ko' ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    KOR
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                      language === 'en' ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    ENG
                  </button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="다듬고 싶은 내용을 자유롭게 적어주세요. (예: 내일 회의 시간 2시로 옮길 수 있을까요?)"
                className="w-full h-48 p-6 text-slate-700 placeholder:text-slate-300 focus:outline-none resize-none text-base leading-relaxed"
              />
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleRewrite}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md",
                    !input.trim() || isLoading
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200"
                  )}
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isLoading ? '변환 중...' : '비즈니스 메일로 변환'}
                </button>
              </div>
            </div>

            {/* Output Section */}
            <AnimatePresence mode="wait">
              {output && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-indigo-50 flex items-center justify-between bg-indigo-50/30">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                      <Send className="w-4 h-4" />
                      변환된 메일
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors text-xs font-bold"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? '복사됨' : '복사하기'}
                    </button>
                  </div>
                  <div className="p-8 prose prose-slate max-w-none">
                    <div className="markdown-body">
                      <Markdown>{output}</Markdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Settings */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-500" />
                말투(Tone) 설정
              </h3>
              <div className="space-y-3">
                {tones.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all group",
                      tone === t.value
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm font-bold",
                        tone === t.value ? "text-indigo-700" : "text-slate-700"
                      )}>
                        {t.label}
                      </span>
                      {tone === t.value && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      {t.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* History Preview */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  최근 기록
                </h3>
                <div className="space-y-3">
                  {history.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setInput(item.original);
                        setOutput(item.rewritten);
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                    >
                      <p className="text-xs text-slate-600 truncate mb-1 font-medium">
                        {item.original}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ opacity: 0, x: 320 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" />
                  전체 히스토리 ({history.length})
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-12">기록이 없습니다.</p>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setInput(item.original);
                        setOutput(item.rewritten);
                        setShowHistory(false);
                      }}
                      className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                    >
                      <p className="text-xs font-semibold text-slate-700 line-clamp-2 mb-2">
                        {item.original}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                        → {item.rewritten}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-300">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleString('ko-KR', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </button>
                  ))
                )}
              </div>
              {history.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setHistory([]);
                      setShowHistory(false);
                    }}
                    className="w-full py-2 text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    전체 기록 삭제
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-12 text-slate-400 text-xs font-medium">
        © {new Date().getFullYear()} 직장인 메일 비서 made by 개발자지니. Powered by Gemini AI.
      </footer>
    </div>
  );
}

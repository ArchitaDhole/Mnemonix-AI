import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  Sparkles, 
  RefreshCw, 
  Image as ImageIcon, 
  ChevronRight, 
  Lightbulb, 
  ListChecks,
  Zap,
  Plus,
  Trash2
} from "lucide-react";
import { 
  generateMemoryTrick, 
  generateVisualImage, 
  MemoryResult, 
  ChatMessage 
} from "./services/geminiService";
import { SINGLE_DIGIT_PEGS, DOUBLE_DIGIT_PEGS } from "./constants";

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPegs, setShowPegs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleGenerate = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await generateMemoryTrick(input, messages);
      const modelMsg: ChatMessage = { 
        role: "model", 
        content: `Memory trick for: ${input}`, 
        result: res 
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    if (window.confirm("Clear current session?")) {
      setMessages([]);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <Brain className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Mnemonix AI</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visual Memory Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPegs(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
          >
            <ListChecks size={18} />
            <span className="hidden sm:inline">Peg System</span>
          </button>
          <button 
            onClick={clearSession}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
            title="Clear Session"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-4xl mx-auto w-full scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60 py-20">
            <div className="bg-white p-8 rounded-full shadow-xl shadow-slate-200/50">
              <Sparkles className="w-16 h-16 text-indigo-500 animate-pulse" />
            </div>
            <div className="max-w-md">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to Memorize?</h2>
              <p className="text-slate-500 leading-relaxed">
                Paste your study material, a formula, or a list of items. 
                I'll turn them into an unforgettable visual story.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-8">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 text-left">
                <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">Try this</p>
                <p className="text-xs text-slate-600">"Characteristics of Porifera: Pores, Spicules, Sessile..."</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 text-left">
                <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">Or this</p>
                <p className="text-xs text-slate-600">"Newton's Second Law: F = ma"</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl rounded-tr-none max-w-[80%] shadow-lg shadow-indigo-100">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                msg.result && <MemoryTrickCard result={msg.result} />
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="relative">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                <Sparkles className="w-3 h-3 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <span className="text-sm font-bold text-slate-500 tracking-wide">Building your memory trick...</span>
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 md:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Paste your study material here..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 pr-16 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[60px] max-h-[200px] resize-none"
            rows={1}
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="absolute right-3 bottom-3 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            <Sparkles size={20} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
          Press Enter to generate • Shift + Enter for new line
        </p>
      </div>

      {/* Peg System Modal */}
      <AnimatePresence>
        {showPegs && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPegs(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <ListChecks className="text-indigo-600" />
                  <h2 className="text-xl font-bold text-slate-800">Number Peg System</h2>
                </div>
                <button onClick={() => setShowPegs(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <Plus className="rotate-45 text-slate-400" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(SINGLE_DIGIT_PEGS).map(([num, peg]) => (
                  <div key={num} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center">
                    <span className="text-2xl font-black text-indigo-600">{num}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{peg}</span>
                  </div>
                ))}
                <div className="col-span-full h-px bg-slate-100 my-2" />
                {Object.entries(DOUBLE_DIGIT_PEGS).map(([num, peg]) => (
                  <div key={num} className="bg-white p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 w-4">{num}</span>
                    <span className="text-[10px] font-medium text-slate-600 truncate">{peg}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemoryTrickCard({ result }: { result: MemoryResult }) {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const handleGenerateImage = async () => {
    setImageLoading(true);
    try {
      const description = result.visualDescriptions.length > 0 ? result.visualDescriptions[0] : result.memoryStory;
      const img = await generateVisualImage(result.memoryStory, description);
      setGeneratedImage(img);
    } catch (e) {
      console.error(e);
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full"
    >
      {/* Keywords & Sound Breaking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="text-amber-500 w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Key Elements</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((kw, i) => (
              <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {result.wordSoundBreaking && result.wordSoundBreaking.length > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ChevronRight className="text-indigo-500 w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Word Breaking</h3>
            </div>
            <div className="space-y-2">
              {result.wordSoundBreaking.map((item, i) => (
                <div key={i} className="text-xs">
                  <span className="font-bold text-indigo-600">{item.word}</span>
                  <p className="text-slate-400 italic">{item.parts?.join(" + ")}</p>
                  <p className="text-slate-600 mt-0.5">Visual: {item.visual}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formula Info */}
      {result.formulaInfo && (
        <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 mb-2 text-purple-700 font-semibold">
            <Zap size={18} />
            <span>Formula Breakdown: {result.formulaInfo.name}</span>
          </div>
          <p className="text-sm text-purple-900 mb-2"><span className="font-medium">Meaning:</span> {result.formulaInfo.meaning}</p>
          <p className="text-sm text-purple-900 mb-2"><span className="font-medium">Usage:</span> {result.formulaInfo.usage}</p>
          {result.formulaInfo.graphShape && (
            <p className="text-sm text-purple-900"><span className="font-medium">Graph Shape:</span> {result.formulaInfo.graphShape}</p>
          )}
        </div>
      )}

      {/* Memory Story */}
      <div className="bg-indigo-50 p-6 md:p-8 rounded-3xl border border-indigo-100 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Brain className="w-32 h-32 text-indigo-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="text-indigo-600 w-5 h-5" />
              <h3 className="text-lg font-bold text-indigo-900">Visual Memory Story</h3>
            </div>
            <button
              onClick={handleGenerateImage}
              disabled={imageLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {imageLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
              {imageLoading ? "Painting..." : "Generate Visual"}
            </button>
          </div>
          <p className="text-base md:text-lg text-indigo-800 leading-relaxed font-medium italic">
            "{result.memoryStory}"
          </p>
          
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-100 px-2 py-0.5 rounded">
              Method: {result.methodUsed}
            </span>
          </div>

          {generatedImage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 rounded-2xl overflow-hidden shadow-xl border-4 border-white"
            >
              <img src={generatedImage} alt="Memory Trick" className="w-full h-auto" referrerPolicy="no-referrer" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Revision Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="text-emerald-500 w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Revision Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {result.revisionSummary.keywords.map((item, i) => (
                <span key={i} className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pegs Used</h4>
            <div className="flex flex-wrap gap-1.5">
              {result.revisionSummary.pegsUsed.length > 0 ? (
                result.revisionSummary.pegsUsed.map((item, i) => (
                  <span key={i} className="text-[11px] font-medium text-slate-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-300 italic">None</span>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recall Hints</h4>
            <div className="space-y-1">
              {result.revisionSummary.recallHints.map((item, i) => (
                <p key={i} className="text-[11px] text-slate-500 italic flex items-center gap-2">
                  <ChevronRight className="w-2.5 h-2.5 text-indigo-300" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

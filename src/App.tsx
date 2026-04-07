import React, { useState, useEffect, useRef } from "react";
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
  Trash2,
  Download,
  Menu,
  X,
  History,
  Paperclip
} from "lucide-react";
import { 
  generateMemoryTrick, 
  generateVisualImage, 
  generateChatTitle,
  MemoryResult, 
  ChatMessage,
  ChatSession
} from "./services/geminiService";
import { SINGLE_DIGIT_PEGS, DOUBLE_DIGIT_PEGS } from "./constants";

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPegs, setShowPegs] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mnemonix_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
    
    if (!process.env.GEMINI_API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("mnemonix_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Memory Trick",
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setShowSidebar(false);
  };

  const selectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      setShowSidebar(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this chat?")) {
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      if (currentSessionId === id) {
        if (updated.length > 0) {
          selectSession(updated[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    }
  };

  const MAX_CHARS = 2000;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, error]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (retryText?: string) => {
    const textToUse = retryText || input;
    if (!textToUse.trim() && !selectedImage) return;
    if (loading) return;

    let currentMessages = [...messages];
    
    if (!retryText) {
      const userMsg: ChatMessage = { 
        role: "user", 
        content: textToUse,
        imageBase64: selectedImage || undefined
      };
      currentMessages = [...currentMessages, userMsg];
      setMessages(currentMessages);
      setInput("");
      setSelectedImage(null);
    }
    
    setLoading(true);
    setError(null);

    try {
      const res = await generateMemoryTrick(textToUse, messages, selectedImage || undefined);
      const modelMsg: ChatMessage = { 
        role: "model", 
        content: `Memory trick for: ${textToUse.substring(0, 30)}${textToUse.length > 30 ? "..." : ""}`, 
        result: res 
      };
      const updatedMessages = [...currentMessages, modelMsg];
      setMessages(updatedMessages);

      // Update session title if it's the first message
      let updatedSessions = [...sessions];
      let sessionId = currentSessionId;

      if (!sessionId) {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: textToUse.substring(0, 30),
          messages: updatedMessages,
          createdAt: Date.now()
        };
        updatedSessions = [newSession, ...updatedSessions];
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        
        // Generate a better title in background
        generateChatTitle(textToUse).then(title => {
          setSessions(prev => prev.map(s => s.id === newSession.id ? { ...s, title } : s));
        });
      } else {
        updatedSessions = updatedSessions.map(s => 
          s.id === sessionId ? { ...s, messages: updatedMessages } : s
        );
      }
      setSessions(updatedSessions);

    } catch (err: any) {
      console.error("Generation failed", err);
      setError(err.message || "I encountered an error while building your trick. Please try again or simplify your text.");
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
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 flex flex-col shadow-2xl lg:relative lg:shadow-none"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="text-indigo-600 w-5 h-5" />
                  <h2 className="font-bold text-slate-800">History</h2>
                </div>
                <button onClick={() => setShowSidebar(false)} className="lg:hidden p-1 hover:bg-slate-100 rounded">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-3">
                <button 
                  onClick={createNewSession}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Plus size={18} />
                  New Memory Trick
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {sessions.map(s => (
                  <div 
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      currentSessionId === s.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Sparkles size={16} className={currentSessionId === s.id ? "text-indigo-500" : "text-slate-300"} />
                      <span className="text-xs font-bold truncate">{s.title}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSidebar(true)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Menu size={20} className="text-slate-600" />
            </button>
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Brain className="text-white w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Mnemonix AI</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visual Memory Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {apiKeyMissing && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-bold animate-pulse">
                <Zap size={12} />
                API KEY MISSING
              </div>
            )}
            <button 
              onClick={() => setShowPegs(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
            >
              <ListChecks size={18} />
              <span className="hidden sm:inline">Peg System</span>
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
            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.role === "user" ? (
                <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl rounded-tr-none max-w-[80%] shadow-lg shadow-indigo-100">
                  {msg.imageBase64 && (
                    <img 
                      src={msg.imageBase64} 
                      alt="Uploaded" 
                      className="w-full max-w-[200px] rounded-lg mb-2 border border-white/20" 
                    />
                  )}
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
        {error && (
          <div className="flex flex-col items-center gap-3">
            <div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl border border-red-100 text-sm font-medium flex items-center gap-2 shadow-sm">
              <Zap size={16} />
              {error}
            </div>
            <button 
              onClick={() => {
                const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
                if (lastUserMsg) handleGenerate(lastUserMsg.content);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 md:p-6 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto relative">
          {selectedImage && (
            <div className="absolute bottom-full left-0 mb-4 p-2 bg-white rounded-2xl border border-slate-200 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
              <img src={selectedImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder={selectedImage ? "Describe what to memorize from this image..." : "Paste study material or upload an image..."}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 pr-32 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[60px] max-h-[200px] resize-none"
            rows={1}
          />
          
          <div className="absolute right-20 bottom-4 text-[10px] font-bold text-slate-300">
            {input.length}/{MAX_CHARS}
          </div>
          
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="Upload Image"
            >
              <Paperclip size={20} />
            </button>
            <button 
              onClick={() => handleGenerate()}
              disabled={loading || (!input.trim() && !selectedImage)}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
            >
              <Sparkles size={20} />
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
          Press Enter to generate • Shift + Enter for new line
        </p>
      </footer>
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

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = generatedImage;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Set canvas size (Image + Text area)
    const textWidth = 400;
    canvas.width = img.width + textWidth;
    canvas.height = img.height;

    // Draw background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw text area background
    ctx.fillStyle = "#eef2ff"; // indigo-50
    ctx.fillRect(img.width, 0, textWidth, canvas.height);

    // Draw Header
    ctx.fillStyle = "#4f46e5"; // indigo-600
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("MNEMONIX AI", img.width + 40, 50);

    // Draw Title
    ctx.fillStyle = "#1e293b"; // slate-800
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("Memory Story", img.width + 40, 90);

    // Draw Story Text
    ctx.fillStyle = "#312e81"; // indigo-900
    ctx.font = "italic 18px sans-serif";
    
    const words = result.memoryStory.split(" ");
    let line = "";
    let y = 130;
    const maxWidth = textWidth - 80;
    const lineHeight = 28;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, img.width + 40, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, img.width + 40, y);

    // Draw Method
    y += 40;
    ctx.fillStyle = "#6366f1"; // indigo-500
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`METHOD: ${result.methodUsed.toUpperCase()}`, img.width + 40, y);

    // Download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `mnemonix-trick-${Date.now()}.png`;
    link.click();
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
              className="mt-6 rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-white flex flex-col md:flex-row"
            >
              <div className="flex-1 relative group">
                <img src={generatedImage} alt="Memory Trick" className="w-full h-auto" referrerPolicy="no-referrer" />
                <button 
                  onClick={handleDownload}
                  className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white text-indigo-600 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Download Composite Image"
                >
                  <Download size={20} />
                </button>
              </div>
              <div className="md:w-1/3 p-6 bg-indigo-50/50 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Memory Story</h4>
                <p className="text-sm text-indigo-900 font-medium italic leading-relaxed">
                  "{result.memoryStory}"
                </p>
                <div className="mt-4 pt-4 border-t border-indigo-100/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Method</p>
                  <p className="text-xs font-bold text-indigo-600 capitalize">{result.methodUsed}</p>
                </div>
              </div>
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

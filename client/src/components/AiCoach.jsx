import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { askAiHint } from '../services/aiApi';
import { MessageSquare, X, Send, Minimize2, Maximize2, Bot } from 'lucide-react';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
    "Give me a hint",
    "What is the intuition?",
    "Is there a better approach?",
    "What are the edge cases?"
];

const AiCoach = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeProblem, setActiveProblem] = useState('');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Resizable State
    const [dimensions, setDimensions] = useState({ width: 380, height: 600 });
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0 });

    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const toggleChat = () => setIsOpen(!isOpen);
    const toggleMinimize = () => setIsMinimized(!isMinimized);

    const startSession = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setActiveProblem(input);
        setMessages([{ role: 'ai', text: `Okay, I'm ready to help! What part are you stuck on?` }]);
        setInput('');
    };

    const sendMessage = async (e, overrideText = null) => {
        if (e) e.preventDefault();

        const textToSend = overrideText || input;

        if (!textToSend.trim() || loading) return;

        const userMsg = { role: 'user', text: textToSend };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInput('');
        setLoading(true);

        try {
            const aiResponseText = await askAiHint(activeProblem, newHistory);
            setMessages(prev => [...prev, { role: 'ai', text: aiResponseText }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'error', text: err.message }]);
            if (err.response && err.response.status === 429) {
                toast.error("Coach is busy! Please wait 1 minute.");
            } else {
                toast.error("Failed to get AI response");
            }
        } finally {
            setLoading(false);
        }
    };

    const resetSession = () => {
        setActiveProblem('');
        setMessages([]);
        setInput('');
    };

    // --- Resize Logic ---
    const startResize = (e) => {
        e.preventDefault();
        setIsResizing(true);
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startW: dimensions.width,
            startH: dimensions.height
        };
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    };

    const handleResize = (e) => {
        const deltaX = resizeRef.current.startX - e.clientX; // Moving left increases width
        const deltaY = resizeRef.current.startY - e.clientY; // Moving up increases height

        // Constrain to viewport size minus margins (24px right + 24px left = 48px total margin)
        const maxWidth = window.innerWidth - 48;
        const maxHeight = window.innerHeight - 48;

        setDimensions({
            width: Math.max(320, Math.min(maxWidth, resizeRef.current.startW + deltaX)),
            height: Math.max(400, Math.min(maxHeight, resizeRef.current.startH + deltaY))
        });
    };

    const stopResize = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
    };

    // 1. Floating Button (When Closed)
    if (!isOpen) {
        return (
            <button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#4ecdc4] hover:bg-[#3dbdb4] text-[#0c1618] rounded-full shadow-[0_0_20px_rgba(78,205,196,0.4)] flex items-center justify-center transition-all duration-300 z-50 group"
            >
                <Bot size={28} className="group-hover:scale-110 transition-transform" />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
            </button>
        );
    }

    // 2. Chat Window
    return (
        <div
            className={`fixed bottom-6 right-6 bg-[#111f22] border border-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col ${isResizing ? '' : 'transition-all duration-300'}`}
            style={{
                width: dimensions.width,
                height: isMinimized ? 60 : dimensions.height
            }}
        >
            {/* Resize Handle (Top-Left) - Only visible when not minimized */}
            {!isMinimized && (
                <div
                    className="absolute -top-2 -left-2 w-6 h-6 cursor-nw-resize z-50 flex items-center justify-center group"
                    onMouseDown={startResize}
                >
                    <div className="w-3 h-3 border-t-2 border-l-2 border-gray-600 group-hover:border-[#4ecdc4] rounded-tl transition-colors"></div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 bg-[#0c1618] border-b border-gray-800 rounded-t-2xl flex justify-between items-center cursor-pointer select-none" onClick={toggleMinimize}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#4ecdc4]/20 flex items-center justify-center text-[#4ecdc4]">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">AI Coach</h3>
                        <p className="text-xs text-[#4ecdc4] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4ecdc4] animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 text-gray-400">
                    <button onClick={(e) => { e.stopPropagation(); toggleMinimize(); }} className="hover:text-white p-1">
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleChat(); }} className="hover:text-red-400 p-1">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Content (Hidden if minimized) */}
            {!isMinimized && (
                <>
                    {/* Setup Mode */}
                    {!activeProblem ? (
                        <div className="flex-1 p-6 flex flex-col justify-center items-center text-center">
                            <Bot size={48} className="text-gray-700 mb-4" />
                            <h4 className="text-white font-medium mb-2">Start a Session</h4>
                            <p className="text-gray-400 text-sm mb-6">Paste a problem link to get context-aware help.</p>
                            <form onSubmit={startSession} className="w-full space-y-3">
                                <input
                                    type="text"
                                    placeholder="Problem Link..."
                                    className="w-full bg-[#0c1618] border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#4ecdc4] transition-colors"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button type="submit" className="w-full bg-[#4ecdc4] text-[#0c1618] font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                                    Start Coaching
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* Chat Mode */
                        <>
                            <div className="bg-[#0c1618]/50 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                                <span className="text-xs text-gray-400 truncate max-w-[200px]">{activeProblem}</span>
                                <button onClick={resetSession} className="text-xs text-red-400 hover:underline">End Session</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0c1618] scrollbar-thin scrollbar-thumb-gray-800">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-[#4ecdc4] text-[#0c1618] rounded-br-none'
                                            : msg.role === 'error'
                                                ? 'bg-red-900/20 text-red-400 border border-red-900/50'
                                                : 'bg-[#111f22] text-gray-200 border border-gray-800 rounded-bl-none'
                                            }`}>
                                            {msg.role === 'ai' ? (
                                                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#0c1618] prose-pre:border prose-pre:border-gray-800 whitespace-pre-wrap">
                                                    <ReactMarkdown remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} rehypePlugins={[rehypeKatex]}>{msg.text}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p>{msg.text}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-[#111f22] border border-gray-800 px-4 py-2 rounded-full rounded-bl-none flex gap-1">
                                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Suggestion Chips */}
                            {!loading && messages.length > 0 && (
                                <div className="px-4 py-2 flex gap-2 overflow-x-auto thin-scrollbar">
                                    {SUGGESTIONS.map((text) => (
                                        <button
                                            key={text}
                                            onClick={() => sendMessage(null, text)}
                                            className="text-xs bg-[#111f22] text-[#4ecdc4] px-3 py-1 rounded-full hover:bg-[#4ecdc4]/10 transition border border-[#4ecdc4]/30 whitespace-nowrap"
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={sendMessage} className="p-3 bg-[#111f22] border-t border-gray-800 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type your question..."
                                    className="flex-1 bg-[#0c1618] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#4ecdc4]"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="bg-[#4ecdc4] p-2 rounded-lg text-[#0c1618] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default AiCoach;
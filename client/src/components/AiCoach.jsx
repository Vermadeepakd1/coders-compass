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

    // 1. Collapsed Trigger Button
    if (!isOpen) {
        return (
            <button
                onClick={toggleChat}
                className="fixed bottom-4 right-4 bg-ai/10 border border-ai/40 text-ai hover:bg-ai/20 hover:border-ai/60 hover:shadow-[0_0_14px_rgba(6,182,212,0.3)] font-mono text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-sm shadow-lg z-50 flex items-center gap-1.5 transition-all duration-200"
            >
                <Bot size={13} />
                <span>Coach Chat</span>
            </button>
        );
    }

    // 2. Chat Window
    return (
        <div
            className={`fixed bottom-4 right-4 bg-brand-surface border border-brand-border rounded-sm shadow-xl z-50 flex flex-col font-mono text-xs text-zinc-400`}
            style={{
                width: dimensions.width,
                height: isMinimized ? 36 : dimensions.height
            }}
        >
            {/* Header */}
            <div className="p-2.5 bg-zinc-950 border-b border-brand-border flex justify-between items-center cursor-pointer select-none text-[10px] uppercase tracking-wider" onClick={toggleMinimize}>
                <div className="flex items-center gap-2">
                    <Bot size={13} className="text-zinc-400" />
                    <span className="text-zinc-200 font-semibold">AI Coach console</span>
                </div>
                <div className="flex gap-2 text-zinc-500">
                    <button onClick={(e) => { e.stopPropagation(); toggleMinimize(); }} className="hover:text-zinc-300">
                        {isMinimized ? "[max]" : "[min]"}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleChat(); }} className="hover:text-brand-danger">
                        [esc]
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <>
                    {!activeProblem ? (
                        <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-4">
                            <Bot size={24} className="text-zinc-600" />
                            <div className="space-y-1">
                                <h4 className="text-zinc-200 uppercase font-semibold text-[10px] tracking-wider">Initialize Session</h4>
                                <p className="text-[10px] text-zinc-500 font-sans leading-relaxed max-w-[240px]">
                                    Provide a Codeforces or LeetCode problem link to start contextual reviews.
                                </p>
                            </div>
                            <form onSubmit={startSession} className="w-full space-y-2">
                                <input
                                    type="text"
                                    placeholder="Problem URL..."
                                    className="w-full bg-brand-bg border border-zinc-800 text-zinc-200 px-2 py-1.5 rounded-sm text-xs focus:outline-none focus:border-zinc-500 font-mono"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button type="submit" className="btn-primary w-full text-[10px]">
                                    Connect
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="bg-zinc-950/80 px-3 py-1.5 border-b border-brand-border flex justify-between items-center text-[9px] uppercase text-zinc-500">
                                <span className="truncate max-w-[200px] lowercase">{activeProblem}</span>
                                <button onClick={resetSession} className="text-brand-danger hover:underline font-bold">End Session</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-bg">
                                {messages.map((msg, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">
                                            {msg.role === 'user' ? '// USER' : '// COACH'}
                                        </div>
                                        <div className={`pl-2 border-l border-zinc-700 text-zinc-300 font-sans text-xs leading-relaxed whitespace-pre-wrap`}>
                                            {msg.role === 'ai' ? (
                                                <div className="prose prose-invert prose-xs max-w-none text-zinc-300">
                                                    <ReactMarkdown remarkPlugins={[remarkMath, remarkBreaks, remarkGfm]} rehypePlugins={[rehypeKatex]}>{msg.text}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p>{msg.text}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="text-zinc-600 animate-pulse text-[10px] uppercase">
                                        [Computing response...]
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Suggestion Chips */}
                            {!loading && messages.length > 0 && (
                                <div className="px-3 py-2 flex gap-1.5 overflow-x-auto bg-zinc-950 border-t border-brand-border">
                                    {SUGGESTIONS.map((text) => (
                                        <button
                                            key={text}
                                            onClick={() => sendMessage(null, text)}
                                            className="text-[9px] text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded-sm bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700 whitespace-nowrap"
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={sendMessage} className="p-2 bg-brand-surface border-t border-brand-border flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter prompt..."
                                    className="flex-1 bg-brand-bg border border-zinc-800 rounded-sm px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500 font-sans"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 px-3 py-1.5 rounded-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={12} />
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

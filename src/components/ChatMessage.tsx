import { User, Bot, Copy, Check, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Message, useSqlStore } from '@/store/sqlStore';
import { DataTable } from './DataTable';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const { regenerateMessage, submitFeedback, setMessageFeedback, setCurrentQuery, regenerateQuery, submitQuery, isLoading } = useSqlStore();
    const [copiedSql, setCopiedSql] = useState(false);
    const [feedback, setFeedback] = useState<string>('none');
    const [isSqlDropdownOpen, setIsSqlDropdownOpen] = useState<boolean>(false);
    const [editingSql, setEditingSql] = useState(message.sql);
    const [showSqlCard, setShowSqlCard] = useState(message.feedback === "no");
    const sqlCardRef = useRef<HTMLDivElement>(null);
    const messages = [
        "Analyzing message...",
        "Checking database...",
        "Fetching the columns...",
        "Getting ready with the query...",
    ];
    const [index, setIndex] = useState(0);
    useEffect(() => {
        if (!message.isLoading) return;

        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 1200);

        return () => clearInterval(interval);
    }, [message.isLoading, messages.length]);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedSql(true);
            setTimeout(() => setCopiedSql(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };
    const handleRefresh = async () => {
        regenerateQuery(message);
    };

    const formatTimestamp = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };
    useEffect(() => {
        if (showSqlCard) {
            sqlCardRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [showSqlCard]);

    if (message.type === 'user') {
        return (
            <div className="flex justify-end mb-6">
                <div className="flex items-start gap-3 max-w-[80%]">
                    <div className="bg-chat-user text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 shadow-lg">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-75 mt-1">{formatTimestamp(message.timestamp)}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {message.isLoading ? (
                <div className="w-fit">
                    <div className="flex items-center justify-center gap-3 max-w-[90%] w-full">
                        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-blue-600" />
                        </div>

                        <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 shadow-sm min-h-[45px] w-fit">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -15, scale: 0.95 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-400 
            bg-clip-text text-transparent tracking-wide whitespace-nowrap overflow-hidden"
                                >
                                    {messages[index]}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

            ) : (
                <div className="flex justify-start mb-6">
                    <div className="flex items-start gap-3 max-w-[90%] w-full">
                        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-4">
                            {/* AI Response */}
                            <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                                <p
                                    className={`text-sm ${message?.error ? "text-red-500" : "text-foreground"
                                        }`}
                                >
                                    {message?.error || message?.content}
                                </p>

                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatTimestamp(message.timestamp)}
                                </p>
                                {(message.sql) && (
                                    <div className="relative my-2">
                                        {/* Dropdown toggle */}
                                        <button
                                            className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium  rounded-lg border transition-colors"
                                            onClick={() => setIsSqlDropdownOpen(!isSqlDropdownOpen)}
                                        >
                                            <span>SQL Query</span>
                                            <svg
                                                className={`w-4 h-4 transform transition-transform duration-300 ${isSqlDropdownOpen ? "rotate-180" : ""
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Collapsible SQL Card */}
                                        {isSqlDropdownOpen && (
                                            <Card className="bg-transparent border border-border mt-2" ref={sqlCardRef}>
                                                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-destructive rounded-full"></div>
                                                        <div className="w-2 h-2 bg-warning rounded-full"></div>
                                                        <div className="w-2 h-2 bg-success rounded-full"></div>
                                                        <span className="text-xs text-muted-foreground ml-2">SQL Query</span>
                                                    </div>
                                                    <div className="flex gap-1 items-center">
                                                        <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-muted-foreground hover:text-foreground">
                                                            <RefreshCcw className="w-3 h-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(editingSql)} className="text-muted-foreground hover:text-foreground">
                                                            {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="p-4">
                                                    {showSqlCard ? (
                                                        <textarea
                                                            className="w-full text-xs font-mono p-2 border rounded-md"
                                                            value={editingSql}
                                                            onChange={(e) => setEditingSql(e.target.value)}
                                                            rows={4}
                                                        />
                                                    ) : (
                                                        <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                                                            {message.sql}
                                                        </pre>
                                                    )}

                                                    {showSqlCard && (
                                                        <Button
                                                            className="mt-2 bg-blue-600 hover:bg-blue-600/80"
                                                            onClick={() => {
                                                                regenerateMessage(message.id, editingSql);
                                                                setShowSqlCard(false);
                                                                setFeedback("none");
                                                            }}
                                                            disabled={!editingSql || editingSql.trim() === message.sql?.trim()}
                                                        >
                                                            Run Again
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* SQL Query */}



                            {/* Query Results */}
                            {message.result && (
                                <Card className="bg-card border border-border">
                                    {message.result.rows && message.result.rows.length > 0 ? (
                                        <>
                                            <div className="px-4 py-3 border-b border-border">
                                                <h3 className="text-sm font-medium text-foreground">Query Results</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {message.result.rows.length} rows returned
                                                </p>
                                            </div>
                                            <div className="p-4">
                                                <DataTable result={message.result} />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-4 text-sm text-red-500">
                                            {message.result.error || "No results found."}
                                        </div>
                                    )}
                                </Card>
                            )}

                            {message.feedback && message.result.rows && message.result.rows.length > 0 && (
                                <Card className="bg-card border border-border mt-2">
                                    <div className="py-3 border-b border-border">
                                        {message.feedback === 'none' && (
                                            <div className="flex flex-col  gap-2 mt-2 px-4 pb-4">
                                                <span className="text-sm text-foreground">Is this output correct?</span>
                                                <div className='flex gap-2'>
                                                    <Button size="sm" variant="outline" onClick={() => {
                                                        submitFeedback(message);
                                                        setMessageFeedback(message.id, "yes");
                                                        setFeedback("yes");
                                                        setShowSqlCard(false);
                                                    }}>
                                                        Yes
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setFeedback('no');
                                                            setMessageFeedback(message.id, "no");
                                                            setShowSqlCard(true);
                                                            setIsSqlDropdownOpen(true)
                                                            setEditingSql(message.sql);
                                                        }}
                                                    >
                                                        No
                                                    </Button>

                                                </div>
                                            </div>
                                        )}

                                        {message.feedback === 'yes' && (
                                            <div className="px-4 pb-1 text-sm text-green-600">Glad it's correct ✅</div>
                                        )}
                                        {message.feedback === 'no' && (
                                            <div className="px-4 pb-1 text-sm text-red-600">
                                                Please edit the SQL and run again.
                                            </div>
                                        )}
                                    </div>
                                </Card>

                            )}

                        </div>
                    </div>
                </div >
            )
            }
        </>
    );
}

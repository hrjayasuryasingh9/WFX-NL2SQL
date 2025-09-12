import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChartVisualization } from './ChartVisualizations';
import { useSqlStore } from '@/store/sqlStore';
import { Database, Menu, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';

export function MainContent({ setIsOpen }: { setIsOpen: (v: boolean) => void }) {
    const { currentConversation } = useSqlStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll when new messages are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentConversation?.messages]);

    return (
        <div className="flex-1 flex flex-col h-full relative">
            {/* Header */}
            <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 flex items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                    {/* <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Database className="w-4 h-4 text-primary-foreground" />
                    </div> */}
                    <img
                        src={"/src/assets/wfxlogo.png"}
                        alt="WFX Logo"
                        className="w-10 h-10 relative top-1 object-contain"
                    />
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">SQL Converter</h1>
                        <p className="text-xs text-muted-foreground">Natural Language to SQL Query</p>
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <div className="lg:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 px-4">
                <div className="max-w-4xl mx-auto py-6">
                    {!currentConversation ? (
                        // Welcome Screen
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                            <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-4">
                                Welcome to SQL Converter
                            </h2>
                            <p className="text-muted-foreground mb-8 max-w-md">
                                Transform your natural language questions into SQL queries instantly.
                                Get results, visualize data, and download CSV files.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground max-w-2xl">
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <h3 className="font-medium text-foreground mb-2">🔍 Query Data</h3>
                                    <p>Ask questions like "Show me monthly sales" and get SQL queries instantly</p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <h3 className="font-medium text-foreground mb-2">📊 Visualize Results</h3>
                                    <p>Turn query results into beautiful charts with one click</p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <h3 className="font-medium text-foreground mb-2">💾 Export Data</h3>
                                    <p>Download your query results as CSV files for further analysis</p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-4">
                                    <h3 className="font-medium text-foreground mb-2">💬 Chat History</h3>
                                    <p>Access all your previous queries and results anytime</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Messages
                        <div className="space-y-6">
                            {currentConversation.messages.map((message) => (
                                <ChatMessage key={message.id} message={message} />
                            ))}
                            {/* 👇 dummy div to scroll into view */}
                            <div ref={scrollRef} />
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input */}
            <ChatInput />

            {/* Chart Visualization */}
            <ChartVisualization />
        </div>
    );
}

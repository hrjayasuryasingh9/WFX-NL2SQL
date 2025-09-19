import { useState, KeyboardEvent } from 'react';
import { Send, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSqlStore } from '@/store/sqlStore';

export function ChatInput() {
    const { currentQuery, setCurrentQuery, submitQuery, isLoading } = useSqlStore();
    const [localQuery, setLocalQuery] = useState('');
    const [selectedExample, setSelectedExample] = useState<string | null>(null);
    const [showExamples, setShowExamples] = useState(false); // 👈 collapse state

    const handleSubmit = async () => {
        const query = selectedExample || localQuery;
        if (!query.trim() || isLoading) return;

        setCurrentQuery(query);
        await submitQuery(query);

        setLocalQuery('');
        setSelectedExample(null);
        setShowExamples(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const exampleQueries = [
        "Balance of Ledger for current month",
        "All ledger balance under Asset Category",
        "Identify the buyers with the most orders placed this year.",
        "Displays the available stock for items with order deliveries due in the next 15 days.",
        "For each buyer order status, show how many unique buyer orders exist and the total stock quantity linked to them."
    ];

    return (
        <div className="border-t border-border bg-background p-4">
            <div className="max-w-4xl mx-auto">
                {/* Toggle button */}
                {!currentQuery && !localQuery && !selectedExample && (
                    <div className="mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowExamples(!showExamples)}
                            className="flex items-center gap-2 text-xs text-muted-foreground border-border hover:bg-muted hover:text-foreground transition-smooth"
                        >
                            {showExamples ? (
                                <>
                                    Hide Prompts <ChevronUp className="w-3 h-3" />
                                </>
                            ) : (
                                <>
                                    View Prompts <ChevronDown className="w-3 h-3" />
                                </>
                            )}
                        </Button>

                        {/* Collapsible content */}
                        {showExamples && (
                            <div className="mt-3">
                                <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                                <div className="flex flex-wrap gap-2">
                                    {exampleQueries.map((query, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setLocalQuery(query)
                                                setSelectedExample(query)
                                            }}
                                            className="text-xs text-muted-foreground border-border hover:bg-muted hover:text-foreground transition-smooth"
                                        >
                                            {query}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Selected example above input */}
                {/* {selectedExample && (
                    <div className="flex items-center justify-between bg-muted text-foreground text-sm rounded-md px-3 py-2 mb-2">
                        <span>{selectedExample}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedExample(null)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )} */}

                {/* Input area */}
                <div className="relative">
                    <Textarea
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question about your data in natural language..."
                        className="min-h-[60px] max-h-[200px] pr-12 resize-none bg-muted border-border text-foreground placeholder:text-muted-foreground focus:ring-blue-600 focus:border-blue-600 transition-smooth"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={(!localQuery.trim() && !selectedExample) || isLoading}
                        size="sm"
                        className="absolute right-2 bottom-2 bg-blue-600 hover:bg-blue-600/90 text-white transition-smooth"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <p>Press Enter to send, Shift+Enter for new line</p>
                    <p>{localQuery.length}/500</p>
                </div>
            </div>
        </div>
    );
}

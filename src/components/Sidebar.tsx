import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSqlStore } from '@/store/sqlStore';
import { cn } from '@/lib/utils';

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
    const {
        conversations,
        currentConversation,
        startNewConversation,
        loadConversation,
        deleteConversation,
    } = useSqlStore();

    // const [isOpen, setIsOpen] = useState(false);

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        // Format time in hh:mm AM/PM
        const timeString = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        if (days === 0) return `Today • ${timeString}`;
        if (days === 1) return `Yesterday • ${timeString}`;
        if (days < 7) return `${days} days ago • ${timeString}`;
        return `${date.toLocaleDateString()} • ${timeString}`;
    };


    return (
        <>
            {/* Mobile Header with toggle */}


            {/* Backdrop overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed lg:static top-0 left-0 h-full w-72 bg-background border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out z-50",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    "lg:translate-x-0 lg:w-80"
                )}
            >
                {/* Mobile Close Button */}
                <div className="lg:hidden flex justify-between items-center p-4 border-b border-border">
                    <h1 className="text-sm font-semibold">Menu</h1>
                    <Button
                        // className='bg-white'
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                {/* Header */}
                <div className="hidden lg:flex flex-col items-center justify-center p-6 border-b border-border">
                    {/* Logo */}
                    {/* <img
                        src={"/src/assets/wfxlogo.png"}
                        alt="WFX Logo"
                        className="w-16 h-16 mb-2 object-contain"
                    /> */}
                    {/* Title */}
                    <h1 className="text-foreground text-lg font-semibold tracking-tight">
                        WFX NL2SQL Converter
                    </h1>
                    {/* Subtitle */}
                    <p className="text-xs text-muted-foreground mt-1">Natural Language → SQL</p>
                </div>

                {/* New Conversation */}
                <div className="p-4 border-b border-border">
                    <Button
                        onClick={() => {
                            startNewConversation();
                            setIsOpen(false);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-600/70 text-primary-foreground font-medium shadow-md rounded-lg"
                        size="lg"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Question
                    </Button>
                </div>

                {/* Conversations List */}
                <ScrollArea className="flex-1 px-3 py-4">
                    <div className="space-y-1">
                        {conversations.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-medium">No conversations yet</p>
                                <p className="text-xs opacity-70">Start by asking a question</p>
                            </div>
                        ) : (
                            conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className={cn(
                                        "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                        "hover:bg-muted/50",
                                        currentConversation?.id === conversation.id && "bg-muted"
                                    )}
                                    onClick={() => {
                                        loadConversation(conversation.id);
                                        setIsOpen(false); // close drawer on mobile
                                    }}
                                >
                                    <div className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 flex-shrink-0">
                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                    </div>

                                    {/* Text container */}
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="text-sm w-full max-w-40 font-medium text-foreground truncate">
                                            {conversation.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {formatDate(conversation.createdAt)}
                                        </p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity flex-shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteConversation(conversation.id);
                                        }}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/30">
                    <div className="text-xs text-muted-foreground text-center leading-relaxed">
                        <p className="font-medium text-foreground">SQL Converter v1.0</p>
                        <p className="opacity-70">Built for Natural Language → SQL</p>
                    </div>
                </div>
            </div>
        </>
    );
}

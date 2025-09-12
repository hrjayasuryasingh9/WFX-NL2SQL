import { MainContent } from '@/components/MainContent';
import { Sidebar } from '@/components/Sidebar';
import { useState } from 'react';

const Index = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
            <MainContent setIsOpen={setIsOpen} />
        </div>
    );
};

export default Index;

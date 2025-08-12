"use client";

import React, { useState } from 'react';
import ChatInterface from '@/components/dashboard/ChatInterface';
import { DUMMY_CHANNELS, DUMMY_MESSAGES } from '@/lib/dummy-chat-data';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function ChatPage() {
    const [activeChannelId, setActiveChannelId] = useState('2');
    const [newMessage, setNewMessage] = useState('');

    const activeChannel = DUMMY_CHANNELS.find(c => c.id === activeChannelId);
    const messages = DUMMY_MESSAGES.filter(m => m.channelId === activeChannelId);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        console.log(`Sending to channel ${activeChannelId}: ${newMessage}`);
        setNewMessage('');
    };

    return (
        <main className="h-screen w-screen bg-gray-100 flex flex-col p-4">
            <ChatInterface
                channels={DUMMY_CHANNELS}
                messages={messages}
                activeChannel={activeChannel!}
                newMessage={newMessage}
                onNewMessageChange={setNewMessage}
                onChannelSelect={setActiveChannelId}
                onSendMessage={handleSendMessage}
                headerActions={
                    <Link href="/dashboard" className="flex items-center gap-1 p-1 text-gray-500 hover:text-gray-800" title="Back to Dashboard">
                        <ChevronLeft size={20} /> Back
                    </Link>
                }
            />
        </main>
    );
}
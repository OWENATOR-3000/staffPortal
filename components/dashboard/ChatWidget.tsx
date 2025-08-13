"use client";

import React, { useState, useRef, useEffect } from 'react';
import { DUMMY_CHANNELS, DUMMY_MESSAGES, DUMMY_USERS } from '@/lib/dummy-chat-data';
import { Send, X, Maximize, Code, Globe, Megaphone, Paintbrush, MessageSquare } from 'lucide-react';
import Link from 'next/link';

// A map to dynamically render icons based on the channel data
const icons: { [key: string]: React.ElementType } = {
    Megaphone,
    Globe,
    Code,
    Paintbrush
};

// --- Main Chat Widget Component ---
export default function ChatWidget() {
    // NEW: State to control if the widget is open or minimized
    const [isWidgetOpen, setIsWidgetOpen] = useState(false);

    const [activeChannelId, setActiveChannelId] = useState('2'); // Default to 'General' channel
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeChannel = DUMMY_CHANNELS.find(c => c.id === activeChannelId);
    const messages = DUMMY_MESSAGES.filter(m => m.channelId === activeChannelId);

    // Auto-scroll to the latest message when the widget is open
    useEffect(() => {
        if (isWidgetOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isWidgetOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        console.log(`Sending to channel ${activeChannelId}: ${newMessage}`);
        setNewMessage('');
    };

    // NEW: Function to toggle the widget's state
    const toggleWidget = () => {
        setIsWidgetOpen(!isWidgetOpen);
    };

    return (
        <>
            {/* Conditional Rendering: Show full widget or minimized bubble */}
            {isWidgetOpen ? (
                // --- FULL CHAT WIDGET (Visible) ---
                <div className="fixed bottom-0 right-4 w-full max-w-lg h-[600px] bg-white rounded-t-lg shadow-2xl border border-gray-200 flex flex-col z-50">
                    <div className="flex flex-grow h-full min-h-0">
                        {/* Sidebar: Channel List */}
                        <aside className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
                            <div className="p-4 border-b">
                                <h2 className="font-bold text-lg text-gray-800">Channels</h2>
                            </div>
                            <nav className="flex-grow overflow-y-auto">
                                {DUMMY_CHANNELS.map(channel => {
                                    const Icon = icons[channel.icon];
                                    return (
                                        <button
                                            key={channel.id}
                                            onClick={() => setActiveChannelId(channel.id)}
                                            className={`w-full text-left flex items-center gap-3 p-3 text-sm font-medium transition-colors ${activeChannelId === channel.id ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {Icon && <Icon size={18} />}
                                            <span>{channel.name}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </aside>

                        {/* Main Chat Area */}
                        <main className="w-2/3 flex flex-col h-full">
                            {/* Chat Header */}
                            <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-white flex-shrink-0">
                                <h3 className="font-bold text-gray-900">{activeChannel?.name || 'Chat'}</h3>
                                <div className="flex items-center gap-2">
                                    <button className="p-1 text-gray-500 hover:text-gray-800" title="Expand (Feature coming soon)">
                                        <Link href="/dashboard/chat" className="p-1 text-gray-500 hover:text-gray-800" title="Open in full page">
                                    <Maximize size={18} />
                                </Link>
                                       
                                    </button>
                                    {/* UPDATED: Close button now toggles the widget */}
                                    <button onClick={toggleWidget} className="p-1 text-gray-500 hover:text-gray-800" title="Close">
                                        <X size={20} />
                                    </button>
                                </div>
                            </header>

                            {/* Message List */}
                            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                                {messages.map(message => {
                                    const user = DUMMY_USERS.find(u => u.id === message.userId);
                                    return (
                                        <div key={message.id} className="flex items-start gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                                {user?.initial}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline gap-2">
                                                    <p className="font-bold text-sm text-gray-800">{user?.name}</p>
                                                    <p className="text-xs text-gray-400">{message.timestamp}</p>
                                                </div>
                                                <p className="text-sm text-gray-700">{message.text}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={`Message in ${activeChannel?.name}`}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-800"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                handleSendMessage(e);
                                            }
                                        }}
                                    />
                                    <button type="submit" className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={!newMessage.trim()}>
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </main>
                    </div>
                </div>
            ) : (
                // --- MINIMIZED CHAT BUBBLE (Visible when closed) ---
                <button
                    onClick={toggleWidget}
                    className="fixed bottom-4 right-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110 z-50"
                    title="Open Chat"
                >
                    <MessageSquare size={32} />
                </button>
            )}
        </>
    );
}
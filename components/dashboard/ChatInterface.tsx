"use client";

import React, { useRef, useEffect } from 'react';
import { Send, Code, Globe, Megaphone, Paintbrush } from 'lucide-react';
import { DUMMY_USERS } from '@/lib/dummy-chat-data'; // Assuming dummy data is used for now

// A map to dynamically render icons based on the channel data
const icons: { [key: string]: React.ElementType } = {
    Megaphone, Globe, Code, Paintbrush
};

// Define specific interfaces for your data structures
interface Channel {
    id: string;
    name: string;
    icon: string; // The key for the 'icons' map
}

interface Message {
    id: string;
    userId: string;
    text: string;
    timestamp: string;
}

// The new, fully-typed props interface
interface ChatInterfaceProps {
    channels: Channel[];
    messages: Message[];
    activeChannel: Channel | null; // A channel can be null if none is selected
    newMessage: string;
    onChannelSelect: (channelId: string) => void;
    onNewMessageChange: (message: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
    headerActions?: React.ReactNode;
}

export default function ChatInterface({
    channels,
    messages,
    activeChannel,
    newMessage,
    onChannelSelect,
    onNewMessageChange,
    onSendMessage,
    headerActions
}: ChatInterfaceProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    return (
        <div className="flex flex-grow h-full min-h-0 bg-white border border-gray-200 rounded-t-lg">
            {/* Sidebar: Channel List */}
            <aside className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col rounded-tl-lg">
                <div className="p-4 border-b"><h2 className="font-bold text-lg text-gray-800">Channels</h2></div>
                <nav className="flex-grow overflow-y-auto">
                    {channels.map(channel => {
                        const Icon = icons[channel.icon];
                        return (
                           <button key={channel.id} onClick={() => onChannelSelect(channel.id)} className={`w-full text-left flex items-center gap-3 p-3 text-sm font-medium transition-colors ${activeChannel?.id === channel.id ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                               {Icon && <Icon size={18} />}
                               <span>{channel.name}</span>
                           </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Chat Area */}
            <main className="w-2/3 flex flex-col h-full">
                <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-white flex-shrink-0 rounded-tr-lg">
                    <h3 className="font-bold text-gray-900">{activeChannel?.name || 'Chat'}</h3>
                    <div className="flex items-center gap-2">{headerActions}</div>
                </header>

                <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                    {messages.map(message => {
                        const user = DUMMY_USERS.find(u => u.id === message.userId);
                        return (
                            <div key={message.id} className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">{user?.initial}</div>
                                <div>
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

                <div className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={onSendMessage} className="flex items-center gap-2">
                        <textarea value={newMessage} onChange={(e) => onNewMessageChange(e.target.value)} placeholder={`Message in ${activeChannel?.name}`} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" rows={1} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { onSendMessage(e); } }} />
                        <button type="submit" className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={!newMessage.trim()}><Send size={20} /></button>
                    </form>
                </div>
            </main>
        </div>
    );
}
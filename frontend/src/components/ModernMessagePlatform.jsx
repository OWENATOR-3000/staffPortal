import React, { useState, useEffect, useRef } from 'react';
import './MessagePlatform.css';

// Modern messaging platform with WhatsApp-like behavior
const ModernMessagePlatform = ({ currentUser }) => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentChat, setCurrentChat] = useState(null);
    const [socket, setSocket] = useState(null);
    const [unreadMessages, setUnreadMessages] = useState({});
    const [employeeChatMap, setEmployeeChatMap] = useState({});
    const [lastMessageTimes, setLastMessageTimes] = useState({});
    const messagesEndRef = useRef(null);

    // WebSocket setup
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080');
        setSocket(ws);
        ws.onopen = () => console.log('WebSocket Connected');
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if ((data.type === 'chatMessage' || data.type === 'newMessage') && data.message) {
                    const { chat_id, sender_id, content } = data.message;
                    if (chat_id && sender_id && content) {
                        if (sender_id === currentUser.id) return;
                        setLastMessageTimes((prev) => ({ ...prev, [chat_id]: Date.now() }));
                        if (chat_id === currentChat?.id) {
                            setMessages((prevMessages) => {
                                if (!prevMessages.some((msg) => msg.id === data.message.id)) {
                                    return [...prevMessages, data.message];
                                }
                                return prevMessages;
                            });
                        } else {
                            setUnreadMessages((prev) => ({ ...prev, [chat_id]: (prev[chat_id] || 0) + 1 }));
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };
        return () => ws.close();
    }, [currentChat, currentUser.id]);

    // Fetch employees, chats, unread counts
    useEffect(() => {
        fetchEmployees();
        fetchChats();
        fetchUnreadCounts();
    }, [currentUser.id]);

    useEffect(() => { scrollToBottom(); }, [messages]);
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

    const fetchEmployees = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/staff_members');
            if (!response.ok) throw new Error('Failed to fetch employees');
            const data = await response.json();
            setEmployees(data.filter((emp) => emp.id !== currentUser.id));
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchChats = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/chats/user/${currentUser.id}`);
            const chats = await response.json();
            const chatMap = {};
            const messageTimes = {};
            chats.forEach((chat) => {
                const otherParticipant = chat.participants.find((id) => id !== currentUser.id);
                chatMap[otherParticipant] = chat.id;
                messageTimes[chat.id] = new Date(chat.last_message_time).getTime();
            });
            setEmployeeChatMap(chatMap);
            setLastMessageTimes(messageTimes);
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    const fetchUnreadCounts = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/unread/${currentUser.id}`);
            const data = await response.json();
            const counts = {};
            data.forEach((item) => { counts[item.chat_id] = item.count; });
            setUnreadMessages(counts);
        } catch (error) {
            console.error('Error fetching unread counts:', error);
        }
    };

    const handleSelectEmployee = async (employee) => {
        setSelectedEmployee(employee);
        const chatId = employeeChatMap[employee.id];
        if (chatId) {
            setCurrentChat({ id: chatId, participants: [currentUser.id, employee.id] });
            fetchMessages(chatId);
            try {
                await fetch('http://localhost:8080/api/markAsRead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser.id, chatId }),
                });
                setUnreadMessages((prev) => ({ ...prev, [chatId]: 0 }));
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        } else {
            try {
                const createResponse = await fetch('http://localhost:8080/api/chats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participants: [currentUser.id, employee.id] }),
                });
                const newChat = await createResponse.json();
                setCurrentChat({ id: newChat.id, participants: [currentUser.id, employee.id] });
                setEmployeeChatMap((prev) => ({ ...prev, [employee.id]: newChat.id }));
                setMessages([]);
            } catch (error) {
                console.error('Error creating new chat:', error);
            }
        }
    };

    const fetchMessages = async (chatId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/messages/chat/${chatId}`);
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // WhatsApp-like sorting
    const sortedEmployees = [...employees].sort((a, b) => {
        const timeA = lastMessageTimes[employeeChatMap[a.id]] || 0;
        const timeB = lastMessageTimes[employeeChatMap[b.id]] || 0;
        return timeB - timeA;
    });

    // Optimistic send
    const handleSendMessage = () => {
        if (newMessage.trim() && currentChat && socket) {
            if (socket.readyState === WebSocket.OPEN) {
                const messageData = {
                    type: 'chatMessage',
                    chat_id: currentChat.id,
                    sender_id: currentUser.id,
                    content: newMessage,
                };
                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        id: `temp-${Date.now()}`,
                        chat_id: currentChat.id,
                        sender_id: currentUser.id,
                        content: newMessage,
                        timestamp: new Date().toISOString(),
                    },
                ]);
                setLastMessageTimes((prev) => ({ ...prev, [currentChat.id]: Date.now() }));
                setNewMessage('');
                socket.send(JSON.stringify(messageData));
            } else {
                console.warn('WebSocket is not open. Message cannot be sent at this time.');
            }
        }
    };

    return (
        <div className="chat-container animated fadeInDown">
            <div className="employee-list">
                <div className="employee-list-header">Chat Contacts</div>
                {sortedEmployees.map((employee) => {
                    const chatId = employeeChatMap[employee.id];
                    const unreadCount = unreadMessages[chatId] || 0;
                    return (
                        <div
                            key={employee.id}
                            className={`employee-item ${selectedEmployee?.id === employee.id ? 'selected' : ''}`}
                            onClick={() => handleSelectEmployee(employee)}
                        >
                            <div className="employee-avatar">{employee.name[0]}</div>
                            <span className="employee-name">{employee.name}</span>
                            {unreadCount > 0 && <div className="unread-badge">{unreadCount}</div>}
                        </div>
                    );
                })}
            </div>
            <div className="vertical-divider"></div>
            <div className="chat-window">
                {selectedEmployee ? (
                    <>
                        <div className="chat-header">{selectedEmployee.name}</div>
                        <div className="messages-container">
                            {messages.map((message) => {
                                const isSentByCurrentUser = message.sender_id === currentUser.id;
                                return (
                                    <div
                                        key={message.id}
                                        className={`message ${isSentByCurrentUser ? 'sent' : 'received'}`}
                                    >
                                        <div className={`message-bubble ${isSentByCurrentUser ? 'sent' : 'received'}`}>
                                            <p className="message-content">{message.content}</p>
                                            <p className="message-time">
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="message-input-container">
                            <input
                                type="text"
                                className="message-input"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSendMessage();
                                        e.preventDefault();
                                    }
                                }}
                                placeholder="Type a message..."
                            />
                            <button
                                className="send-button"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                            >
                                <span>↑</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="empty-state">Select an employee to start a conversation.</div>
                )}
            </div>
        </div>
    );
};

export default ModernMessagePlatform;

import React, { useState, useEffect, useRef } from 'react';
import './MessagePlatform.css';

// Helper to generate a unique client_id
function generateClientId() {
  return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Define the main component SimpleChatPlatform, which takes the current user as a prop
const SimpleChatPlatform = ({ currentUser }) => {
  // Set up state variables
  const [employees, setEmployees] = useState([]); // List of all employees
  const [selectedEmployee, setSelectedEmployee] = useState(null); // Currently selected employee for chatting
  const [messages, setMessages] = useState([]); // Messages in the current chat
  const [newMessage, setNewMessage] = useState(''); // New message being typed by the user
  const [currentChat, setCurrentChat] = useState(null); // Information about the current chat session
  const [socket, setSocket] = useState(null); // WebSocket connection object
  const [unreadMessages, setUnreadMessages] = useState({}); // Track unread messages for different chats
  const [employeeChatMap, setEmployeeChatMap] = useState({}); // Map of employees to their chat sessions
  const [lastMessageTimes, setLastMessageTimes] = useState({}); // Store the last message time for each chat
  const messagesEndRef = useRef(null); // Reference to the end of the messages list for scrolling

  // Establish WebSocket connection when the component loads
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080'); // WebSocket URL for server
    setSocket(ws); // Save WebSocket object to state

    // When the WebSocket connection opens
    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    // When a message is received from the server
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);

        if ((data.type === 'chatMessage' || data.type === 'newMessage') && data.message) {
          const { chat_id, sender_id, content, id, client_id } = data.message;
          if (chat_id && sender_id && content) {
            if (client_id) {
              // Remove temp message with matching client_id and add real message
              setMessages((prevMessages) => {
                let filtered = prevMessages.filter((msg) => msg.client_id !== client_id);
                if (!filtered.some((msg) => msg.id === id)) {
                  filtered = [...filtered, data.message];
                }
                return filtered;
              });
            } else {
              // Fallback: old logic for messages without client_id
              setMessages((prevMessages) => {
                if (!prevMessages.some((msg) => msg.id === id)) {
                  return [...prevMessages, data.message];
                }
                return prevMessages;
              });
            }

            // Update lastMessageTimes for this chat
            setLastMessageTimes((prev) => ({
              ...prev,
              [chat_id]: Date.now(),
            }));

            if (chat_id !== currentChat?.id) {
              setUnreadMessages((prev) => ({
                ...prev,
                [chat_id]: (prev[chat_id] || 0) + 1,
              }));
            }
          } else {
            console.warn('Incomplete message data received:', data.message);
          }
        } else {
          console.warn('Unexpected message format:', data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    // Clean up the WebSocket connection when the component is unmounted
    return () => {
      ws.close();
    };
  }, [currentChat, currentUser.id]); // Re-run this effect whenever currentChat or currentUser.id changes

  // Fetch employees, chats, and unread counts when the component loads
  useEffect(() => {
    fetchEmployees(); // Get the list of employees
    fetchChats(); // Get the list of chats for the current user
    fetchUnreadCounts(); // Get the number of unread messages for each chat
  }, [currentUser.id]); // Re-run this effect when currentUser.id changes

  // Scroll to the bottom of the messages list whenever messages change
  useEffect(() => {
    scrollToBottom(); // Ensure chat window stays scrolled to the most recent message
  }, [messages]);

  // Helper function to scroll to the bottom of the chat window
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch the list of employees from the server
  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/staff_members');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      console.log('Fetched employees:', data); // Log fetched employees for debugging
      setEmployees(data.filter((emp) => emp.id !== currentUser.id)); // Filter out the current user from the list
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch the list of chat sessions for the current user
  const fetchChats = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/chats/user/${currentUser.id}`);
      const chats = await response.json();
      const chatMap = {};
      const messageTimes = {};

      // Create a map of employees to their chat sessions
      chats.forEach((chat) => {
        const otherParticipant = chat.participants.find((id) => id !== currentUser.id);
        chatMap[otherParticipant] = chat.id;
        // Use last_message_time from the backend, fallback to created_at if missing
        const lastTime = chat.last_message_time || chat.created_at;
        messageTimes[chat.id] = lastTime ? new Date(lastTime).getTime() : 0;
      });

      setEmployeeChatMap(chatMap);
      setLastMessageTimes(messageTimes);
      console.log('Employee-Chat Map:', chatMap);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Fetch the count of unread messages for each chat
  const fetchUnreadCounts = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/unread/${currentUser.id}`);
      const data = await response.json();
      const counts = {};

      data.forEach((item) => {
        counts[item.chat_id] = item.count; // Store unread message count per chat
      });

      setUnreadMessages(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  // When an employee is selected for chatting
  const handleSelectEmployee = async (employee) => {
    setSelectedEmployee(employee); // Set the selected employee
    const chatId = employeeChatMap[employee.id]; // Get the chat session ID for the employee

    if (chatId) {
      // If a chat exists, load the chat messages
      console.log(`Selecting existing chat: ${chatId} for employee: ${employee.id}`);
      setCurrentChat({ id: chatId, participants: [currentUser.id, employee.id] });
      fetchMessages(chatId); // Fetch the messages for the selected chat

      // Mark all messages as read in the chat
      try {
        await fetch('http://localhost:8080/api/markAsRead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, chatId }),
        });
        setUnreadMessages((prev) => ({ ...prev, [chatId]: 0 })); // Clear unread messages for this chat
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    } else {
      // If no chat exists, create a new one
      console.log(`Creating new chat for employee: ${employee.id}`);
      try {
        const createResponse = await fetch('http://localhost:8080/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participants: [currentUser.id, employee.id] }),
        });
        const newChat = await createResponse.json();
        setCurrentChat({ id: newChat.id, participants: [currentUser.id, employee.id] });
        setEmployeeChatMap((prev) => ({ ...prev, [employee.id]: newChat.id })); // Update the chat map with the new chat
        setMessages([]); // Clear the message list for the new chat
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    }
  };

  // Fetch the messages for a specific chat
  const fetchMessages = async (chatId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/messages/chat/${chatId}`);
      const data = await response.json();
      // Only use server messages, remove any optimistic (temp) messages
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim() && currentChat && socket) {
      if (socket.readyState === WebSocket.OPEN) {
        const client_id = generateClientId();
        const messageData = {
          type: 'chatMessage',
          chat_id: currentChat.id,
          sender_id: currentUser.id,
          content: newMessage,
          client_id, // Add client_id to payload
        };
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: client_id, // Use client_id as temp id
            chat_id: currentChat.id,
            sender_id: currentUser.id,
            content: newMessage,
            timestamp: new Date().toISOString(),
            client_id,
          },
        ]);
        setLastMessageTimes((prev) => ({
          ...prev,
          [currentChat.id]: Date.now(),
        }));
        setNewMessage('');
        socket.send(JSON.stringify(messageData));
      } else {
        console.warn('WebSocket is not open. Message cannot be sent at this time.');
      }
    }
  };

  // Sort employees based on the time of the last message in their chat
  const sortedEmployees = [...employees].sort((a, b) => {
    const timeA = lastMessageTimes[employeeChatMap[a.id]] || 0;
    const timeB = lastMessageTimes[employeeChatMap[b.id]] || 0;
    return timeB - timeA;
  });

  useEffect(() => {
    console.log('Updated messages:', messages);
  }, [messages]); // This will log messages every time the state updates

  // Render the chat interface
  return (
    <div className="chat-container animated fadeInDown">
      {/* Employee list - left side */}
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
              <div className="employee-avatar">
                {employee.name[0]}
              </div>
              <span className="employee-name">{employee.name}</span>
              {unreadCount > 0 && (
                <div className="unread-badge">
                  {unreadCount}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Vertical divider */}
      <div className="vertical-divider"></div>
      {/* Chat window where messages are displayed */}
      <div className="chat-window">
        {selectedEmployee ? (
          <>
            {/* Display the selected employee's name at the top */}
            <div className="chat-header">
              {selectedEmployee.name}
            </div>
            {/* Message history */}
            <div className="messages-container">
              {messages.map((message) => {
                const isSentByCurrentUser = message.sender_id === currentUser.id;
                return (
                  <div
                    key={message.id}
                    className={`message ${isSentByCurrentUser ? 'sent' : 'received'}`}
                  >
                    <div
                      className={`message-bubble ${isSentByCurrentUser ? 'sent' : 'received'}`}
                    >
                      <p className="message-content">{message.content}</p>
                      <p className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              {/* Empty div used to scroll to the bottom of the chat */}
              <div ref={messagesEndRef} />
            </div>
            {/* Input box and send button for new messages */}
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
          <div className="empty-state">
            Select an employee to start a conversation.
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleChatPlatform; // Export the component for use in other parts of the app

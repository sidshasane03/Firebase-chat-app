import { useState, useEffect, useRef } from 'react';
import { addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import * as presenceService from './presenceService';
import * as messageStatusService from './messageStatusService';
import { createDebounce } from './utils/debounce';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userStatus, setUserStatus] = useState({ status: 'online', isTyping: false });
  const [otherUsers, setOtherUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const user = auth.currentUser;
  const typingDebounceRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      const unreadMessages = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({ id: doc.id, ...data });

        // Mark delivered if message is from others and not yet delivered
        if (data.uid !== user?.uid && (!data.status || data.status === 'sent')) {
          messageStatusService.markMessageAsDelivered(doc.id);
        }

        // Collect unread messages from others
        if (data.uid !== user?.uid && data.status !== 'read') {
          unreadMessages.push(doc.id);
        }
      });

      setMessages(messages);

      // Mark unread messages as read after a short delay
      if (unreadMessages.length > 0) {
        const timer = setTimeout(() => {
          messageStatusService.markMessagesAsRead(unreadMessages);
        }, 500);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Set user online and subscribe to their status
  useEffect(() => {
    if (!user) return;

    // Set user as online
    presenceService.setUserOnline(user.uid, {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    });

    // Subscribe to this user's status
    const unsubscribeStatus = presenceService.subscribeToUserStatus(user.uid, (status) => {
      setUserStatus(status);
    });

    // Subscribe to other users' status
    const unsubscribeOtherUsers = presenceService.subscribeToOtherUsersStatus(user.uid, (users) => {
      setOtherUsers(users);
    });

    // Set user offline when component unmounts
    const handleBeforeUnload = () => {
      presenceService.setUserOffline(user.uid);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribeStatus?.();
      unsubscribeOtherUsers?.();
      presenceService.setUserOffline(user.uid);
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    // Store the message
    const messageToSend = newMessage.trim();

    // Clear input immediately using DOM ref for instant UI feedback
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setNewMessage('');

    // Cancel typing debounce and set typing to false
    if (typingDebounceRef.current) {
      typingDebounceRef.current.cancel();
    }
    presenceService.setUserTyping(user.uid, false);

    try {
      const { uid, displayName, email } = auth.currentUser;
      await addDoc(collection(db, 'messages'), {
        text: messageToSend,
        timestamp: serverTimestamp(),
        uid,
        displayName: displayName || email.split('@')[0],
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if sending failed
      setNewMessage(messageToSend);
      if (inputRef.current) {
        inputRef.current.value = messageToSend;
      }
    }
  };

  // Handle input change with typing debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!user) return;

    if (value.trim() !== '') {
      // User is typing
      presenceService.setUserTyping(user.uid, true);

      // Reset the debounce timer
      if (!typingDebounceRef.current) {
        typingDebounceRef.current = createDebounce(() => {
          presenceService.setUserTyping(user.uid, false);
        }, 2500); // 2.5 seconds
      }

      typingDebounceRef.current();
    } else {
      // Input is empty, stop typing
      if (typingDebounceRef.current) {
        typingDebounceRef.current.cancel();
      }
      presenceService.setUserTyping(user.uid, false);
    }
  };

  // Helper function to render status ticks
  const renderStatusTicks = (message) => {
    if (message.uid !== user?.uid) return null; // Only show ticks for sent messages

    const status = message.status || 'sent';

    if (status === 'read') {
      return <span className="message-ticks read" title="Read">✓✓</span>;
    } else if (status === 'delivered') {
      return <span className="message-ticks delivered" title="Delivered">✓✓</span>;
    } else {
      return <span className="message-ticks sent" title="Sent">✓</span>;
    }
  };

  // Helper function to render status indicator
  const renderStatusIndicator = () => {
    if (userStatus.isTyping) {
      return (
        <div className="status-container">
          <div className="typing-animation">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
          <span className="status-text typing">typing...</span>
        </div>
      );
    }

    if (userStatus.status === 'online') {
      return (
        <div className="status-container">
          <span className="status-dot online"></span>
          <span className="status-text online">online</span>
        </div>
      );
    }

    return (
      <div className="status-container">
        <span className="status-dot offline"></span>
        <span className="status-text offline">
          Last seen: {presenceService.formatLastSeen(userStatus.lastSeen)}
        </span>
      </div>
    );
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-main">
        <div className="chat-header">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="profile-photo"
            />
          ) : (
            <div className="profile-photo-fallback">
              {user.email[0].toUpperCase()}
            </div>
          )}
          <div className="profile-info">
            <span className="profile-name">{user.displayName || user.email.split('@')[0]}</span>
            {renderStatusIndicator()}
          </div>
        </div>
        <div className="messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.uid === auth.currentUser?.uid ? 'sent' : 'received'}`}
            >
              <span className={`sender ${message.uid === auth.currentUser?.uid ? 'sent' : ''}`}>
                {message.displayName}
              </span>
              <div className="message-content">
                <p>{message.text}</p>
                {renderStatusTicks(message)}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="message-form">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>

      {/* Users List Sidebar */}
      <div className="users-sidebar">
        <div className="users-sidebar-title">Active Users</div>
        {otherUsers.length > 0 ? (
          otherUsers.map((otherUser) => (
            <div key={otherUser.uid} className="user-item">
              {otherUser.photoURL ? (
                <img
                  src={otherUser.photoURL}
                  alt={otherUser.displayName}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar">
                  {otherUser.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="user-info">
                <div className="user-name">{otherUser.displayName}</div>
                <div className="user-status">
                  {otherUser.isTyping ? (
                    <>
                      <span className="user-status-dot typing"></span>
                      <span className="user-status-text">typing</span>
                    </>
                  ) : otherUser.status === 'online' ? (
                    <>
                      <span className="user-status-dot online"></span>
                      <span className="user-status-text">online</span>
                    </>
                  ) : (
                    <>
                      <span className="user-status-dot offline"></span>
                      <span className="user-status-text">
                        {presenceService.formatLastSeen(otherUser.lastSeen)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '15px', opacity: 0.5, textAlign: 'center' }}>
            No other users online
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
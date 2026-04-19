import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import ChatMessage from './ChatMessage';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const QUICK_ACTIONS = [
  'Top Critical Issues',
  'System Summary',
  'Why is this critical?',
  'What should we do?'
];

const Chatbot = ({ dashboard = 'Dashboard' }) => {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `AI Assistant ready for ${dashboard}. Ask about priorities, summary, or recommended actions.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Ensure component mounts on client side
  useEffect(() => {
    setMounted(true);
    console.log('✅ Chatbot component mounted on:', dashboard);
    console.log('🔌 API Base URL:', API_BASE);
    console.log('🎯 Auth token exists:', !!localStorage.getItem('access_token'));
  }, []);

  const canSend = useMemo(() => !isLoading && input.trim().length > 0, [isLoading, input]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendQuery = async (queryText) => {
    const text = String(queryText || '').trim();
    if (!text || isLoading) return;

    console.log('📤 Sending chat query:', text);
    console.log('🎯 Dashboard:', dashboard);
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token') || '';
      if (!token) {
        console.warn('⚠️ No auth token found');
        throw new Error('Not authenticated');
      }
      console.log('🔐 Auth token present:', token.length > 0);
      
      const requestBody = { query: text };
      console.log('📨 Request body:', requestBody);
      
      const response = await fetch(`${API_BASE}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      console.log('✅ Response text length:', data?.response?.length || 0);
      
      const botReply = data?.response || 'Please run analysis first or try another question';

      setMessages((prev) => {
        const updated = [...prev, { sender: 'bot', text: botReply }];
        console.log('💬 Messages updated:', updated.length, 'total messages');
        return updated;
      });
    } catch (error) {
      console.error('🚨 Chat error:', error.message);
      const errorMsg = error.message.includes('not authenticated') 
        ? '🔐 Please login first' 
        : error.message.includes('HTTP') 
        ? '⚠️ Server error - run analysis first'
        : '⚠️ Unable to connect. Check backend is running on 127.0.0.1:8000';
      
      setMessages((prev) => [...prev, { sender: 'bot', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await sendQuery(input);
  };

  if (!mounted) {
    return null;
  }

  const chatbuttonStyle = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'inline-flex',
    height: '56px',
    width: '56px',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    transition: 'all 300ms ease',
  };

  const chatPanelStyle = {
    position: 'fixed',
    bottom: '96px',
    right: '16px',
    zIndex: 9998,
    width: 'calc(100vw - 2rem)',
    maxWidth: '400px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
    transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'auto' : 'none',
    transition: 'all 300ms ease',
    backgroundColor: 'white',
  };

  return createPortal(
    <>
      <button
        onClick={() => {
          console.log('Chat button clicked, isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
        style={chatbuttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.backgroundColor = '#1d4ed8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = '#2563eb';
        }}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      <div style={chatPanelStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', padding: '12px', color: 'white' }}>
          <Bot size={18} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>AI Assistant</p>
            <p style={{ fontSize: '12px', margin: '0', opacity: 0.8 }}>Decision Support</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              disabled={isLoading}
              onClick={() => sendQuery(action)}
              style={{
                borderRadius: '20px',
                border: '1px solid #dbeafe',
                backgroundColor: 'white',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#1d4ed8',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {action}
            </button>
          ))}
        </div>

        {/* Messages Area */}
        <div style={{ height: '320px', overflowY: 'auto', backgroundColor: 'white', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((message, index) => (
            <ChatMessage key={`${message.sender}-${index}`} sender={message.sender} text={message.text} />
          ))}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ borderRadius: '16px', border: '1px solid #e5e7eb', backgroundColor: '#f3f4f6', padding: '12px', fontSize: '14px', color: '#374151' }}>
                Typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={onSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #e5e7eb', padding: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about priorities, risks, actions..."
            style={{
              flex: 1,
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!canSend}
            style={{
              display: 'inline-flex',
              height: '40px',
              width: '40px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              backgroundColor: canSend ? '#2563eb' : '#93c5fd',
              color: 'white',
              border: 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>,
    document.body
  );
};

export default Chatbot;

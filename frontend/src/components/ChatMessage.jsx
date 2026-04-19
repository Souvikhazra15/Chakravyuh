import React from 'react';

const ChatMessage = ({ sender, text }) => {
  const isUser = sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-br-md bg-blue-600 text-white'
            : 'rounded-bl-md border border-gray-200 bg-gray-100 text-gray-800'
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatMessage;

import { useState } from 'react';

type chatMessage = {
  source: "user" | "ai";
  message: string
}

const Chat = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<chatMessage[]>([]);

  const handleSendMessage = () => {
    sendMessage(message);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    setChatHistory(prevChatHistory => [...prevChatHistory, { source: "user", message }]);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
    const data: any = await response.json();
    console.log(data); // Handle response from AI LLM

    setChatHistory(prevChatHistory => [...prevChatHistory, { source: "ai", message: data.response }]);
    setMessage(''); // Clear input after sending
  };

  return (
    <div>
      <div className='flex flex-col gap-2'>
        {chatHistory.map((msg, key) =>
          <div key={key} className='prose'>{msg.message}</div>
        )}
      </div>
      <div className="fixed bottom-0 left-0 w-full flex items-center gap-2 p-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300 border-gray-300"
        />
        <button className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
          onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;

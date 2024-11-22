import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown'

type chatMessage = {
  source: "user" | "ai";
  message: string
}

const Chat = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<chatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]); // Run when chatHistory changes


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
    <div className="flex flex-col h-screen">
      {/* Chat History Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {chatHistory.map((msg, key) => (
            <div key={key} className={`chat ${msg.source === "ai" ? "chat-start" : "chat-end"}`}>
              <div className={`prose chat-bubble ${msg.source === "ai" ? "chat-bubble-secondary" : "chat-bubble-primary"}`}>
                <ReactMarkdown>{msg.message}</ReactMarkdown>
              </div>
            </div>
          ))}
          {/* Dummy div to ensure we can scroll to the bottom */}
          <div ref={chatEndRef}></div>
        </div>
      </div>

      {/* Send Message Section */}
      <div className="flex items-center gap-2 p-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 input input-bordered"
        />
        <button className="btn btn-primary" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>

  );
};

export default Chat;

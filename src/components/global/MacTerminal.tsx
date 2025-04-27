import { useState, useEffect, useRef, useCallback } from 'react';
import { FaRegFolderClosed } from 'react-icons/fa6';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatHistory = {
  messages: Message[];
  input: string;
};

// Customize these placeholder messages for the input field
const PLACEHOLDER_MESSAGES = [
  'Type your question...',
  'How old are you?',
  'What are your skills?',
  'Where are you located?',
  'What projects have you worked on?',
];

export default function MacTerminal() {
  const [chatHistory, setChatHistory] = useState<ChatHistory>({
    messages: [],
    input: '',
  });
  const [isTyping, setIsTyping] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMouseNearTop, setIsMouseNearTop] = useState(false); // State to track if mouse is near the top bar

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentMessage = PLACEHOLDER_MESSAGES[currentPlaceholderIndex];

    const animatePlaceholder = () => {
      if (isDeleting) {
        if (placeholder.length === 0) {
          setIsDeleting(false);
          setCurrentPlaceholderIndex(
            (prev) => (prev + 1) % PLACEHOLDER_MESSAGES.length
          );
          timeout = setTimeout(animatePlaceholder, 400);
        } else {
          setPlaceholder((prev) => prev.slice(0, -1));
          timeout = setTimeout(animatePlaceholder, 80);
        }
      } else {
        if (placeholder.length === currentMessage.length) {
          timeout = setTimeout(() => setIsDeleting(true), 1500);
        } else {
          setPlaceholder(currentMessage.slice(0, placeholder.length + 1));
          timeout = setTimeout(animatePlaceholder, 120);
        }
      }
    };

    timeout = setTimeout(animatePlaceholder, 100);

    return () => clearTimeout(timeout);
  }, [placeholder, isDeleting, currentPlaceholderIndex]);

  // Customize this welcome message with your information
  const welcomeMessage = `Welcome to My Portfolio

Name: Marvin Ma
Role: Engineer, Developer, 90% useless trivia, 10% deep weirdness

GitHub: https://github.com/marv1nnnnn

Note: The AI chat feature is currently disabled.
`;

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // System prompt (Note: AI chat is disabled as per config)
  const systemPrompt = `IMPORTANT: You ARE Marvin Ma himself. You must always speak in first-person ("I", "my", "me"). Never refer to "Marvin" in third-person.
CURRENT DATE: ${formattedDate} - Always use this exact date when discussing the current date/year.

Example responses:
Q: "What's your background?"
A: "I'm an Engineer, Developer, and Artist."

Core details about me:
- I'm an Engineer, Developer, and Artist.
- My GitHub is https://github.com/marv1nnnnn

My technical expertise:
- Software Engineering
- Indie Game Development
- Digital Art

Response rules:
1. ALWAYS use first-person (I, me, my)
2. Never say "Marvin" or refer to myself in third-person
3. Keep responses concise and professional
4. Use markdown formatting when appropriate
5. Maintain a friendly, conversational tone

If a question is asked, respond with: "The AI chat feature is currently disabled. Please check out my GitHub profile or other links for more information."`;

  useEffect(() => {
    // Display only the welcome message since chat is disabled
    setChatHistory((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { role: 'assistant', content: welcomeMessage },
      ],
    }));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory.messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatHistory((prev) => ({ ...prev, input: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userInput = chatHistory.input.trim();

    if (!userInput) return;

    setChatHistory((prev) => ({
      messages: [...prev.messages, { role: 'user', content: userInput }],
      input: '',
    }));

    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...chatHistory.messages, { role: 'user', content: userInput }] }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      setChatHistory((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { role: 'assistant', content: data.message },
        ],
      }));
    } catch (error) {
      console.error('Error fetching chat response:', error);
      setChatHistory((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: 'assistant',
            content: `Error: Unable to get response. ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const terminalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Center the terminal initially
  useEffect(() => {
    const centerTerminal = () => {
      if (terminalRef.current) {
        const terminalWidth = terminalRef.current.offsetWidth;
        const terminalHeight = terminalRef.current.offsetHeight;
        const centerX = (window.innerWidth - terminalWidth) / 2;
        const centerY = (window.innerHeight - terminalHeight) / 2;
        setPosition({ x: centerX, y: centerY });
      }
    };

    centerTerminal();
    window.addEventListener('resize', centerTerminal);

    return () => window.removeEventListener('resize', centerTerminal);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (terminalRef.current) {
      setIsDragging(true);
      setOffset({
        x: e.clientX - terminalRef.current.getBoundingClientRect().left,
        y: e.clientY - terminalRef.current.getBoundingClientRect().top,
      });
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  }, [isDragging, offset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  return (
    <div
      ref={terminalRef}
      data-testid="mac-terminal" // Add data-testid here
      className='bg-black/75 w-[600px] h-[400px] rounded-lg overflow-hidden shadow-lg fixed'
      style={{ left: `${position.x}px`, top: `${position.y}px`, cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseMove={(e) => { // Add mouse move listener to the main terminal div
        if (terminalRef.current) {
          const terminalRect = terminalRef.current.getBoundingClientRect();
          const mouseY = e.clientY - terminalRect.top;
          // Define a threshold for "near the top bar" (e.g., the height of the top bar, which is h-6 ~ 24px)
          const topBarHeight = 24;
          setIsMouseNearTop(mouseY <= topBarHeight);
        }
      }}
      onMouseLeave={() => setIsMouseNearTop(false)} // Hide icon when mouse leaves terminal
    >
      <div
        className='bg-gray-800 h-6 flex items-center space-x-2 px-4 cursor-grab'
        onMouseDown={handleMouseDown}
      >
        <div className='w-3 h-3 rounded-full bg-red-500'></div>
        <div className='w-3 h-3 rounded-full bg-yellow-500'></div>
        <div className='w-3 h-3 rounded-full bg-green-500'></div>
        <span className='text-sm text-gray-300 flex-grow text-center font-semibold flex items-center justify-center gap-2'>
          <span data-testid="drag-icon" className={`flex items-center gap-2 transition-opacity duration-200 ${isMouseNearTop ? 'opacity-100' : 'opacity-0'}`}> {/* Conditionally apply opacity to icon */}
            <FaRegFolderClosed size={14} className='text-gray-300' />
          </span>
          marv1nnnnn.github.io ⸺ zsh
        </span>
      </div>
      <div className='p-4 text-gray-200 font-mono text-xs h-[calc(400px-1.5rem)] flex flex-col'>
        <div className='flex-1 overflow-y-auto'>
          {chatHistory.messages.map((msg, index) => (
            <div key={index} className='mb-2'>
              {msg.role === 'user' ? (
                <div className='flex items-start space-x-2'>
                  <span className='text-green-400'>{'>'}</span>
                  <pre className='whitespace-pre-wrap'>{msg.content}</pre>
                </div>
              ) : (
                <pre className='whitespace-pre-wrap'>{msg.content}</pre>
              )}
            </div>
          ))}
          {isTyping && <div className='animate-pulse'>...</div>}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className='mt-2'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'>
            {/* Customize the terminal title with your domain */}
            <span className='whitespace-nowrap'>marvin@marv1nnnnn.github.io ~ %</span>
            <input
              type='text'
              value={chatHistory.input}
              onChange={handleInputChange}
              className='w-full sm:flex-1 bg-transparent outline-none text-white placeholder-gray-400'
              placeholder={placeholder}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

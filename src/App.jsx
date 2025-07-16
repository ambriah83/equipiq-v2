import React, { useState, useEffect, useRef } from 'react';
import AdminDashboard from './components/AdminDashboard';

// --- ICONS (Lucide-React style inline SVGs) ---
const UserIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const BotIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);
const PaperclipIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
);
const SendIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
);
const MicIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
);
const MessageSquareIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const TicketIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
);
const SettingsIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.12l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.12l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const AdminIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const SunIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></svg>
);
const MoonIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);
const XIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const AlertTriangleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
);


// --- CONFIGURATION ---
const config = {
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    }
};

const initialMessages = [
  { id: 1, author: 'bot', text: "Welcome to EquipIQ. I'm here to help. What seems to be the problem?", actions: [], image: null },
];

// Fun thinking verbs for loading state
const thinkingVerbs = [
  "Pondering",
  "Churning",
  "Ruminating",
  "Excogitating",
  "Prognosticating",
  "Gestating",
  "Cogitating",
  "Mulling",
  "Noodling",
  "Percolating",
  "Marinating",
  "Brewing",
  "Incubating",
  "Processing",
  "Computing",
  "Contemplating",
  "Deliberating",
  "Musing",
  "Meditating",
  "Brainstorming",
  "Diagnosing",
  "Troubleshooting",
  "Calibrating",
  "Analyzing",
  "Debugging",
  "Investigating",
  "Decoding",
  "Scanning databases",
  "Consulting manuals",
  "Cross-referencing",
  "Running diagnostics",
  "Checking blueprints",
  "Perusing",
  "Marinading",
  "Concocting",
  "Scheming",
  "Divining",
  "Spelunking",
  "Excavating",
  "Deciphering",
  "Unraveling",
  "Synthesizing",
  "Fermenting",
  "Distilling",
  "Crystalizing",
  "Germinating",
  "Simmering",
  "Steeping",
  "Composting",
  "Conjuring",
  "Alchemizing",
  "Torquing",
  "Lubricating",
  "Calibrating sensors",
  "Greasing gears",
  "Revving engines",
  "Warming up",
  "Spooling up",
  "Booting systems",
  "Initializing",
  "Defragmenting"
];

// --- COMPONENTS ---

// Animated thinking icon - morphing shapes
const AnimatedThinkingIcon = () => {
  const [iconIndex, setIconIndex] = useState(0);
  
  // Equipment-themed animated icons
  const icons = [
    // Gear
    <svg key="gear" viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
    </svg>,
    // Wrench
    <svg key="wrench" viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z"/>
    </svg>,
    // Lightning bolt
    <svg key="bolt" viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M7,2V13H10V22L17,10H13L17,2H7Z"/>
    </svg>,
    // CPU chip
    <svg key="cpu" viewBox="0 0 24 24" className="w-full h-full">
      <path fill="currentColor" d="M9,2V4H7A2,2 0 0,0 5,6V8H3V10H5V14H3V16H5V18A2,2 0 0,0 7,20H9V22H11V20H13V22H15V20H17A2,2 0 0,0 19,18V16H21V14H19V10H21V8H19V6A2,2 0 0,0 17,4H15V2H13V4H11V2H9M9,8H15V16H9V8Z"/>
    </svg>
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % icons.length);
    }, 1000);
    return () => clearInterval(interval);
  }, [icons.length]);
  
  return (
    <div className="relative w-6 h-6 mr-1">
      <div className="absolute inset-0 text-[#007AFF] dark:text-blue-400 animate-pulse">
        <div className="transition-all duration-300 transform hover:scale-110">
          {icons[iconIndex]}
        </div>
      </div>
    </div>
  );
};

// Thinking indicator that cycles through fun verbs
const ThinkingIndicator = () => {
  const [currentVerb, setCurrentVerb] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Pick a random starting verb
    setCurrentVerb(Math.floor(Math.random() * thinkingVerbs.length));
    
    // Cycle through verbs every 2.5 seconds with fade effect
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentVerb((prev) => {
          // Sometimes jump to a random verb for variety
          if (Math.random() > 0.7) {
            return Math.floor(Math.random() * thinkingVerbs.length);
          }
          return (prev + 1) % thinkingVerbs.length;
        });
        setIsVisible(true);
      }, 200);
    }, 2500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex items-center space-x-3 min-h-[28px] py-1">
      <AnimatedThinkingIcon />
      <span 
        className={`text-sm text-[#8A8A8E] dark:text-zinc-400 italic transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {thinkingVerbs[currentVerb]}
      </span>
      <div className="flex items-center space-x-1">
        <span className="h-1.5 w-1.5 bg-[#8A8A8E] dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-1.5 w-1.5 bg-[#8A8A8E] dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-1.5 w-1.5 bg-[#8A8A8E] dark:bg-zinc-500 rounded-full animate-bounce"></span>
      </div>
    </div>
  );
};

const ChatMessage = ({ message, onActionClick }) => {
  const isBot = message.author === 'bot';
  return (
    <div className={`flex items-start gap-3 my-4 animate-fade-in ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#E5E5EA] dark:bg-zinc-700 flex items-center justify-center text-[#8A8A8E] dark:text-zinc-400"><BotIcon className="h-5 w-5" /></div>}
      <div className="flex flex-col gap-2">
        <div className={`max-w-md p-3 rounded-2xl ${isBot ? 'bg-[#E5E5EA] dark:bg-zinc-800 text-[#1D1D1F] dark:text-gray-50 rounded-tl-none' : 'bg-[#007AFF] text-white rounded-br-none'}`}>
          {message.image && <img src={message.image} alt="Upload preview" className="mb-2 rounded-lg max-h-48" />}
          <p className="text-sm leading-relaxed">{message.text}</p>
          {message.isTyping && <ThinkingIndicator />}
        </div>
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <button key={action.id} onClick={() => onActionClick(action)} className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-[#E5E5EA] dark:border-zinc-700 text-sm text-[#007AFF] rounded-full hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">{action.text}</button>
            ))}
          </div>
        )}
      </div>
      {!isBot && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#E5E5EA] dark:bg-zinc-700 flex items-center justify-center text-[#007AFF]"><UserIcon className="h-5 w-5" /></div>}
    </div>
  );
};

// UPDATED ChatInterface COMPONENT
const ChatInterface = ({ supabase }) => {
    const [messages, setMessages] = useState(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const getBotResponse = async (prompt) => {
        if (!supabase) return "Error: Supabase client not available.";
        
        const SUPABASE_URL = 'https://enpqzoeohonguemzyifo.supabase.co/functions/v1/ask-equip-iq';
        
        try {
            const response = await fetch(SUPABASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.supabase.anonKey}`,
                    'apikey': config.supabase.anonKey,
                },
                body: JSON.stringify({ query: prompt }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response status:', response.status);
                console.error('Response text:', errorText);
                throw new Error(`Request failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result.reply || "Sorry, I couldn't process that.";

        } catch (error) {
            console.error("Error calling Edge Function:", error);
            return `Error: ${error.message}`;
        }
    };


    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (inputValue.trim() === '' && !imagePreview) return;

        const userMessage = { id: Date.now(), author: 'user', text: inputValue, actions: [], image: imagePreview };
        const typingIndicator = { id: Date.now() + 1, author: 'bot', text: '', isTyping: true, actions: [], image: null };
        
        setMessages((prev) => [...prev, userMessage, typingIndicator]);
        
        const currentInput = inputValue;
        setInputValue('');
        setImagePreview(null);
        
        const botResponseText = await getBotResponse(currentInput);
        let botActions = [];
        
        if (botResponseText.toLowerCase().includes("ticket")) {
             botActions.push({ id: 'create_ticket', text: 'Create Ticket Now' });
        }
        
        const botResponse = { id: Date.now() + 2, author: 'bot', text: botResponseText, actions: botActions, image: null };
        setMessages((prev) => [...prev.slice(0, -1), botResponse]);
    };

    const handleActionClick = (action) => {
        const feedbackMessage = { id: Date.now(), author: 'user', text: `I selected: ${action.text}`, actions: [] };
        const responseMessage = { id: Date.now() + 1, author: 'bot', text: `Thank you. What seems to be the issue with ${action.text}?`, actions: [] };
        setMessages(prev => [...prev, feedbackMessage, responseMessage]);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-[#E5E5EA] dark:border-zinc-800"><h1 className="text-lg font-semibold text-[#1D1D1F] dark:text-gray-50">AI Assistant</h1></div>
            <div className="flex-1 p-4 overflow-y-auto">{messages.map((msg) => (<ChatMessage key={msg.id} message={msg} onActionClick={handleActionClick} />))}<div ref={chatEndRef} /></div>
            <div className="p-3 border-t border-[#E5E5EA] dark:border-zinc-800 bg-white dark:bg-zinc-900">
                {imagePreview && (
                    <div className="relative w-24 h-24 mb-2 p-1 border border-dashed border-gray-300 dark:border-zinc-600 rounded-lg">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded" />
                        <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-gray-700 dark:bg-zinc-800 text-white rounded-full p-0.5"><XIcon className="h-4 w-4" /></button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 text-[#86868B] dark:text-zinc-400 hover:text-[#1D1D1F] dark:hover:text-gray-50 transition-colors rounded-full hover:bg-[#E5E5EA] dark:hover:bg-zinc-800"><PaperclipIcon className="h-5 w-5" /></button>
                    <button type="button" className="p-2 text-[#86868B] dark:text-zinc-400 hover:text-[#1D1D1F] dark:hover:text-gray-50 transition-colors rounded-full hover:bg-[#E5E5EA] dark:hover:bg-zinc-800"><MicIcon className="h-5 w-5" /></button>
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Describe the issue..." className="flex-1 w-full bg-[#F9F9F9] dark:bg-zinc-800 border-transparent focus:border-transparent focus:ring-0 rounded-full px-4 py-2 text-sm text-[#1D1D1F] dark:text-gray-50 placeholder-[#86868B] dark:placeholder-zinc-400 transition" />
                    <button type="submit" className="p-2 text-white bg-[#007AFF] rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007AFF] transition-transform active:scale-95 disabled:bg-blue-300 dark:disabled:bg-blue-800" disabled={!inputValue.trim() && !imagePreview}><SendIcon className="h-5 w-5" /></button>
                </form>
            </div>
        </div>
    );
};

const AuthComponent = ({ supabase, theme }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        setLoading(false);
    };

    return (
        <div className={`w-full h-screen flex items-center justify-center p-4 ${theme}`}>
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-[#007AFF]">IQ</h1>
                    <h2 className="text-2xl font-semibold text-[#1D1D1F] dark:text-gray-50 mt-4">Welcome to EquipIQ</h2>
                    <p className="text-[#86868B] dark:text-zinc-400">Sign in to access your AI assistant.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#F9F9F9] dark:bg-zinc-800 border-transparent focus:border-blue-500 focus:ring-blue-500 rounded-lg px-4 py-3 text-sm text-[#1D1D1F] dark:text-gray-50" required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#F9F9F9] dark:bg-zinc-800 border-transparent focus:border-blue-500 focus:ring-blue-500 rounded-lg px-4 py-3 text-sm text-[#1D1D1F] dark:text-gray-50" required />
                    <button type="submit" disabled={loading} className="w-full bg-[#007AFF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-400">{loading ? 'Signing In...' : 'Sign In'}</button>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </form>
            </div>
        </div>
    );
};

const Sidebar = ({ activePage, setActivePage, theme, setTheme, onSignOut, user }) => {
    const navItems = [{ id: 'chat', icon: MessageSquareIcon }, { id: 'tickets', icon: TicketIcon }, { id: 'settings', icon: SettingsIcon }];
    // Only show admin button for your email
    const isAdmin = user?.email === 'ambriahatcher@gmail.com';
    if (isAdmin) {
        navItems.push({ id: 'admin', icon: AdminIcon });
    }
    return (
        <aside className="w-20 bg-white dark:bg-zinc-900 border-r border-[#E5E5EA] dark:border-zinc-800 flex flex-col items-center py-4">
            <div className="font-bold text-xl text-[#007AFF]">IQ</div>
            <nav className="flex flex-col items-center gap-4 mt-10 flex-1">
                {navItems.map(item => <button key={item.id} onClick={() => setActivePage(item.id)} className={`p-3 rounded-lg transition-colors ${activePage === item.id ? 'bg-[#007AFF] text-white' : 'text-[#86868B] dark:text-zinc-400 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800'}`}><item.icon className="h-6 w-6" /></button>)}
            </nav>
            <div className="flex flex-col items-center gap-4">
                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-3 rounded-lg text-[#86868B] dark:text-zinc-400 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800 transition-colors">{theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}</button>
                <button onClick={onSignOut} className="p-2 rounded-full bg-[#E5E5EA] dark:bg-zinc-700"><UserIcon className="h-6 w-6 text-[#86868B] dark:text-zinc-400" /></button>
            </div>
        </aside>
    );
}

const AppLayout = ({ children }) => <div className="flex h-screen">{children}</div>;
const PlaceholderPage = ({ title }) => <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] dark:bg-zinc-950"><h1 className="text-4xl font-bold text-[#C7C7CC] dark:text-zinc-700">{title}</h1></div>;

export default function App() {
    const [theme, setTheme] = useState('light');
    const [status, setStatus] = useState('loading'); // 'loading', 'configuring', 'ready', 'auth'
    const [supabase, setSupabase] = useState(null);
    const [user, setUser] = useState(null);
    const [activePage, setActivePage] = useState('chat');

    useEffect(() => {
        if (!config.supabase.url || !config.supabase.anonKey) {
            setStatus('configuring');
            return;
        }

        import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm')
            .then(module => {
                const { createClient } = module;
                const client = createClient(config.supabase.url, config.supabase.anonKey);
                setSupabase(client);

                client.auth.getSession().then(({ data: { session } }) => {
                    setUser(session?.user ?? null);
                    setStatus(session?.user ? 'ready' : 'auth');
                });

                const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
                    setUser(session?.user ?? null);
                    if (status !== 'loading' && status !== 'configuring') {
                       setStatus(session?.user ? 'ready' : 'auth');
                    }
                });

                return () => {
                    subscription.unsubscribe();
                };
            })
            .catch(err => {
                console.error("Error loading Supabase module:", err);
                setStatus('configuring');
            });

    }, [status]);

    const handleSignOut = async () => {
        if (supabase) await supabase.auth.signOut();
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return <div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
            
            case 'configuring':
                return (
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <div className="text-center max-w-md p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-md">
                            <AlertTriangleIcon className="h-12 w-12 mx-auto text-yellow-500" />
                            <h2 className="mt-4 text-xl font-semibold text-[#1D1D1F] dark:text-gray-50">Configuration Needed</h2>
                            <p className="mt-2 text-sm text-[#86868B] dark:text-zinc-400">
                                Please add your Supabase URL and Anon Key to the `config` object in the code to continue.
                            </p>
                        </div>
                    </div>
                );

            case 'auth':
                return <AuthComponent supabase={supabase} theme={theme} />;

            case 'ready':
                const renderPage = () => {
                    switch (activePage) {
                        case 'chat': return <div className="flex-1 p-8 bg-[#F9F9F9] dark:bg-zinc-950"><div className="h-full max-w-2xl mx-auto"><ChatInterface supabase={supabase} /></div></div>;
                        case 'tickets': return <PlaceholderPage title="Tickets Dashboard" />;
                        case 'settings': return <PlaceholderPage title="Settings" />;
                        case 'admin': return <div className="flex-1 overflow-auto"><AdminDashboard supabase={supabase} user={user} /></div>;
                        default: return <div className="flex-1 p-8 bg-[#F9F9F9] dark:bg-zinc-950"><div className="h-full max-w-2xl mx-auto"><ChatInterface supabase={supabase} /></div></div>;
                    }
                };
                
                return (
                    <AppLayout>
                        <Sidebar activePage={activePage} setActivePage={setActivePage} theme={theme} setTheme={setTheme} onSignOut={handleSignOut} user={user} />
                        {renderPage()}
                    </AppLayout>
                );

            default:
                return null;
        }
    };

    return (
        <main className={theme} style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); 
                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; } 
                @keyframes fadeIn { 
                    from { opacity: 0; transform: translateY(10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                .animate-spin-slow { 
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-float {
                    animation: float 2s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    33% { transform: translateY(-3px) rotate(5deg); }
                    66% { transform: translateY(2px) rotate(-5deg); }
                }
                .animate-orbit {
                    animation: orbit 3s linear infinite;
                }
                @keyframes orbit {
                    from {
                        transform: rotate(0deg) translateX(12px) rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg) translateX(12px) rotate(-360deg);
                    }
                }
                .animate-wiggle {
                    animation: wiggle 0.5s ease-in-out infinite;
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
                }
            `}</style>
            {renderContent()}
        </main>
    );
}
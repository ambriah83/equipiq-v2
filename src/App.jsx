// src/App.jsx
// This is the updated frontend component.
// It's rebuilt to handle a stateful, interactive conversation with quick replies.

import React, { useState, useEffect, useRef } from 'react';
import AdminDashboard from './components/AdminDashboard';
import { useEquipmentMapping } from './hooks/useEquipmentMapping';

// --- ICONS (Lucide-React style inline SVGs) ---
const UserIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const BotIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);
const SendIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
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
const PaperclipIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
);
const XIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const MessageSquareIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const SettingsIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.12l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.12l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const TicketIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
);

// --- CONFIGURATION ---
const config = {
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    }
};

// --- Helper Components ---
const BotMessage = ({ content, quickReplies, onQuickReply }) => (
  <div className="flex items-end gap-2 justify-start">
    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
      <BotIcon className="h-5 w-5" />
    </div>
    <div className="bg-gray-700 p-3 rounded-lg max-w-md">
      <p className="text-white whitespace-pre-wrap">{content}</p>
      {quickReplies && quickReplies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => onQuickReply(reply)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-3 rounded-full transition-colors duration-200"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

const UserMessage = ({ content }) => (
  <div className="flex items-end gap-2 justify-end">
    <div className="bg-blue-600 p-3 rounded-lg max-w-md">
      <p className="text-white whitespace-pre-wrap">{content}</p>
    </div>
    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
      <UserIcon className="h-5 w-5" />
    </div>
  </div>
);

const TypingIndicator = () => (
    <div className="flex items-end gap-2 justify-start">
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
          <BotIcon className="h-5 w-5" />
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
            <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
            </div>
        </div>
    </div>
);

// --- Main Chat Component ---
const ChatInterface = ({ supabase }) => {
  // --- State Management ---
  const [user, setUser] = useState(null);
  const [locations, setLocations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  
  // Equipment type mapping hook
  const { getEquipmentType, getEquipmentTypeName } = useEquipmentMapping();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeQuickReplies, setActiveQuickReplies] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Effects ---
  // Scroll to bottom of chat on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Fetch initial data (user, locations)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchLocations();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch equipment when a location is selected
  useEffect(() => {
    if (selectedLocation) {
      fetchEquipment(selectedLocation);
    } else {
      setEquipment([]);
      setSelectedEquipment('');
    }
  }, [selectedLocation]);

  // Start conversation when equipment is selected
  useEffect(() => {
    if (selectedEquipment) {
      const equipmentName = equipment.find(e => e.id === parseInt(selectedEquipment))?.name || 'the selected unit';
      setMessages([
        {
          role: 'assistant',
          content: `Welcome to EquipIQ. I'm here to help you with the ${equipmentName}. What seems to be the problem?`,
          quickReplies: [],
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [selectedEquipment, equipment]);

  // --- Data Fetching ---
  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      // Use the proxy endpoint to get Limble locations
      const response = await fetch('/.netlify/functions/limble-proxy?action=getLocations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      
      // Map Limble location IDs to friendly names
      const locationMap = {
        '23600': 'ALL',
        '23597': 'DC',
        '23598': 'ES',
        '23599': 'NW',
        '25303': 'WH'
      };
      
      const mappedLocations = data.map(loc => ({
        id: loc.id.toString(),
        name: locationMap[loc.id] || loc.name
      }));
      
      setLocations(mappedLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchEquipment = async (locationId) => {
    setLoadingEquipment(true);
    try {
      const response = await fetch(`/.netlify/functions/limble-proxy?action=getEquipment&locationId=${locationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch equipment');
      }

      const data = await response.json();
      
      // Filter equipment by location
      const locationEquipment = data.filter(asset => 
        asset.locationID === parseInt(locationId) || 
        (locationId === '23600' && asset.locationID) // ALL location shows everything
      );
      
      // Format equipment names to show room numbers
      const formattedEquipment = locationEquipment.map(asset => ({
        id: asset.assetID,
        name: asset.name,
        locationId: asset.locationID,
        parentId: asset.parentAssetID,
        workRequestUrl: asset.workRequestPortal
      }));
      
      setEquipment(formattedEquipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.type)) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        console.warn('Unsupported file type:', file.type);
        setImagePreview(null); // Clear preview for unsupported types
      }
    }
  };

  // --- Core Chat Logic ---
  const handleSendMessage = async (messageContent) => {
    if (!messageContent.trim() || isTyping) return;
    
    // Ensure equipment is selected
    if (!selectedEquipment) {
      const errorMessage = {
        role: 'assistant',
        content: 'Please select a location and equipment first so I can provide specific help.',
        quickReplies: [],
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add user message to the chat
    const newUserMessage = { role: 'user', content: messageContent };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    setActiveQuickReplies([]); // Disable quick replies after sending

    try {
      // Convert image to base64 if present
      let imageData = null;
      if (imagePreview && fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            resolve({
              data: base64,
              mimeType: file.type
            });
          };
          reader.readAsDataURL(file);
        });
        imageData = await base64Promise;
      }

      // Find equipment details
      const selectedEquip = equipment.find(e => e.id === parseInt(selectedEquipment));
      
      // Get the proper equipment type using our mapping
      const equipmentType = getEquipmentType(selectedEquip?.id, selectedEquip);
      
      console.log('Sending to API:', {
        selectedEquipment,
        selectedEquip,
        equipmentType,
        equipmentName: selectedEquip?.name
      });
      
      // Prepare messages for the API (only role and content)
      const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }));

      const { data, error } = await supabase.functions.invoke('ask-equip-iq-v2', {
        body: {
          messages: apiMessages,
          equipment_type_id: equipmentType, // Now using proper equipment type!
          equipment_name: selectedEquip?.name
        },
      });

      if (error) throw error;

      // The backend now returns a structured object
      const { response: botResponse, quick_replies: quickReplies } = data;
      
      const newBotMessage = {
        role: 'assistant',
        content: botResponse,
        quickReplies: quickReplies || [],
      };

      setMessages(prev => [...prev, newBotMessage]);
      setActiveQuickReplies(quickReplies || []);

    } catch (error) {
      console.error('Error calling ask-equip-iq-v2 function:', error);
      console.error('Error details:', {
        message: error.message,
        data: error.data,
        error: error
      });
      
      // More specific error messages
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      if (error.message?.includes('Failed to fetch')) {
        errorContent = 'Connection error. Please check your internet and try again.';
      } else if (error.message?.includes('equipment_type_id')) {
        errorContent = 'Equipment type error. Please select valid equipment.';
      }
      
      const errorMessage = {
        role: 'assistant',
        content: errorContent,
        quickReplies: [],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setImagePreview(null);
    }
  };
  
  const handleQuickReplyClick = (reply) => {
    handleSendMessage(reply);
  };

  // --- Render ---
  return (
    <div className="bg-gray-900 text-white flex flex-col h-screen font-sans">
      <header className="bg-gray-800 p-4 border-b border-gray-700 shadow-md">
        <h1 className="text-xl font-bold">AI Assistant</h1>
      </header>

      <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">{loadingLocations ? "Loading..." : "Select Location"}</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            disabled={!selectedLocation}
            className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">
              {!selectedLocation ? "Select Location First" : 
               loadingEquipment ? "Loading..." : 
               equipment.length === 0 ? "No Equipment Found" : 
               "Select Equipment"}
            </option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col overflow-y-auto">
          <div className="flex-1 space-y-4">
            {messages.map((msg, index) =>
              msg.role === 'user' ? (
                <UserMessage key={index} content={msg.content} />
              ) : (
                <BotMessage
                  key={index}
                  content={msg.content}
                  quickReplies={index === messages.length - 1 ? activeQuickReplies : []}
                  onQuickReply={handleQuickReplyClick}
                />
              )
            )}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            {imagePreview && (
              <div className="relative w-24 h-24 mb-2 p-1 border border-dashed border-gray-300 rounded-lg">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded" />
                <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5"><XIcon className="h-4 w-4" /></button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
              <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700">
                <PaperclipIcon className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedEquipment ? "Type your message..." : "Please select equipment to begin"}
                disabled={!selectedEquipment || isTyping}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-full py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping || !selectedEquipment}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Authentication Component ---
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
        <div className="w-full h-screen flex items-center justify-center p-4 bg-white dark:bg-zinc-950">
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

// --- Sidebar Component ---
const Sidebar = ({ activePage, setActivePage, theme, setTheme, onSignOut, user, isAdmin }) => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navItems = [{ id: 'chat', icon: MessageSquareIcon }, { id: 'tickets', icon: TicketIcon }, { id: 'settings', icon: SettingsIcon }];
    // Show admin button based on role
    if (isAdmin) {
        navItems.push({ id: 'admin', icon: AdminIcon });
    }
    
    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);
    
    return (
        <aside className="w-20 bg-white dark:bg-zinc-900 border-r border-[#E5E5EA] dark:border-zinc-800 flex flex-col items-center py-4">
            <div className="font-bold text-xl text-[#007AFF]">IQ</div>
            <nav className="flex flex-col items-center gap-4 mt-10 flex-1">
                {navItems.map(item => <button key={item.id} onClick={() => setActivePage(item.id)} className={`p-3 rounded-lg transition-colors ${activePage === item.id ? 'bg-[#007AFF] text-white' : 'text-[#86868B] dark:text-zinc-400 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800'}`}><item.icon className="h-6 w-6" /></button>)}
            </nav>
            <div className="flex flex-col items-center gap-4">
                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-3 rounded-lg text-[#86868B] dark:text-zinc-400 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800 transition-colors">{theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}</button>
                <div className="relative profile-menu-container">
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)} 
                        className="p-2 rounded-full bg-[#E5E5EA] dark:bg-zinc-700 hover:bg-[#D1D1D6] dark:hover:bg-zinc-600 transition-colors"
                    >
                        <UserIcon className="h-6 w-6 text-[#86868B] dark:text-zinc-400" />
                    </button>
                    {showProfileMenu && (
                        <div className="absolute bottom-full mb-2 left-0 w-48 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-[#E5E5EA] dark:border-zinc-800 py-2 z-50">
                            <div className="px-4 py-2 border-b border-[#E5E5EA] dark:border-zinc-800">
                                <p className="text-xs text-[#86868B] dark:text-zinc-400">Signed in as</p>
                                <p className="text-sm font-medium text-[#1D1D1F] dark:text-gray-50 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    onSignOut();
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-[#FF3B30] hover:bg-[#F9F9F9] dark:hover:bg-zinc-800 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

const AppLayout = ({ children }) => <div className="flex h-screen">{children}</div>;
const PlaceholderPage = ({ title }) => <div className="flex-1 flex items-center justify-center bg-[#F9F9F9] dark:bg-zinc-950"><h1 className="text-4xl font-bold text-[#C7C7CC] dark:text-zinc-700">{title}</h1></div>;

// --- Main App Component ---
export default function App() {
  // --- State Management ---
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  const [status, setStatus] = useState('loading'); // 'loading', 'configuring', 'ready', 'auth'
  const [supabase, setSupabase] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activePage, setActivePage] = useState('chat');

  // Save theme preference and apply it
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

        // Function to check if user is admin
        const checkAdminStatus = async (userId) => {
          if (!userId) {
            setIsAdmin(false);
            return;
          }
          
          try {
            const { data, error } = await client.rpc('is_admin');
            
            if (error) {
              console.error('Error checking admin status:', error);
              setIsAdmin(false);
            } else {
              setIsAdmin(data === true);
            }
          } catch (err) {
            console.error('Error checking admin status:', err);
            setIsAdmin(false);
          }
        };

        client.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
          setStatus(session?.user ? 'ready' : 'auth');
          if (session?.user) {
            checkAdminStatus(session.user.id);
          }
        });

        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          if (status !== 'loading' && status !== 'configuring') {
            setStatus(session?.user ? 'ready' : 'auth');
          }
          if (session?.user) {
            checkAdminStatus(session.user.id);
          } else {
            setIsAdmin(false);
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
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActivePage('chat');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
        <div className="text-center">
          <div className="mb-4">
            <h1 className="text-6xl font-bold text-[#007AFF] animate-pulse">IQ</h1>
          </div>
          <p className="text-[#86868B] dark:text-zinc-400">Loading EquipIQ...</p>
        </div>
      </div>
    );
  }

  if (status === 'configuring') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-3xl font-bold text-[#1D1D1F] dark:text-gray-50 mb-4">Configuration Required</h1>
          <p className="text-[#86868B] dark:text-zinc-400 mb-6">
            Please set the following environment variables:
          </p>
          <div className="bg-[#F9F9F9] dark:bg-zinc-800 p-4 rounded-lg text-left font-mono text-sm">
            <p className="text-[#007AFF]">VITE_SUPABASE_URL</p>
            <p className="text-[#007AFF]">VITE_SUPABASE_ANON_KEY</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'auth') {
    return <AuthComponent supabase={supabase} theme={theme} />;
  }

  return (
    <AppLayout>
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        theme={theme} 
        setTheme={setTheme} 
        onSignOut={handleSignOut}
        user={user}
        isAdmin={isAdmin}
      />
      {activePage === 'chat' && <ChatInterface supabase={supabase} />}
      {activePage === 'tickets' && <PlaceholderPage title="Tickets" />}
      {activePage === 'settings' && <PlaceholderPage title="Settings" />}
      {activePage === 'admin' && <AdminDashboard supabase={supabase} user={user} />}
    </AppLayout>
  );
}
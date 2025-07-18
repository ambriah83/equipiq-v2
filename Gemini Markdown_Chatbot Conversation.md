To: Claude Code

From: Ambria Hatcher \& Gemini

Subject: Urgent Upgrade: Evolving EquipIQ from a Checklist Bot to a Conversational Expert

Objective:

Implement a foundational shift in the EquipIQ user experience. We are moving away from the current static, checklist-based chatbot to a dynamic, stateful, and conversational diagnostic expert. The goal is to replicate the experience of talking to a world-class technician, not filling out a form.



Strategy: The "Expert Technician Framework"

The new AI must adhere to the following conversational principles:



Acknowledge \& Align: Start with empathy to build trust.



Clarify \& Confirm: Ask one simple question at a time.



Diagnose \& Act: Guide the user through an interactive loop, using their feedback to inform the next step.



Confirm Resolution: Explicitly ask if the solution worked.



Intelligent Escalation: When a human is needed, create a ticket with the full conversation context so the user never has to repeat themselves.



Key Technical Changes:

We have developed two production-ready files to execute this strategy. Your task is to integrate them into the existing project.



Backend Overhaul (supabase/functions/ask-equip-iq-v2/index.ts):



The Supabase function has been re-engineered to be a stateful conversational engine.



It now uses a detailed system prompt that defines the "Expert Technician" persona.



It leverages OpenAI's JSON mode to receive structured responses, including quick\_replies to guide the user.



It dynamically pulls context from the hybrid-rag-search function.



Frontend Re-architecture (src/App.jsx):



The React component is refactored to manage a true conversational flow.



It now renders and handles interactive quick\_replies buttons, which become the primary method of user interaction during diagnosis.



The UI logic is updated to handle the new stateful message format (including the quickReplies array).



A typing indicator has been added for a more polished feel.



Action Items:



Retrieve the code: The complete code for both the backend function and the frontend component has been provided by Gemini in separate artifacts.



Replace the existing files:



Update supabase/functions/ask-equip-iq-v2/index.ts with the new backend code.



Update src/App.jsx with the new frontend code.



Configure Environment Variables:



Ensure OPENAI\_API\_KEY is set as a secret for the Supabase function.



In src/App.jsx, replace the placeholder Supabase URL and Anon Key with the project's actual credentials.



Deploy \& Verify:



Deploy the ask-equip-iq-v2 function via the Supabase CLI.



Run the frontend and verify the new conversational flow is active and functional.



This is a mission-critical upgrade to our core user experience. Please implement with precision.



**##Supabase Function: The Expert Technician Brain**

// supabase/functions/ask-equip-iq-v2/index.ts

// This is the new, stateful conversational engine.

// It moves beyond simple Q\&A to a guided diagnostic process.



import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2'

import { OpenAI } from 'https://esm.sh/openai@4.52.1'



// --- Configuration ---

// It is critical that these environment variables are set in your Supabase project.

const supabaseUrl = Deno.env.get('SUPABASE\_URL')!

const supabaseAnonKey = Deno.env.get('SUPABASE\_ANON\_KEY')!

const openaiApiKey = Deno.env.get('OPENAI\_API\_KEY')!



const openai = new OpenAI({ apiKey: openaiApiKey })



// --- Core System Prompt ---

// This prompt defines the AI's persona and its mission.

// It's engineered based on the "Expert Technician Framework".

const SYSTEM\_PROMPT = `

You are EquipIQ, a world-class AI diagnostic technician for high-end spa and wellness equipment. Your personality is that of a calm, confident, and hyper-competent expert. You are talking to a spa technician who is under pressure. Your goal is to get their equipment back online as fast as possible.



\*\*Your Core Directives:\*\*

1\.  \*\*Acknowledge \& Align (Empathy First):\*\* Always start by acknowledging the user's problem and validating their frustration. Example: "I understand how frustrating a cold hydration unit can be. Let's get this sorted out quickly."

2\.  \*\*Clarify \& Confirm (One Question at a Time):\*\* Never ask multiple questions at once. Guide the conversation by asking one single, simple question at a time. Use the context you have.

3\.  \*\*Diagnose \& Act (The Interactive Loop):\*\* Guide the user through a single, simple action. Wait for their feedback. Use their response to determine the next step.

4\.  \*\*Use Your Knowledge:\*\* You will be provided with relevant context from the equipment's knowledge base. Use this to form your diagnostic steps. Start with the most common and simplest solutions first.

5\.  \*\*Generate Quick Replies:\*\* For every question you ask, you MUST provide a 'quick\_replies' array with 2-4 short, clear options for the user to click. This keeps the diagnosis on track.

6\.  \*\*Intelligent Escalation (The Golden Handoff):\*\* If you exhaust all diagnostic steps from the provided context, or if the user indicates a step has failed, your final action is to escalate. Do not apologize. State the likely cause and inform the user that you have created a ticket with all the details. Example: "It sounds like we've confirmed a faulty heating element. I've created a priority service ticket with all our diagnostic steps. A specialist will be in touch shortly. You won't have to repeat yourself."



\*\*Conversation Flow Example:\*\*

User: "my hydration unit won't heat up"

You: "Ugh, a cold hydration unit can shut down a whole room. I get it. I see you've selected the Sybaritic Hydration Station. Is that the unit we're working on?"

&nbsp;  "quick\_replies": \["Yes, that's right", "No, it's a different one"]

User: "Yes, that's right"

You: "Great. Before we dive in, have you already tried anything to fix it?"

&nbsp;  "quick\_replies": \["Checked the power", "Reset the breaker", "No, nothing yet"]

...and so on.

`



// --- Main Server Logic ---

serve(async (req) => {

&nbsp; // 1. Handle CORS preflight requests

&nbsp; if (req.method === 'OPTIONS') {

&nbsp;   return new Response('ok', {

&nbsp;     headers: {

&nbsp;       'Access-Control-Allow-Origin': '\*',

&nbsp;       'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',

&nbsp;     },

&nbsp;   })

&nbsp; }



&nbsp; try {

&nbsp;   // 2. Initialize Supabase client

&nbsp;   const supabase = createClient(supabaseUrl, supabaseAnonKey, {

&nbsp;     global: { headers: { Authorization: req.headers.get('Authorization')! } },

&nbsp;   })



&nbsp;   // 3. Extract payload from request

&nbsp;   const { messages, equipmentModelId } = await req.json()

&nbsp;   if (!messages || !equipmentModelId) {

&nbsp;     throw new Error('Missing `messages` or `equipmentModelId` in request body.')

&nbsp;   }



&nbsp;   // 4. Perform RAG search to get context for the AI

&nbsp;   let contextText = ''

&nbsp;   const lastUserMessage = messages\[messages.length - 1]?.content

&nbsp;   if (lastUserMessage) {

&nbsp;     const { data: ragData, error: ragError } = await supabase.functions.invoke('hybrid-rag-search', {

&nbsp;       body: {

&nbsp;         query: lastUserMessage,

&nbsp;         equipmentModelId: equipmentModelId,

&nbsp;       },

&nbsp;     })



&nbsp;     if (ragError) {

&nbsp;       console.error('Error invoking hybrid-rag-search:', ragError)

&nbsp;       // Non-fatal. We can proceed without context, but the AI will be less effective.

&nbsp;     } else {

&nbsp;       contextText = ragData.map((d: any) => d.content).join('\\n\\n')

&nbsp;     }

&nbsp;   }



&nbsp;   // 5. Construct the prompt for the OpenAI API

&nbsp;   const finalSystemPrompt = `${SYSTEM\_PROMPT}\\n\\n--- RELEVANT KNOWLEDGE BASE CONTEXT ---\\n${

&nbsp;     contextText || 'No specific context found. Rely on general troubleshooting knowledge.'

&nbsp;   }\\n--- END CONTEXT ---`



&nbsp;   const openAiMessages = \[

&nbsp;     { role: 'system', content: finalSystemPrompt },

&nbsp;     ...messages.map((m: any) => ({ role: m.role, content: m.content })),

&nbsp;   ]



&nbsp;   // 6. Call OpenAI API using JSON mode to enforce the response structure

&nbsp;   const response = await openai.chat.completions.create({

&nbsp;     model: 'gpt-4o', // Or 'gpt-4-turbo'

&nbsp;     messages: openAiMessages,

&nbsp;     temperature: 0.5, // Lower temperature for more predictable diagnostic steps

&nbsp;     response\_format: { type: 'json\_object' },

&nbsp;   })



&nbsp;   const botResponseContent = response.choices\[0].message.content

&nbsp;   if (!botResponseContent) {

&nbsp;     throw new Error('OpenAI returned an empty response.')

&nbsp;   }



&nbsp;   // 7. Parse the JSON response from the AI

&nbsp;   // The AI is instructed to return a JSON object with 'response' and 'quick\_replies'

&nbsp;   const parsedResponse = JSON.parse(botResponseContent)



&nbsp;   // 8. Return the structured response to the frontend

&nbsp;   return new Response(JSON.stringify(parsedResponse), {

&nbsp;     headers: {

&nbsp;       'Access-Control-Allow-Origin': '\*',

&nbsp;       'Content-Type': 'application/json',

&nbsp;     },

&nbsp;   })

&nbsp; } catch (error) {

&nbsp;   console.error('An error occurred:', error)

&nbsp;   return new Response(JSON.stringify({ error: error.message }), {

&nbsp;     status: 500,

&nbsp;     headers: {

&nbsp;       'Access-Control-Allow-Origin': '\*',

&nbsp;       'Content-Type': 'application/json',

&nbsp;     },

&nbsp;   })

&nbsp; }

})





**##React Frontend: The Conversational UI**

// src/App.jsx

// This is the updated frontend component.

// It's rebuilt to handle a stateful, interactive conversation with quick replies.



import React, { useState, useEffect, useRef } from 'react';

import { createClient } from '@supabase/supabase-js';



// --- Supabase Client Initialization ---

// Replace with your actual Supabase URL and Anon Key

const supabaseUrl = 'YOUR\_SUPABASE\_URL';

const supabaseAnonKey = 'YOUR\_SUPABASE\_ANON\_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);



// --- Helper Components ---

const BotMessage = ({ content, quickReplies, onQuickReply }) => (

&nbsp; <div className="flex items-end gap-2 justify-start">

&nbsp;   <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">E</div>

&nbsp;   <div className="bg-gray-700 p-3 rounded-lg max-w-md">

&nbsp;     <p className="text-white">{content}</p>

&nbsp;     {quickReplies \&\& quickReplies.length > 0 \&\& (

&nbsp;       <div className="mt-3 flex flex-wrap gap-2">

&nbsp;         {quickReplies.map((reply, index) => (

&nbsp;           <button

&nbsp;             key={index}

&nbsp;             onClick={() => onQuickReply(reply)}

&nbsp;             className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-3 rounded-full transition-colors duration-200"

&nbsp;           >

&nbsp;             {reply}

&nbsp;           </button>

&nbsp;         ))}

&nbsp;       </div>

&nbsp;     )}

&nbsp;   </div>

&nbsp; </div>

);



const UserMessage = ({ content }) => (

&nbsp; <div className="flex items-end gap-2 justify-end">

&nbsp;   <div className="bg-blue-600 p-3 rounded-lg max-w-md">

&nbsp;     <p className="text-white">{content}</p>

&nbsp;   </div>

&nbsp;   <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">U</div>

&nbsp; </div>

);



const TypingIndicator = () => (

&nbsp;   <div className="flex items-end gap-2 justify-start">

&nbsp;       <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">E</div>

&nbsp;       <div className="bg-gray-700 p-3 rounded-lg">

&nbsp;           <div className="flex items-center gap-1">

&nbsp;               <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>

&nbsp;               <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></span>

&nbsp;               <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>

&nbsp;           </div>

&nbsp;       </div>

&nbsp;   </div>

);





// --- Main App Component ---

export default function App() {

&nbsp; // --- State Management ---

&nbsp; const \[user, setUser] = useState(null);

&nbsp; const \[locations, setLocations] = useState(\[]);

&nbsp; const \[equipment, setEquipment] = useState(\[]);

&nbsp; const \[selectedLocation, setSelectedLocation] = useState('');

&nbsp; const \[selectedEquipment, setSelectedEquipment] = useState('');

&nbsp; 

&nbsp; const \[messages, setMessages] = useState(\[]);

&nbsp; const \[input, setInput] = useState('');

&nbsp; const \[isTyping, setIsTyping] = useState(false);

&nbsp; const \[activeQuickReplies, setActiveQuickReplies] = useState(\[]);



&nbsp; const messagesEndRef = useRef(null);



&nbsp; // --- Effects ---

&nbsp; // Scroll to bottom of chat on new message

&nbsp; useEffect(() => {

&nbsp;   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

&nbsp; }, \[messages, isTyping]);



&nbsp; // Fetch initial data (user, locations)

&nbsp; useEffect(() => {

&nbsp;   const checkUser = async () => {

&nbsp;     const { data: { session } } = await supabase.auth.getSession();

&nbsp;     setUser(session?.user ?? null);

&nbsp;   };

&nbsp;   checkUser();

&nbsp;   

&nbsp;   const { data: authListener } = supabase.auth.onAuthStateChange((\_event, session) => {

&nbsp;     setUser(session?.user ?? null);

&nbsp;   });



&nbsp;   fetchLocations();



&nbsp;   return () => {

&nbsp;     authListener?.subscription.unsubscribe();

&nbsp;   };

&nbsp; }, \[]);



&nbsp; // Fetch equipment when a location is selected

&nbsp; useEffect(() => {

&nbsp;   if (selectedLocation) {

&nbsp;     fetchEquipment(selectedLocation);

&nbsp;   } else {

&nbsp;     setEquipment(\[]);

&nbsp;     setSelectedEquipment('');

&nbsp;   }

&nbsp; }, \[selectedLocation]);



&nbsp; // Start conversation when equipment is selected

&nbsp; useEffect(() => {

&nbsp;   if (selectedEquipment) {

&nbsp;     const equipmentName = equipment.find(e => e.id === selectedEquipment)?.name || 'the selected unit';

&nbsp;     setMessages(\[

&nbsp;       {

&nbsp;         role: 'assistant',

&nbsp;         content: `Welcome to EquipIQ. I'm here to help you with the ${equipmentName}. What seems to be the problem?`,

&nbsp;         quickReplies: \[],

&nbsp;       },

&nbsp;     ]);

&nbsp;   } else {

&nbsp;     setMessages(\[]);

&nbsp;   }

&nbsp; }, \[selectedEquipment]);



&nbsp; // --- Data Fetching ---

&nbsp; const fetchLocations = async () => {

&nbsp;   const { data, error } = await supabase.from('locations').select('\*');

&nbsp;   if (error) console.error('Error fetching locations:', error);

&nbsp;   else setLocations(data);

&nbsp; };



&nbsp; const fetchEquipment = async (locationId) => {

&nbsp;   const { data, error } = await supabase.from('equipment').select('\*').eq('location\_id', locationId);

&nbsp;   if (error) console.error('Error fetching equipment:', error);

&nbsp;   else setEquipment(data);

&nbsp; };



&nbsp; // --- Core Chat Logic ---

&nbsp; const handleSendMessage = async (messageContent) => {

&nbsp;   if (!messageContent.trim() || isTyping) return;



&nbsp;   // Add user message to the chat

&nbsp;   const newUserMessage = { role: 'user', content: messageContent };

&nbsp;   const updatedMessages = \[...messages, newUserMessage];

&nbsp;   setMessages(updatedMessages);

&nbsp;   setInput('');

&nbsp;   setIsTyping(true);

&nbsp;   setActiveQuickReplies(\[]); // Disable quick replies after sending



&nbsp;   try {

&nbsp;     // Prepare messages for the API (only role and content)

&nbsp;     const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }));



&nbsp;     const { data, error } = await supabase.functions.invoke('ask-equip-iq-v2', {

&nbsp;       body: {

&nbsp;         messages: apiMessages,

&nbsp;         equipmentModelId: selectedEquipment, // Pass the selected equipment ID

&nbsp;       },

&nbsp;     });



&nbsp;     if (error) throw error;



&nbsp;     // The backend now returns a structured object

&nbsp;     const { response: botResponse, quick\_replies: quickReplies } = data;

&nbsp;     

&nbsp;     const newBotMessage = {

&nbsp;       role: 'assistant',

&nbsp;       content: botResponse,

&nbsp;       quickReplies: quickReplies || \[],

&nbsp;     };



&nbsp;     setMessages(prev => \[...prev, newBotMessage]);

&nbsp;     setActiveQuickReplies(quickReplies || \[]);



&nbsp;   } catch (error) {

&nbsp;     console.error('Error calling ask-equip-iq-v2 function:', error);

&nbsp;     const errorMessage = {

&nbsp;       role: 'assistant',

&nbsp;       content: 'Sorry, I seem to be having some trouble connecting. Please try again in a moment.',

&nbsp;       quickReplies: \[],

&nbsp;     };

&nbsp;     setMessages(prev => \[...prev, errorMessage]);

&nbsp;   } finally {

&nbsp;     setIsTyping(false);

&nbsp;   }

&nbsp; };

&nbsp; 

&nbsp; const handleQuickReplyClick = (reply) => {

&nbsp;   handleSendMessage(reply);

&nbsp; };



&nbsp; // --- Render ---

&nbsp; return (

&nbsp;   <div className="bg-gray-900 text-white flex flex-col h-screen font-sans">

&nbsp;     <header className="bg-gray-800 p-4 border-b border-gray-700 shadow-md">

&nbsp;       <h1 className="text-xl font-bold">AI Assistant</h1>

&nbsp;     </header>



&nbsp;     <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">

&nbsp;       {/\* Controls \*/}

&nbsp;       <div className="flex flex-col sm:flex-row gap-4">

&nbsp;         <select

&nbsp;           value={selectedLocation}

&nbsp;           onChange={(e) => setSelectedLocation(e.target.value)}

&nbsp;           className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none"

&nbsp;         >

&nbsp;           <option value="">Select Location</option>

&nbsp;           {locations.map((loc) => (

&nbsp;             <option key={loc.id} value={loc.id}>{loc.name}</option>

&nbsp;           ))}

&nbsp;         </select>

&nbsp;         <select

&nbsp;           value={selectedEquipment}

&nbsp;           onChange={(e) => setSelectedEquipment(e.target.value)}

&nbsp;           disabled={!selectedLocation}

&nbsp;           className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"

&nbsp;         >

&nbsp;           <option value="">Select Equipment</option>

&nbsp;           {equipment.map((eq) => (

&nbsp;             <option key={eq.id} value={eq.id}>{eq.name}</option>

&nbsp;           ))}

&nbsp;         </select>

&nbsp;       </div>



&nbsp;       {/\* Chat Area \*/}

&nbsp;       <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col overflow-y-auto">

&nbsp;         <div className="flex-1 space-y-4">

&nbsp;           {messages.map((msg, index) =>

&nbsp;             msg.role === 'user' ? (

&nbsp;               <UserMessage key={index} content={msg.content} />

&nbsp;             ) : (

&nbsp;               <BotMessage

&nbsp;                 key={index}

&nbsp;                 content={msg.content}

&nbsp;                 quickReplies={index === messages.length - 1 ? activeQuickReplies : \[]}

&nbsp;                 onQuickReply={handleQuickReplyClick}

&nbsp;               />

&nbsp;             )

&nbsp;           )}

&nbsp;           {isTyping \&\& <TypingIndicator />}

&nbsp;           <div ref={messagesEndRef} />

&nbsp;         </div>



&nbsp;         {/\* Input Form \*/}

&nbsp;         <div className="mt-4 pt-4 border-t border-gray-700">

&nbsp;           <form

&nbsp;             onSubmit={(e) => {

&nbsp;               e.preventDefault();

&nbsp;               handleSendMessage(input);

&nbsp;             }}

&nbsp;             className="flex items-center gap-2"

&nbsp;           >

&nbsp;             <input

&nbsp;               type="text"

&nbsp;               value={input}

&nbsp;               onChange={(e) => setInput(e.target.value)}

&nbsp;               placeholder={selectedEquipment ? "Type your message..." : "Please select equipment to begin"}

&nbsp;               disabled={!selectedEquipment || isTyping}

&nbsp;               className="flex-1 bg-gray-700 border border-gray-600 rounded-full py-2 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"

&nbsp;             />

&nbsp;             <button

&nbsp;               type="submit"

&nbsp;               disabled={!input.trim() || isTyping}

&nbsp;               className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"

&nbsp;             >

&nbsp;               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

&nbsp;                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />

&nbsp;               </svg>

&nbsp;             </button>

&nbsp;           </form>

&nbsp;         </div>

&nbsp;       </div>

&nbsp;     </main>

&nbsp;   </div>

&nbsp; );

}






import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/ui/dashboard-with-collapsible-sidebar'
import { Send, Loader, Heart, Scale, AlertCircle, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getGeminiResponse, redactPII } from '@/lib/gemini'

interface Message {
  id: string
  role: 'user' | 'bot'
  content: string
  timestamp: Date
  type: 'emotional' | 'legal'
}

export default function Chat() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'emotional' | 'legal'>('emotional')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load previous messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        console.log('📝 Loading chat messages for user:', user?.id)

        const { data, error: fetchError } = await supabase
          .from('bot_messages')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: true })

        if (fetchError) {
          console.error('❌ Error loading messages:', fetchError)
        } else {
          const loadedMessages: Message[] = data?.map((msg: any) => ({
            id: msg.id,
            role: msg.message_type === 'user' ? 'user' : 'bot',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            type: msg.message_type.includes('emotional') ? 'emotional' : 'legal',
          })) || []

          setMessages(loadedMessages)
          console.log('✅ Loaded', loadedMessages.length, 'messages')
        }
      } catch (err) {
        console.error('❌ Error in loadMessages:', err)
      } finally {
        setLoadingMessages(false)
      }
    }

    if (user?.id) {
      loadMessages()
    }
  }, [user?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    setLoading(true)
    setError(null)

    try {
      console.log('📨 Sending message:', input)

      // Add user message to UI
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date(),
        type: activeTab,
      }

      setMessages((prev) => [...prev, userMessage])

      // Redact PII before saving
      const redactedContent = redactPII(input)

      // Save user message to DB
      const { error: saveError } = await supabase.from('bot_messages').insert([
        {
          user_id: user?.id,
          message_type: 'user',
          content: redactedContent,
          has_pii: redactedContent !== input,
        },
      ])

      if (saveError) {
        console.error('❌ Error saving user message:', saveError)
      }

      // Get conversation history for context (last 5 messages)
      const conversationHistory = messages
        .filter((msg) => msg.type === activeTab)
        .slice(-5)
        .map((msg) => ({
          role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: msg.content,
        }))

      // Add current message
      conversationHistory.push({
        role: 'user' as const,
        content: input,
      })

      // Get response from Gemini
      console.log('🤖 Calling Gemini API...')
      const botResponse = await getGeminiResponse(conversationHistory, activeTab)

      console.log('✅ Received Gemini response')

      // Add bot message to UI
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: botResponse,
        timestamp: new Date(),
        type: activeTab,
      }

      setMessages((prev) => [...prev, botMessage])

      // Save bot message to DB
      const { error: botError } = await supabase.from('bot_messages').insert([
        {
          user_id: user?.id,
          message_type: `${activeTab}_bot`,
          content: botResponse,
          has_pii: false,
        },
      ])

      if (botError) {
        console.error('❌ Error saving bot message:', botError)
      }

      setInput('')
    } catch (err: any) {
      console.error('❌ Error sending message:', err)
      setError(err.message || 'Failed to get response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = async () => {
    try {
      console.log('🗑️ Clearing chat messages...')
      
      // Delete all messages for current user and active tab
      const { error } = await supabase
        .from('bot_messages')
        .delete()
        .eq('user_id', user?.id)
        .like('message_type', `%${activeTab}%`)

      if (error) {
        console.error('❌ Error clearing chat:', error)
        setError('Failed to clear chat. Please try again.')
      } else {
        // Clear local state
        setMessages(prev => prev.filter(msg => msg.type !== activeTab))
        setShowClearConfirm(false)
        console.log('✅ Chat cleared successfully')
      }
    } catch (err) {
      console.error('❌ Error clearing chat:', err)
      setError('Failed to clear chat. Please try again.')
    }
  }

  const filteredMessages = messages.filter((msg) => msg.type === activeTab)

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-100">Chat Support</h1>
            
            {/* Clear Chat Button */}
            {filteredMessages.length > 0 && !showClearConfirm && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 border border-red-600/40 text-red-300 hover:bg-red-600/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </button>
            )}

            {/* Confirmation Dialog */}
            {showClearConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Clear all messages?</span>
                <button
                  onClick={handleClearChat}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Brief response note */}
          <p className="text-xs text-gray-500 mb-6">
            Replies are concise by design (1–2 sentences).
          </p>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('emotional')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'emotional'
                  ? 'bg-pink-600 text-white shadow-pink-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Heart className="w-5 h-5" />
              Emotional Support
            </button>

            <button
              onClick={() => setActiveTab('legal')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'legal'
                  ? 'bg-blue-600 text-white shadow-blue-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Scale className="w-5 h-5" />
              Indian Legal Guidance
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 rounded-2xl border border-gray-800 bg-gray-900 p-6 overflow-y-auto mb-6 space-y-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                  <p className="text-gray-400">Loading messages...</p>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className={`w-16 h-16 rounded-full ${activeTab === 'emotional' ? 'bg-pink-600/20' : 'bg-blue-600/20'} flex items-center justify-center mx-auto mb-4`}>
                    {activeTab === 'emotional' ? (
                      <Heart className="w-8 h-8 text-pink-400" />
                    ) : (
                      <Scale className="w-8 h-8 text-blue-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-200 mb-2">
                    {activeTab === 'emotional' ? 'Emotional Support Chat' : 'Indian Legal Guidance'}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {activeTab === 'emotional'
                      ? 'Share your feelings and concerns. I\'m here to listen and support you.'
                      : 'Ask me about Indian laws, legal procedures, and your rights under Indian Constitution.'}
                  </p>
                  <p className="text-gray-600 text-xs">
                    💡 Tip: {activeTab === 'emotional' 
                      ? 'For crisis situations, call AASRA (9820466726) or iCall (9152987821)'
                      : 'Mention specific sections or situations for detailed information'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-cyan-600 text-white'
                          : activeTab === 'emotional'
                          ? 'bg-pink-600/20 border border-pink-600/40 text-pink-100'
                          : 'bg-blue-600/20 border border-blue-600/40 text-blue-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70`}>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${activeTab === 'legal' ? 'Indian laws' : 'emotional support'}...`}
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:shadow-cyan-500/30 border border-cyan-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>

          {/* Notes */}
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>🔒 All messages are encrypted and stored securely.</p>
            <p>⚠️ For emergencies in India: Police (100), Women Helpline (1091), AASRA (9820466726)</p>
            <p>✨ Powered by Google Gemini 2.0 Flash with India Legal System Focus</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

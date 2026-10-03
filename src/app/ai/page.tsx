'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, User, Sparkles, Mic, MicOff, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RecordSaleModal } from '@/components/RecordSaleModal'
import { useLanguage } from '@/lib/LanguageContext'
import type { ChatMessage, Product, ActionProposal } from '@/types'

const QUICK_QUESTIONS_EN = [
  "What products are running low?",
  "What did I sell today?",
  "How much rice do I have?",
  "I sold 5 packets of Rice",
  "What should I reorder?",
]

const QUICK_QUESTIONS_ML = [
  "എന്തൊക്കെയാണ് സ്റ്റോക്ക് കുറവുള്ളത്?",
  "ഇന്ന് എത്ര രൂപയുടെ സാധനം വിറ്റു?",
  "അരിയുടെ സ്റ്റോക്ക് എത്രയാണ്?",
  "അഞ്ച് പാക്കറ്റ് അരി വിറ്റു",
  "എന്തൊക്കെയാണ് വീണ്ടും ഓർഡർ ചെയ്യേണ്ടത്?",
]

function MessageBubble({
  message,
  onConfirmAction,
  onCancelAction,
  actionExecuting,
  language,
}: {
  message: ChatMessage
  onConfirmAction: (msgId: string, action: ActionProposal) => void
  onCancelAction: (msgId: string) => void
  actionExecuting: boolean
  language: 'en' | 'ml'
}) {
  const isUser = message.role === 'user'
  const isMl = language === 'ml'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isUser ? 'bg-indigo-600' : 'bg-gray-100'
      }`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-indigo-600" />}
      </div>
      <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
      }`}>
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* Action Confirmation Card */}
        {message.action && (
          <div className="mt-3 p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-3 text-gray-900">
            <div className="text-sm font-semibold whitespace-pre-line">
              {message.action.confirmationMessage}
            </div>

            {message.action.status === 'pending' || !message.action.status ? (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm"
                  onClick={() => onConfirmAction(message.id, message.action!)}
                  disabled={actionExecuting}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  {isMl ? 'അതെ' : 'Confirm'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={() => onCancelAction(message.id)}
                  disabled={actionExecuting}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  {isMl ? 'റദ്ദാക്കുക' : 'Cancel'}
                </Button>
              </div>
            ) : message.action.status === 'confirmed' ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100/80 p-2 rounded-lg">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{message.action.resultMessage || (isMl ? 'സ്റ്റോക്ക് അപ്ഡേറ്റ് ചെയ്തു' : 'Action confirmed')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 p-2 rounded-lg">
                <X className="h-4 w-4 shrink-0" />
                <span>{isMl ? 'നടപടി റദ്ദാക്കി' : 'Action cancelled'}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Voice confirmation modal before submitting speech
function VoiceConfirmModal({
  transcript,
  onConfirm,
  onDismiss,
  language,
}: {
  transcript: string
  onConfirm: (text: string) => void
  onDismiss: () => void
  language: 'en' | 'ml'
}) {
  const isMl = language === 'ml'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Mic className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">{isMl ? 'കേട്ടത്:' : 'I heard:'}</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-gray-800 text-sm italic font-medium">"{transcript}"</p>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {isMl ? 'ഇത് AI അസിസ്റ്റന്റിലേക്ക് അയക്കട്ടേ?' : 'Send this as your message to the AI assistant?'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onDismiss}>
            <X className="h-4 w-4 mr-1" /> {isMl ? 'റദ്ദാക്കുക' : 'Discard'}
          </Button>
          <Button className="flex-1" onClick={() => onConfirm(transcript)}>
            <CheckCircle className="h-4 w-4 mr-1" /> {isMl ? 'അയക്കുക' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any
  }
}

export default function AIPage() {
  const { language, t } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionExecuting, setActionExecuting] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceSpeechSupported, setVoiceSpeechSupported] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const fetchProducts = useCallback(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts(data.products || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) setVoiceSpeechSupported(true)
    fetchProducts()
  }, [fetchProducts])

  // Set initial greeting based on language
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0 || (prev.length === 1 && prev[0].id === '0')) {
        return [
          {
            id: '0',
            role: 'assistant',
            content: t('aiGreeting'),
            timestamp: new Date(),
          }
        ]
      }
      return prev
    })
  }, [language, t])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), language }),
      })
      const data = await res.json()

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || data.error || (language === 'ml' ? 'ക്ഷമിക്കണം, നിർദ്ദേശം പ്രോസസ്സ് ചെയ്യാൻ സാധിച്ചില്ല.' : 'Sorry, I could not process that request.'),
        timestamp: new Date(),
        action: data.action ? { ...data.action, status: 'pending' } : undefined,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: language === 'ml'
          ? 'നെറ്റ്‌വർക്ക് തകരാർ. ദയവായി വീണ്ടും ശ്രമിക്കുക.'
          : 'Network error. Please check your connection and try again.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAction = async (msgId: string, action: ActionProposal) => {
    setActionExecuting(true)
    try {
      const res = await fetch('/api/ai/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: action.actionType,
          productId: action.productId,
          quantity: action.quantity,
          newPrice: action.newPrice,
          language,
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setMessages(prev => prev.map(m => {
          if (m.id === msgId && m.action) {
            return {
              ...m,
              action: {
                ...m.action,
                status: 'confirmed',
                resultMessage: data.message,
              },
            }
          }
          return m
        }))
        fetchProducts()
      } else {
        alert(data.error || 'Failed to execute action')
      }
    } catch {
      alert('Network error while executing action')
    } finally {
      setActionExecuting(false)
    }
  }

  const handleCancelAction = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.action) {
        return {
          ...m,
          action: {
            ...m.action,
            status: 'cancelled',
          },
        }
      }
      return m
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    // Use selected language for speech recognition
    recognition.lang = language === 'ml' ? 'ml-IN' : 'en-IN'
    recognition.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      setVoiceTranscript(text)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const handleVoiceConfirm = (text: string) => {
    setVoiceTranscript('')
    sendMessage(text)
  }

  const quickQuestions = language === 'ml' ? QUICK_QUESTIONS_ML : QUICK_QUESTIONS_EN

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem-3.75rem)] md:h-screen">
      {/* Desktop Header (hidden on mobile since MobileTopBar handles it) */}
      <div className="hidden md:flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{t('aiTitle')}</h1>
          <p className="text-xs text-gray-500">{t('aiSubtitle')}</p>
        </div>
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setSaleModalOpen(true)}>
          {t('recordSaleBtn')}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3 sm:space-y-4 bg-gray-50">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onConfirmAction={handleConfirmAction}
            onCancelAction={handleCancelAction}
            actionExecuting={actionExecuting}
            language={language}
          />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <Bot className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-3.5 sm:px-6 py-2.5 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto shrink-0 no-scrollbar">
          {quickQuestions.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full whitespace-nowrap hover:bg-indigo-100 transition-colors shrink-0"
            >
              <Sparkles className="h-3 w-3" />
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-4 bg-white border-t border-gray-200 shrink-0">
        <div className="flex gap-2 sm:gap-3 items-end max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('aiPlaceholder')}
            className="flex-1 min-h-[42px] sm:min-h-[44px] max-h-[100px] sm:max-h-[120px] resize-none text-sm sm:text-base py-2.5"
            disabled={loading}
          />
          {voiceSpeechSupported && (
            <Button
              type="button"
              variant={isListening ? 'warning' : 'outline'}
              size="icon"
              onClick={isListening ? stopVoice : startVoice}
              disabled={loading}
              className={`shrink-0 h-10 w-10 sm:h-11 sm:w-11 ${isListening ? 'animate-pulse' : ''}`}
              title={isListening ? 'Stop' : 'Voice Input'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            size="icon"
            className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 shadow-xs"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[11px] sm:text-xs text-center text-gray-400 mt-1.5 sm:mt-2">
          {isListening ? t('micListening') : t('pressEnterHint')}
        </p>
      </div>

      {/* Voice confirmation modal */}
      {voiceTranscript && (
        <VoiceConfirmModal
          transcript={voiceTranscript}
          onConfirm={handleVoiceConfirm}
          onDismiss={() => setVoiceTranscript('')}
          language={language}
        />
      )}

      <RecordSaleModal
        open={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        products={products.filter(p => p.currentStock > 0)}
        onSaleRecorded={fetchProducts}
      />
    </div>
  )
}

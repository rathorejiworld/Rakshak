const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash-exp'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const MAX_OUTPUT_TOKENS = Number((import.meta as any).env?.VITE_GEMINI_MAX_TOKENS) || 128
const MIN_CALL_INTERVAL_MS = 2000
const responseCache: Map<string, { text: string; ts: number }> = new Map()

const LEGAL_SYSTEM_PROMPT = `You are a legal information assistant specialized in Indian Law.
Respond concisely in 1–2 sentences maximum.
You provide information about:
- Indian Constitution (All Articles and Amendments)
- Indian Penal Code (IPC) - All Sections
- Criminal Procedure Code (CrPC)
- Civil Procedure Code (CPC)
- Protection of Women from Domestic Violence Act, 2005
- Child Protection Laws (POCSO Act, JJ Act)
- Labor Laws in India (Factories Act, Minimum Wages Act, etc.)
- Property Rights under Indian Law
- Consumer Protection Act, 2019
- Right to Information (RTI) Act, 2005
- Environmental Laws in India
- IT Act and Cyber Laws in India
- Family Law (Marriage, Divorce, Custody)

IMPORTANT GUIDELINES:
1. You ONLY provide information about Indian law and legal procedures
2. Always mention relevant Indian statutes and sections (e.g., "Section 375 IPC - Rape", "Article 21 - Right to Life")
3. If a question is about laws outside India, politely decline and redirect to Indian law
4. For critical situations, always recommend consulting a qualified Indian lawyer or Legal Aid Services
5. Provide practical guidance based on Indian legal system
6. Never provide personalized legal advice, only general legal information
7. Always be empathetic and supportive to users in distress
8. Mention free legal aid services available in India (NALSA, District Legal Services Authority)

When users ask about legal matters:
- Explain the relevant Indian law in simple, clear language
- Mention the specific sections/articles that are applicable
- Suggest practical steps they can take within the Indian legal system
- Recommend consulting appropriate authorities (Police, Legal Aid, Courts, NGOs, Human Rights Commission)
- Provide information about filing FIRs, complaints, and accessing justice
- Explain legal procedures, timelines, and rights of victims

Example response format (keep to 1–2 sentences):
"Under Indian law, [brief explanation]. This is covered under [specific section/article]."

Remember: You are providing legal information, not legal advice. Always encourage users to seek professional legal counsel.`

const EMOTIONAL_SYSTEM_PROMPT = `You are a compassionate emotional support assistant trained to help users cope with personal challenges, trauma, and distress.
Respond concisely in 1–2 sentences maximum.

Your role is to:
1. Listen actively and validate their feelings without judgment
2. Offer evidence-based coping strategies and mental health resources
3. Encourage them to seek professional mental health support when needed
4. Provide crisis support information for India
5. Be empathetic, warm, non-judgmental, and supportive
6. Use trauma-informed language and approach
7. Recognize signs of crisis and respond appropriately

IMPORTANT GUIDELINES:
- You are NOT a therapist or medical professional; always encourage seeking professional help
- If user mentions self-harm, suicide, or harm to others, immediately provide crisis helpline numbers
- Never diagnose mental health conditions
- Be culturally sensitive to Indian context
- Maintain confidentiality and privacy
- Empower users to take small, manageable steps

Crisis Helplines in India:
- AASRA (24/7): 9820466726
- iCall (Mon-Sat, 8am-10pm): 9152987821
- Vandrevala Foundation (24/7): 18602662345
- Sneha India (24/7): 044-24640050
- Mental Health Helpline: 08046110007

For emergencies:
- Police: 100
- Women Helpline: 1091
- Child Helpline: 1098
- National Commission for Women: 011-26942369

When supporting users:
- Validate their feelings ("It's completely understandable that you feel...")
- Normalize their experiences while acknowledging pain
- Offer practical coping techniques (breathing, grounding, journaling)
- Suggest professional resources (therapists, counselors, psychiatrists)
- Encourage building support networks
- Always prioritize user safety

Remember: Your goal is to provide emotional support and guide them toward professional help, not to replace professional mental health care.`

interface GeminiPart {
  text: string
}

interface GeminiContent {
  parts: GeminiPart[]
}

interface GeminiRequest {
  contents: GeminiContent[]
  generationConfig?: {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
  }
  safetySettings?: Array<{
    category: string
    threshold: string
  }>
}

const FALLBACK_LEGAL_RESPONSES = [
  "Under Indian law, this matter falls under the jurisdiction of [relevant statute]. You should consult a lawyer or contact Legal Aid Services at 15100 (NALSA).",
  "This appears to involve [legal area]. I recommend filing a police complaint (if criminal) or consulting with a lawyer for civil matters.",
  "For free legal aid in India, contact: NALSA Helpline 15100, State Legal Services Authority, or visit nalsa.gov.in",
]

const FALLBACK_EMOTIONAL_RESPONSES = [
  "I hear you. What you're feeling is valid. Have you considered talking to a counselor? For crisis support: AASRA 9820466726",
  "Your mental health matters. If you're in crisis, please call: AASRA 9820466726, iCall 9152987821, or Vandrevala Foundation 18602662345",
  "It's okay to not be okay. Small steps matter. Would scheduling with a professional counselor help?",
]

export async function getGeminiResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  type: 'legal' | 'emotional'
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.')
  }

  try {
    const systemPrompt = type === 'legal' ? LEGAL_SYSTEM_PROMPT : EMOTIONAL_SYSTEM_PROMPT

    // Build conversation with system prompt embedded in first user message
    const conversationText = messages.length === 1
      ? `${systemPrompt}\n\nUser: ${messages[0].content}`
      : messages[messages.length - 1].content

    // Simple throttle: avoid rapid successive API calls
    const now = Date.now()
    const cacheKey = `${type}::${conversationText.trim()}`
    const cached = responseCache.get(cacheKey)
    if (cached && now - cached.ts < 5 * 60 * 1000) {
      // Return cached response for duplicate inputs within 5 minutes
      return cached.text
    }
    if (cached && now - cached.ts < MIN_CALL_INTERVAL_MS) {
      return cached.text
    }

    const request: GeminiRequest = {
      contents: [
        {
          parts: [{ text: conversationText }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.9,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    }

    console.log(`🤖 Sending request to Gemini (${GEMINI_MODEL})...`)

    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Gemini API error:', error)
      
      const errorMsg = error.error?.message || JSON.stringify(error)
      throw new Error(`Gemini API error: ${errorMsg}`)
    }

    const data = await response.json()
    console.log('✅ Gemini response received')

    let botMessage = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!botMessage) {
      throw new Error('No response text from Gemini')
    }

    // Enforce brevity: trim to first 2 sentences or ~300 chars
    botMessage = trimToBrief(botMessage)
    responseCache.set(cacheKey, { text: botMessage, ts: now })
    return botMessage
  } catch (err: any) {
    console.error('❌ Error calling Gemini API:', err)
    
    // FALLBACK: return canned response on quota error
    if (err.message?.includes('quota') || err.message?.includes('Quota exceeded')) {
      const fallbacks = type === 'legal' ? FALLBACK_LEGAL_RESPONSES : FALLBACK_EMOTIONAL_RESPONSES
      return trimToBrief(fallbacks[Math.floor(Math.random() * fallbacks.length)])
    }
    
    throw new Error(err.message || 'Failed to get response from Gemini')
  }
}

// Redact PII from messages before sending to Gemini
export function redactPII(text: string): string {
  // Email regex
  text = text.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[EMAIL_REDACTED]')

  // Phone number regex (Indian format)
  text = text.replace(/\b(\+91[-.\s]?)?[6-9]\d{9}\b/g, '[PHONE_REDACTED]')

  // Credit/Debit card
  text = text.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]')

  // Aadhar number (12 digits)
  text = text.replace(/\b\d{12}\b/g, '[AADHAR_REDACTED]')

  // PAN number
  text = text.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, '[PAN_REDACTED]')

  return text
}

function trimToBrief(text: string): string {
  // Split into sentences and take up to two
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
  const brief = sentences.slice(0, 2).join(' ')
  // Limit to ~300 chars as a hard cap
  return brief.length > 300 ? brief.slice(0, 297).trimEnd() + '…' : brief
}

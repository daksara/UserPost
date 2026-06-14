import { describe, expect, it } from 'vitest'
import { filterGeminiModels, filterGroqModels, toGeminiPayload } from './providers'

describe('filterGroqModels', () => {
  it('keeps active chat models and drops non-chat / inactive ones', () => {
    const out = filterGroqModels([
      { id: 'llama-3.3-70b-versatile' },
      { id: 'whisper-large-v3' },
      { id: 'llama-guard-4-12b' },
      { id: 'old-model', active: false },
    ])
    expect(out.map((m) => m.id)).toEqual(['llama-3.3-70b-versatile'])
  })

  it('sorts alphabetically by label', () => {
    const out = filterGroqModels([{ id: 'zeta' }, { id: 'alpha' }])
    expect(out.map((m) => m.id)).toEqual(['alpha', 'zeta'])
  })
})

describe('filterGeminiModels', () => {
  it('keeps only models that support generateContent', () => {
    const out = filterGeminiModels([
      {
        name: 'models/gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        supportedGenerationMethods: ['generateContent', 'streamGenerateContent'],
      },
      { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
      { name: 'models/gemini-pro-vision', supportedGenerationMethods: ['countTokens'] },
    ])
    expect(out).toEqual([{ id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' }])
  })
})

describe('toGeminiPayload', () => {
  it('splits system instruction and maps assistant role to model', () => {
    const payload = toGeminiPayload([
      { role: 'system', content: 'Be helpful' },
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Bye' },
    ])
    expect(payload.systemInstruction).toEqual({ parts: [{ text: 'Be helpful' }] })
    expect(payload.contents).toEqual([
      { role: 'user', parts: [{ text: 'Hi' }] },
      { role: 'model', parts: [{ text: 'Hello' }] },
      { role: 'user', parts: [{ text: 'Bye' }] },
    ])
  })

  it('omits systemInstruction when there is no system message', () => {
    const payload = toGeminiPayload([{ role: 'user', content: 'Hi' }])
    expect(payload.systemInstruction).toBeUndefined()
  })
})

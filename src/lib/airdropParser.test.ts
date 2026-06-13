import { describe, it, expect } from 'vitest'
import { parseAirdrop } from './airdropParser'

describe('parseAirdrop', () => {
  it('parses a typical Telegram airdrop post', () => {
    const raw = `New Airdrops : Worm WTF
🏷 Reward : $200,000
🪂 Register : https://t.me/wormcupbot?startapp=NWDRYEH
➖️ Complete Task
➖️ Predict Score
➖️ Tap Tap Ball
➖ Earn Points
➖️ LFG`
    const r = parseAirdrop(raw)
    expect(r.name).toBe('Worm WTF')
    expect(r.reward).toBe('$200,000')
    expect(r.registerUrl).toBe('https://t.me/wormcupbot?startapp=NWDRYEH')
    expect(r.tasks).toEqual(['Complete Task', 'Predict Score', 'Tap Tap Ball', 'Earn Points', 'LFG'])
  })

  it('falls back to the first line when no "Airdrop" label exists', () => {
    const r = parseAirdrop('Some Project\n- Do this\n- Do that')
    expect(r.name).toBe('Some Project')
    expect(r.tasks).toEqual(['Do this', 'Do that'])
  })

  it('handles empty input', () => {
    const r = parseAirdrop('')
    expect(r).toEqual({ name: '', reward: '', registerUrl: '', tasks: [] })
  })

  it('does not mistake "Register" for "Reward"', () => {
    const r = parseAirdrop('Airdrop: X\nRegister : https://example.com/go')
    expect(r.reward).toBe('')
    expect(r.registerUrl).toBe('https://example.com/go')
  })
})

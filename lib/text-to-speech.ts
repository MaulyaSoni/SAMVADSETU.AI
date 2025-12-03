// Text-to-Speech utilities using Web Speech API

export interface TTSOptions {
  language?: string
  rate?: number
  pitch?: number
  volume?: number
}

const defaultOptions: TTSOptions = {
  language: "en-US",
  rate: 1,
  pitch: 1,
  volume: 1,
}

export class TextToSpeechService {
  private synthesis: SpeechSynthesis | null = null
  private isSpeaking = false

  constructor() {
    if (typeof window !== "undefined") {
      this.synthesis = window.speechSynthesis
    }
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.synthesis) {
      return
    }

    // Cancel any ongoing speech
    this.synthesis.cancel()

    const mergedOptions = { ...defaultOptions, ...options }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = mergedOptions.language!
    utterance.rate = mergedOptions.rate!
    utterance.pitch = mergedOptions.pitch!
    utterance.volume = mergedOptions.volume!

    utterance.onstart = () => {
      this.isSpeaking = true
    }

    utterance.onend = () => {
      this.isSpeaking = false
    }

    utterance.onerror = () => {
      this.isSpeaking = false
    }

    this.synthesis.speak(utterance)
  }

  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.isSpeaking = false
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }
}

export const ttsService = typeof window !== "undefined" ? new TextToSpeechService() : null

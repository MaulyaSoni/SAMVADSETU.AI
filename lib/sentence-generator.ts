// NLP Sentence Generation - Convert gestures to natural language
// Enhanced with more gesture mappings and context awareness

export interface SentenceTemplate {
  patterns: string[]
  contexts: string[]
  priority: number // Higher = more likely to be selected for context
}

export const sentenceTemplates: Record<string, SentenceTemplate> = {
  // Greetings
  hello: {
    patterns: ["Hello!", "Hi there!", "Greetings!", "Hey!"],
    contexts: ["greeting", "social"],
    priority: 1,
  },
  goodbye: {
    patterns: ["Goodbye!", "See you later!", "Take care!", "Bye!"],
    contexts: ["greeting", "social"],
    priority: 1,
  },
  thank_you: {
    patterns: ["Thank you!", "Thanks so much!", "I appreciate it.", "Thank you very much!"],
    contexts: ["gratitude", "social"],
    priority: 2,
  },
  please: {
    patterns: ["Please.", "If you please.", "Would you please?"],
    contexts: ["request", "polite"],
    priority: 2,
  },
  sorry: {
    patterns: ["I'm sorry.", "My apologies.", "Excuse me.", "Sorry about that."],
    contexts: ["apology", "social"],
    priority: 2,
  },

  // Responses
  yes: {
    patterns: ["Yes.", "That's correct.", "I agree.", "Absolutely.", "Right."],
    contexts: ["affirmation", "response"],
    priority: 1,
  },
  no: {
    patterns: ["No.", "I disagree.", "That's not right.", "I don't think so."],
    contexts: ["negation", "response"],
    priority: 1,
  },
  ok: {
    patterns: ["OK.", "Alright.", "That's fine.", "Sounds good."],
    contexts: ["affirmation", "response"],
    priority: 1,
  },
  good: {
    patterns: ["Good!", "That's good.", "Great!", "Excellent!"],
    contexts: ["positive", "emotion"],
    priority: 1,
  },
  bad: {
    patterns: ["Bad.", "That's not good.", "Not great.", "Poor."],
    contexts: ["negative", "emotion"],
    priority: 1,
  },

  // Requests
  help: {
    patterns: ["I need help.", "Can you help me?", "Please help!", "Help me please."],
    contexts: ["request", "emergency", "urgent"],
    priority: 3,
  },
  stop: {
    patterns: ["Stop!", "Please stop.", "Wait, stop.", "Hold on."],
    contexts: ["command", "urgent"],
    priority: 3,
  },
  wait: {
    patterns: ["Wait.", "Please wait.", "Hold on a moment.", "Just a moment."],
    contexts: ["command", "request"],
    priority: 2,
  },
  come: {
    patterns: ["Come here.", "Please come.", "Come with me.", "Follow me."],
    contexts: ["command", "request"],
    priority: 2,
  },
  go: {
    patterns: ["Go.", "Let's go.", "Time to go.", "We should go."],
    contexts: ["command", "action"],
    priority: 2,
  },

  // Medical emergencies
  pain: {
    patterns: ["I am in pain.", "It hurts.", "I feel pain.", "I'm hurting."],
    contexts: ["medical", "emergency", "symptom"],
    priority: 4,
  },
  pain_head: {
    patterns: ["I have a headache.", "My head hurts.", "Head pain.", "Severe headache."],
    contexts: ["medical", "symptom"],
    priority: 4,
  },
  pain_chest: {
    patterns: ["I have chest pain.", "My chest hurts.", "Chest pain!", "My heart hurts."],
    contexts: ["medical", "emergency", "critical"],
    priority: 5,
  },
  pain_stomach: {
    patterns: ["I have stomach pain.", "My stomach hurts.", "Stomachache.", "Abdominal pain."],
    contexts: ["medical", "symptom"],
    priority: 4,
  },
  fever: {
    patterns: ["I have a fever.", "I feel hot.", "High temperature.", "I'm burning up."],
    contexts: ["medical", "symptom"],
    priority: 3,
  },
  medicine: {
    patterns: ["I need medicine.", "Where is my medicine?", "Give me medicine.", "Medication please."],
    contexts: ["medical", "request"],
    priority: 3,
  },
  doctor: {
    patterns: ["I need a doctor.", "Call a doctor.", "Where is the doctor?", "Get a doctor please."],
    contexts: ["medical", "emergency"],
    priority: 4,
  },
  hospital: {
    patterns: ["Take me to the hospital.", "I need to go to hospital.", "Hospital please.", "Emergency room."],
    contexts: ["medical", "emergency", "critical"],
    priority: 5,
  },
  emergency: {
    patterns: ["This is an emergency!", "Emergency!", "Call for help!", "Urgent help needed!"],
    contexts: ["emergency", "critical"],
    priority: 5,
  },

  // Daily needs
  water: {
    patterns: ["I need water.", "Can I have water?", "Water please.", "I'm thirsty."],
    contexts: ["daily", "need"],
    priority: 2,
  },
  food: {
    patterns: ["I am hungry.", "I need food.", "Food please.", "Can I eat?"],
    contexts: ["daily", "need"],
    priority: 2,
  },
  eat: {
    patterns: ["I want to eat.", "Time to eat.", "Let's eat.", "I need to eat."],
    contexts: ["daily", "action"],
    priority: 2,
  },
  drink: {
    patterns: ["I want to drink.", "I'm thirsty.", "Something to drink.", "Drink please."],
    contexts: ["daily", "action"],
    priority: 2,
  },
  bathroom: {
    patterns: ["Where is the bathroom?", "I need the bathroom.", "Bathroom please.", "Restroom?"],
    contexts: ["daily", "need", "urgent"],
    priority: 3,
  },
  sleep: {
    patterns: ["I am tired.", "I need to sleep.", "I want to rest.", "Time for sleep."],
    contexts: ["daily", "state"],
    priority: 2,
  },

  // Emotions
  happy: {
    patterns: ["I am happy.", "I feel good.", "I'm feeling great!", "So happy!"],
    contexts: ["emotion", "positive"],
    priority: 1,
  },
  sad: {
    patterns: ["I am sad.", "I feel down.", "I'm not feeling well.", "Feeling sad."],
    contexts: ["emotion", "negative"],
    priority: 2,
  },
  angry: {
    patterns: ["I am angry.", "I'm upset.", "This makes me angry.", "I'm frustrated."],
    contexts: ["emotion", "negative"],
    priority: 2,
  },
  scared: {
    patterns: ["I am scared.", "I'm afraid.", "I'm frightened.", "Help, I'm scared!"],
    contexts: ["emotion", "negative", "urgent"],
    priority: 3,
  },

  // Expressions
  i_love_you: {
    patterns: ["I love you.", "Love you!", "I love you so much."],
    contexts: ["emotion", "positive", "social"],
    priority: 2,
  },
  call: {
    patterns: ["Call someone.", "Make a phone call.", "I need to call.", "Phone call please."],
    contexts: ["communication", "request"],
    priority: 2,
  },
  home: {
    patterns: ["I want to go home.", "Take me home.", "Home please.", "Let's go home."],
    contexts: ["location", "request"],
    priority: 2,
  },
  work: {
    patterns: ["I have to work.", "Going to work.", "Work time.", "At work."],
    contexts: ["activity", "daily"],
    priority: 1,
  },
  money: {
    patterns: ["I need money.", "Money please.", "How much money?", "Pay money."],
    contexts: ["transaction", "request"],
    priority: 2,
  },
  time: {
    patterns: ["What time is it?", "I need time.", "Time please.", "Check the time."],
    contexts: ["information", "question"],
    priority: 1,
  },
  today: {
    patterns: ["Today.", "For today.", "Happening today.", "This is for today."],
    contexts: ["time", "information"],
    priority: 1,
  },
  tomorrow: {
    patterns: ["Tomorrow.", "See you tomorrow.", "For tomorrow.", "Happening tomorrow."],
    contexts: ["time", "information"],
    priority: 1,
  },
}

// Get sentence for single gesture
export function generateSentence(gesture: string, context = "general"): string {
  const key = gesture.toLowerCase().replace(/\s+/g, "_")
  const template = sentenceTemplates[key]

  if (!template) {
    return `${gesture}.`
  }

  // Pick random sentence from patterns
  const pattern = template.patterns[Math.floor(Math.random() * template.patterns.length)]
  return pattern
}

export function generateContextualSentence(gestures: string[]): string {
  if (gestures.length === 0) return ""
  if (gestures.length === 1) return generateSentence(gestures[0])

  // Get the last few gestures for context
  const recentGestures = gestures.slice(-5)

  // Check for medical context
  const medicalKeywords = ["pain", "doctor", "medicine", "hospital", "fever", "hurt", "help", "emergency"]
  const isMedicalContext = recentGestures.some((g) => medicalKeywords.some((k) => g.toLowerCase().includes(k)))

  // Check for body part + pain combination
  const bodyParts = ["head", "chest", "stomach", "back", "arm", "leg", "hand"]
  const lastGesture = recentGestures[recentGestures.length - 1].toLowerCase()
  const prevGesture = recentGestures.length > 1 ? recentGestures[recentGestures.length - 2].toLowerCase() : ""

  // Smart sentence building
  if (lastGesture.includes("pain") || prevGesture.includes("pain")) {
    const location = bodyParts.find((part) => recentGestures.some((g) => g.toLowerCase().includes(part)))

    if (location) {
      const templates = [
        `I have ${location} pain.`,
        `My ${location} hurts.`,
        `I'm experiencing pain in my ${location}.`,
        `Help, my ${location} is hurting.`,
      ]
      return templates[Math.floor(Math.random() * templates.length)]
    }
  }

  // Medical emergency combination
  if (isMedicalContext) {
    const hasEmergency = recentGestures.some(
      (g) => g.toLowerCase().includes("emergency") || g.toLowerCase().includes("help"),
    )
    const hasDoctor = recentGestures.some((g) => g.toLowerCase().includes("doctor"))
    const hasHospital = recentGestures.some((g) => g.toLowerCase().includes("hospital"))

    if (hasEmergency && hasDoctor) {
      return "This is an emergency! Please call a doctor immediately!"
    }
    if (hasEmergency && hasHospital) {
      return "Emergency! I need to go to the hospital right now!"
    }
  }

  // Need + item combination
  const needs = ["water", "food", "medicine", "help", "bathroom"]
  for (const need of needs) {
    if (recentGestures.some((g) => g.toLowerCase().includes(need))) {
      const hasPlease = recentGestures.some((g) => g.toLowerCase().includes("please"))
      if (hasPlease) {
        return `${need.charAt(0).toUpperCase() + need.slice(1)} please. I need ${need}.`
      }
    }
  }

  // Default: combine last 2-3 gestures
  const combinedSentences = recentGestures
    .slice(-3)
    .map((g) => generateSentence(g))
    .join(" ")

  return combinedSentences
}

// Get available gesture keys
export function getAvailableGestures(): string[] {
  return Object.keys(sentenceTemplates).map((key) =>
    key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
  )
}

// Check if gesture has template
export function hasTemplate(gesture: string): boolean {
  const key = gesture.toLowerCase().replace(/\s+/g, "_")
  return key in sentenceTemplates
}

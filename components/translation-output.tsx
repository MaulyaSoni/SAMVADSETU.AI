"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ttsService } from "@/lib/text-to-speech"

interface TranslationOutputProps {
  sentence: string
  isLoading?: boolean
  onClear?: () => void
}

export function TranslationOutput({ sentence, isLoading = false, onClear }: TranslationOutputProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleSpeak = async () => {
    if (!sentence || !ttsService) return

    try {
      setIsSpeaking(true)
      await ttsService.speak(sentence, {
        language: "en-US",
        rate: 1,
        pitch: 1,
      })

      // Wait for speech to finish
      setTimeout(() => setIsSpeaking(false), 3000)
    } catch (error) {
      console.error("[v0] Speech error:", error)
      setIsSpeaking(false)
    }
  }

  const handleStop = () => {
    if (ttsService) {
      ttsService.stop()
      setIsSpeaking(false)
    }
  }

  if (!sentence) {
    return (
      <Card className="container-glass border-border/50">
        <CardContent className="pt-6 text-center text-muted-foreground">Translated text will appear here</CardContent>
      </Card>
    )
  }

  return (
    <Card className="container-glass border-accent/30">
      <CardHeader>
        <CardTitle className="text-accent">Translation Output</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-card/50 rounded-lg border border-border/50">
          <p className="text-lg font-medium leading-relaxed text-balance">{sentence}</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSpeak}
            disabled={isLoading || isSpeaking}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSpeaking ? "Speaking..." : "Speak"}
          </Button>
          {isSpeaking && (
            <Button onClick={handleStop} variant="outline" className="border-secondary text-secondary bg-transparent">
              Stop
            </Button>
          )}
          {onClear && (
            <Button onClick={onClear} variant="outline" className="border-muted text-muted-foreground bg-transparent">
              Clear
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs bg-transparent"
            onClick={() => {
              // Copy to clipboard
              if (sentence) {
                navigator.clipboard.writeText(sentence)
              }
            }}
          >
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs bg-transparent"
            onClick={() => {
              // Download as text
              const element = document.createElement("a")
              element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(sentence)}`)
              element.setAttribute("download", "translation.txt")
              element.style.display = "none"
              document.body.appendChild(element)
              element.click()
              document.body.removeChild(element)
            }}
          >
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

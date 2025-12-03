"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ConversationEntry {
  id: string
  gesture: string
  sentence: string
  timestamp: Date
  confidence: number
}

interface ConversationHistoryProps {
  entries: ConversationEntry[]
  onClear?: () => void
}

export function ConversationHistory({ entries, onClear }: ConversationHistoryProps) {
  return (
    <Card className="container-glass border-secondary/30 h-96">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-secondary text-sm">Conversation History</CardTitle>
        {entries.length > 0 && onClear && (
          <Button onClick={onClear} variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">No conversation yet</p>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-3 pr-4">
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="p-3 bg-card/50 rounded-lg border border-border/50 hover:border-secondary/50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{entry.sentence}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded">{entry.gesture}</span>
                        <span className="text-xs text-muted-foreground">{(entry.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {entry.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

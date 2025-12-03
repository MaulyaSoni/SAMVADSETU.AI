import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          {/* Hero section */}
          <div className="space-y-6 text-center">
            <h1 className="text-5xl font-bold tracking-tight">
              About <span className="text-primary">SignBridge</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Giving voice to hands — enabling everyone to be understood.
            </p>
          </div>

          {/* Mission */}
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center">Our Mission</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                <p>
                  Millions of people who are deaf or unable to speak rely on sign language to communicate. However,{" "}
                  <span className="text-foreground font-medium">
                    90%+ of the hearing population does not understand sign language
                  </span>{" "}
                  — causing serious communication gaps in daily life, especially in hospitals, workplaces, and
                  emergencies.
                </p>
                <p>
                  SignBridge uses AI-powered computer vision to bridge this gap. We provide a real-time, accessible, and
                  low-cost communication tool that transforms sign gestures into meaningful language.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-center">How It Works</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  step: "1",
                  title: "Video Capture",
                  desc: "Live webcam stream with multi-frame gesture recording",
                  color: "primary",
                },
                {
                  step: "2",
                  title: "Keypoint Extraction",
                  desc: "Extracts 21-point 3D hand coordinates and joint positions",
                  color: "secondary",
                },
                {
                  step: "3",
                  title: "Gesture Recognition",
                  desc: "Neural network classifies hand movements into known gestures",
                  color: "accent",
                },
                {
                  step: "4",
                  title: "Sentence Generation",
                  desc: "NLP layer converts gestures into natural, readable sentences",
                  color: "primary",
                },
              ].map((item) => (
                <Card key={item.step} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex gap-4">
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-xl bg-${item.color}/10 flex items-center justify-center`}
                      >
                        <span className={`font-bold text-lg text-${item.color}`}>{item.step}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <Card className="bg-card/50 border-secondary/20">
            <CardContent className="pt-8 pb-8 space-y-6">
              <h2 className="text-2xl font-bold text-center">Technology Stack</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-2xl mx-auto">
                {[
                  { label: "Frontend", tech: "Next.js + React + TypeScript" },
                  { label: "Styling", tech: "Tailwind CSS + shadcn/ui" },
                  { label: "Hand Detection", tech: "Canvas-based Skin Detection" },
                  { label: "ML Framework", tech: "TensorFlow.js (Browser)" },
                  { label: "Data Storage", tech: "IndexedDB (Client-side)" },
                  { label: "Speech", tech: "Web Speech API" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-sm font-medium text-primary mb-1">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.tech}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Roadmap */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Future Roadmap</h2>
            <div className="space-y-3 max-w-xl mx-auto">
              {[
                "Mobile app with AR support for on-the-go translation",
                "Two-way translation: Text/Voice to Sign animations",
                "Hospital and public service integrations",
                "Multilingual gesture recognition (ISL, ASL, BSL)",
                "Full-body pose for improved grammar context",
                "Cloud-based model sharing and collaboration",
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center p-3 rounded-lg bg-card/50 border border-border/50">
                  <span className="text-primary font-bold">{idx + 1}</span>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-4 pt-8">
            <h3 className="text-xl font-semibold">Ready to get started?</h3>
            <div className="flex gap-4 justify-center">
              <Link href="/collect">
                <Button variant="outline">Collect Data</Button>
              </Link>
              <Link href="/recognize">
                <Button className="bg-primary hover:bg-primary/90">Start Translating</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

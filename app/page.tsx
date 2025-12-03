import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="font-bold text-2xl">
            <span className="text-primary">Sign</span>
            <span className="text-foreground">Bridge</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/recognize" className="text-muted-foreground hover:text-primary transition-colors">
              Translate
            </Link>
            <Link href="/collect" className="text-muted-foreground hover:text-primary transition-colors">
              Collect Data
            </Link>
            <Link href="/train" className="text-muted-foreground hover:text-primary transition-colors">
              Train Model
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
          </div>
          <Link href="/recognize">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">AI-Powered Communication</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            Breaking Barriers with{" "}
            <span className="text-primary relative">
              Sign Language
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-primary/30"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 6c40-4 80 4 120-4s60 8 80 4"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            Translation
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            SignBridge uses advanced machine learning to convert sign language gestures into text in real-time.
            Empowering deaf and hard-of-hearing individuals to communicate effortlessly.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/recognize">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-lg">
                Start Translating
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Link href="/collect">
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-muted px-8 h-12 text-lg bg-transparent"
              >
                Train Your Model
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">35+</div>
              <div className="text-sm text-muted-foreground">Supported Gestures</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary">Real-time</div>
              <div className="text-sm text-muted-foreground">Detection</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">100%</div>
              <div className="text-sm text-muted-foreground">Browser Based</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 bg-card/30 border-y border-border/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How SignBridge Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our four-stage pipeline transforms hand gestures into meaningful sentences
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Capture",
                desc: "Live webcam captures your hand gestures in real-time with multi-frame analysis",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                ),
              },
              {
                step: "02",
                title: "Extract",
                desc: "Advanced algorithms extract 21-point hand landmarks and joint positions",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                  />
                ),
              },
              {
                step: "03",
                title: "Classify",
                desc: "Neural network model trained on your data classifies gestures with high accuracy",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                ),
              },
              {
                step: "04",
                title: "Translate",
                desc: "NLP engine converts recognized gestures into natural, readable sentences",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                ),
              },
            ].map((feature) => (
              <div
                key={feature.step}
                className="p-6 rounded-xl bg-background border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </div>
                <div className="text-xs font-bold text-primary mb-2">STEP {feature.step}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Built for Real-World Impact</h2>
              <p className="text-muted-foreground leading-relaxed">
                SignBridge is designed to help deaf and hard-of-hearing individuals communicate effectively in various
                scenarios - from daily conversations to medical emergencies.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Healthcare",
                    desc: "Enable patients to communicate symptoms and needs to medical staff",
                  },
                  {
                    title: "Education",
                    desc: "Support inclusive learning environments in classrooms",
                  },
                  {
                    title: "Workplace",
                    desc: "Facilitate professional communication in office settings",
                  },
                  {
                    title: "Daily Life",
                    desc: "Bridge communication gaps in everyday interactions",
                  },
                ].map((useCase, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">{useCase.title}</h4>
                      <p className="text-sm text-muted-foreground">{useCase.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 p-8 border border-border/50">
                <div className="w-full h-full rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-medium">Train your own gestures</p>
                    <p className="text-sm text-muted-foreground">Custom vocabulary for your needs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 bg-card/30 border-t border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Bridge the Gap?</h2>
          <p className="text-muted-foreground mb-8">
            Start translating sign language to text in minutes. No account required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/recognize">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                Start Translating
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-border hover:bg-muted px-8 bg-transparent">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="font-bold text-xl">
              <span className="text-primary">Sign</span>
              <span className="text-foreground">Bridge</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="/recognize" className="hover:text-primary transition-colors">
                Translate
              </Link>
              <Link href="/collect" className="hover:text-primary transition-colors">
                Collect Data
              </Link>
              <Link href="/train" className="hover:text-primary transition-colors">
                Train Model
              </Link>
              <Link href="/about" className="hover:text-primary transition-colors">
                About
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Giving voice to hands</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

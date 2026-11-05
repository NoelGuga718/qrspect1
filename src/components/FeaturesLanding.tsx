import { useEffect, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, Globe, Lock, Scan, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturesLandingProps {
  onSignIn: () => void;
  onSignUp: () => void;
  onGetStarted: () => void;
}

const slides = ['/carousel-1.jpeg', '/carousel-2.jpeg', '/carousel-3.jpeg'];

const features = [
  {
    icon: Scan,
    title: 'QR Code Scanning',
    description: 'Scan QR codes with your device camera and check the link before opening it.',
  },
  {
    icon: Globe,
    title: 'Link Analysis',
    description: 'Enter a URL to run built-in checks for suspicious domains and link patterns.',
  },
  {
    icon: Shield,
    title: 'Built-in Threat Checks',
    description: 'Local security rules work without an API key or an AI service.',
  },
  {
    icon: Zap,
    title: 'Fast Results',
    description: 'Get a risk score and an explanation immediately after each scan.',
  },
  {
    icon: BarChart3,
    title: 'Private Scan History',
    description: 'Guest scan history stays in this browser on your device.',
  },
  {
    icon: Lock,
    title: 'Optional Services',
    description: 'Connect Firebase or enable Gemini locally only if you choose to configure them.',
  },
];

export function FeaturesLanding({ onSignIn, onSignUp, onGetStarted }: FeaturesLandingProps) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const moveSlide = (direction: number) => {
    setSlide((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#121212]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="flex shrink-0 items-center gap-3" aria-label="QRspect home">
            <img src="/logo.png" alt="" className="h-10 w-10 rounded-lg object-contain" />
            <span className="text-lg font-bold text-white">QRspect</span>
          </a>
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-gray-300 md:flex">
            <a className="hover:text-white" href="#how-it-works">How it works</a>
            <a className="hover:text-white" href="#features">Features</a>
            <a className="hover:text-white" href="#pricing">Pricing</a>
            <a className="hover:text-white" href="#faq">FAQ</a>
            <a className="hover:text-white" href="#contact">Contact</a>
          </nav>
          <Button onClick={onGetStarted} className="glow-button rounded-xl">
            Get Started
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              QR code security scanner
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Stop QR Code Scams Before They Start.
              <span className="mt-2 block text-gray-300">Scan with Confidence.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-400">
              Check QR codes and links for suspicious patterns before you visit them. Built-in
              checks work without an account, API key, or cloud service.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={onGetStarted} className="glow-button rounded-xl px-6 py-5">
                Protect Yourself Now
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-xl border-white/20 px-6 py-5 text-white hover:bg-white/10"
              >
                Explore Features
              </Button>
            </div>
            <div className="mt-5 flex gap-4 text-sm text-gray-400">
              <button type="button" onClick={onSignIn} className="underline underline-offset-4 hover:text-white">
                Sign In
              </button>
              <button type="button" onClick={onSignUp} className="underline underline-offset-4 hover:text-white">
                Sign Up
              </button>
            </div>
          </div>

          <div className="glass-card-strong relative overflow-hidden p-2">
            <img
              src={slides[slide]}
              alt={`QRspect app preview ${slide + 1}`}
              className="aspect-[4/3] w-full rounded-xl object-cover"
            />
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => moveSlide(-1)}
              className="absolute left-4 top-1/2 rounded-full bg-black/70 p-2 text-white hover:bg-black"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => moveSlide(1)}
              className="absolute right-4 top-1/2 rounded-full bg-black/70 p-2 text-white hover:bg-black"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
              {slides.map((image, index) => (
                <button
                  type="button"
                  key={image}
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={slide === index}
                  onClick={() => setSlide(index)}
                  className={`h-2 w-2 rounded-full ${slide === index ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Check first. Open with confidence.</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-gray-400">
            Scan a QR code or enter a link. QRspect checks the URL with built-in security rules,
            shows a risk assessment, and keeps guest scan history on your device.
          </p>
        </section>

        <section id="features" className="scroll-mt-24 py-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Features</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Security checks in your pocket</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="glass-card-strong rounded-xl p-5 sm:p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm leading-6 text-gray-400">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 py-16">
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Use the built-in scanner for free</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-400">
              No subscription or API key is needed for link checks, QR scanning, and browser-local history.
              Optional Firebase and Gemini services require your own configuration.
            </p>
            <Button onClick={onGetStarted} className="glow-button mt-6 rounded-xl px-6 py-5">
              Open Scanner
            </Button>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 py-8">
          <h2 className="mb-6 text-center text-3xl font-semibold text-white">Frequently asked questions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-white">Do I need an API key?</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                No. Built-in URL checks and QR scanning work without API keys. Gemini analysis is optional.
              </p>
            </article>
            <article className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-white">Where is guest scan history stored?</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Guest history is saved in this browser on your device. It is not synced to a cloud account.
              </p>
            </article>
            <article className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-white">Can a scan guarantee a link is safe?</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                No scanner can guarantee safety. Treat the result as guidance and avoid links you do not trust.
              </p>
            </article>
            <article className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-white">Why does camera scanning need HTTPS?</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Browsers require a secure connection or localhost before granting camera access.
              </p>
            </article>
          </div>
        </section>

        <footer id="contact" className="scroll-mt-24 mt-12 border-t border-white/10 py-8 text-center text-sm text-gray-500">
          <p className="font-semibold text-gray-300">QRspect</p>
          <p className="mt-2">Built-in protection that works without API keys.</p>
        </footer>
      </main>
    </>
  );
}

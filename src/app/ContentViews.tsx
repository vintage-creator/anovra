import { useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp, MapPin, AlertCircle, ExternalLink } from "lucide-react";
import type { View } from "./types";

// ---- ABOUT ----
export function AboutView({ setView }: { setView: (v: View) => void }) {
  const users = [
    {
      role: "Skin Care Customers",
      emoji: "🧴",
      tagline: "Know your skin. Find what actually works.",
      color: "bg-amber-50 border-amber-200",
      accentClass: "text-amber-700",
      dotColor: "bg-amber-500",
      photo: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=600&h=400&fit=crop&auto=format",
      desc: "Millions of people in Africa spend money on skincare products that don't match their skin type, tone, or concern — often because there's no accessible, personalised guidance. Anovra changes that.",
      benefits: [
        "AI-powered skin test that analyses your unique skin type, tone, and concerns",
        "Personalised product recommendations matched to your skin profile",
        "Results from vendors near you, in your budget",
        "Understand what each ingredient does and why it's recommended for you",
        "Scan product labels to check ingredient safety before you buy",
      ],
      cta: { label: "Take the free skin test", view: "skintest" as View },
      ctaSecondary: null,
    },
    {
      role: "Skincare Vendors",
      emoji: "🏪",
      tagline: "Sell smarter. Reach the right customer every time.",
      color: "bg-orange-50 border-orange-200",
      accentClass: "text-orange-700",
      dotColor: "bg-accent",
      photo: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=400&fit=crop&auto=format",
      desc: "Whether you run a single shop or a growing brand, Anovra gives you a complete digital storefront, AI-powered product matching, and real data on what your customers need — so every recommendation feels personal.",
      benefits: [
        "Your own branded skin test page — share your link and let Anovra do the selling",
        "Add your full product catalog with ingredients, benefits, and safety checks",
        "AI automatically matches customers to your products based on their skin scan",
        "Track visits, scans, and purchases from your unique link",
        "Generate a full e-commerce storefront in one click",
        "Ingredient safety layer flags harmful chemicals before they reach customers",
      ],
      cta: { label: "Join as a vendor", view: "signup" as View },
      ctaSecondary: { label: "See vendor dashboard", view: "dashboard" as View },
    },
    {
      role: "Sales & Marketing Team",
      emoji: "📣",
      tagline: "Grow the network. Earn on every vendor you bring in.",
      color: "bg-rose-50 border-rose-200",
      accentClass: "text-rose-700",
      dotColor: "bg-rose-500",
      photo: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&auto=format",
      desc: "Anovra's growth runs on the people who bring vendors onto the platform. The team portal gives every sales and marketing staff member their own referral link, live performance data, and everything they need to close.",
      benefits: [
        "Unique referral link — every vendor or customer who signs up is tracked to you",
        "Live dashboard: see clicks, scans, vendor sign-ups, and revenue generated",
        "Team leaderboard with monthly targets and commission tier tracking",
        "Downloadable pitch decks, WhatsApp scripts, and brand assets",
        "Commission on every vendor you onboard, with bonus tiers for top performers",
        "Admin-issued login — no sign-up needed, just start selling",
      ],
      cta: { label: "Sign in to Team Portal", view: "teamlogin" as View },
      ctaSecondary: null,
    },
    {
      role: "Platform Admins",
      emoji: "🛡️",
      tagline: "Full visibility. Full control.",
      color: "bg-slate-50 border-slate-200",
      accentClass: "text-slate-700",
      dotColor: "bg-slate-500",
      photo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format",
      desc: "Anovra admins keep the platform safe, fair, and growing. From approving vendors and reviewing flagged ingredients to managing team accounts and monitoring platform revenue — everything is in one place.",
      benefits: [
        "Approve or reject vendor applications with a full profile review",
        "Ingredient safety queue — AI flags potentially harmful chemicals for human review",
        "Ban or suspend vendors who violate platform guidelines",
        "Create and manage accounts for sales, marketing, and support staff",
        "Live platform overview: total vendors, scans, revenue, and subscription tiers",
        "Monitor subscribed vendor counts by plan (Free, Basic, Premium)",
      ],
      cta: { label: "Admin login", view: "adminlogin" as View },
      ctaSecondary: null,
    },
  ];

  const stats = [
    { value: "48,291", label: "Skin scans completed" },
    { value: "184", label: "Active vendors" },
    { value: "12", label: "Nigerian cities covered" },
    { value: "94%", label: "Match satisfaction rate" },
  ];

  const timeline = [
    { year: "2024", title: "Idea born", body: "Founded by a team frustrated by how hard it was for African consumers to find skincare that actually worked for their skin tone and type." },
    { year: "Q1 2025", title: "Beta launch", body: "First 20 vendors onboarded across Lagos and Abuja. Skin test engine goes live with 16 African skin concerns." },
    { year: "Q2 2025", title: "AI engine upgrade", body: "Recommendation engine expanded to 8 real-time signals. Ingredient safety layer launched to protect consumers from harmful formulations." },
    { year: "Now", title: "Scaling across Nigeria", body: "184 vendors. 48,000+ scans. Growing into a platform every African skincare brand needs to be on." },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-foreground pt-24 pb-20 px-6">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 30% 60%, #C86B3A 0%, transparent 60%), radial-gradient(circle at 80% 20%, #D4854A 0%, transparent 50%)",
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block text-xs text-accent uppercase tracking-widest mb-4 border border-accent/30 px-3 py-1 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>
            About Anovra
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-primary-foreground leading-tight mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
            Skincare intelligence,<br />
            <em className="not-italic text-accent">built for Africa</em>
          </h1>
          <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
            Anovra connects African skin care consumers to the products that actually work for their skin — and gives vendors the AI engine to make it happen. No guesswork. No generic advice. Just science-backed recommendations rooted in African skin diversity.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setView("skintest")}
              className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Try the skin test free
            </button>
            <button
              onClick={() => setView("signup")}
              className="px-6 py-3 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/15 transition-colors border border-white/15"
            >
              Join as a vendor
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/5 px-6 py-5 text-center">
              <p className="text-2xl font-light text-primary-foreground mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
                {s.value}
              </p>
              <p className="text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>Our mission</p>
        <h2 className="text-3xl sm:text-4xl font-light text-foreground leading-snug" style={{ fontFamily: "'Fraunces', serif" }}>
          Every person in Africa deserves skincare advice as personalised as their skin.
        </h2>
        <p className="text-muted-foreground mt-5 max-w-2xl mx-auto leading-relaxed">
          African skin is diverse — melanin-rich, climate-exposed, and deeply varied across regions. Yet most skincare advice is designed for skin types that look nothing like ours. Anovra was built to fix that, using AI trained on African skin data and a network of African vendors who know their customers.
        </p>
      </section>

      {/* Who we serve */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>Who we serve</p>
            <h2 className="text-3xl sm:text-4xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
              Built for everyone in the ecosystem
            </h2>
          </div>

          <div className="space-y-16">
            {users.map((u, i) => (
              <div
                key={u.role}
                className={`grid lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "lg:grid-flow-col-dense" : ""}`}
              >
                {/* Image */}
                <div className={`rounded-2xl overflow-hidden ${i % 2 === 1 ? "lg:col-start-2" : ""}`}>
                  <img
                    src={u.photo}
                    alt={u.role}
                    className="w-full h-64 object-cover"
                  />
                </div>

                {/* Content */}
                <div className={i % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}>
                  <div className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border mb-4 ${u.color} ${u.accentClass}`}>
                    <span>{u.emoji}</span>
                    <span>{u.role}</span>
                  </div>
                  <h3 className="text-2xl font-light text-foreground mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
                    {u.tagline}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                    {u.desc}
                  </p>
                  <ul className="space-y-2 mb-7">
                    {u.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${u.dotColor}`} />
                        <span className="text-foreground leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setView(u.cta.view)}
                      className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
                    >
                      {u.cta.label}
                    </button>
                    {u.ctaSecondary && (
                      <button
                        onClick={() => setView(u.ctaSecondary!.view)}
                        className="px-5 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                      >
                        {u.ctaSecondary.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-foreground/[0.03] border-y border-border mt-20 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>Our journey</p>
            <h2 className="text-3xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>From idea to infrastructure</h2>
          </div>
          <div className="relative pl-8 border-l-2 border-accent/20 space-y-10">
            {timeline.map((t, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[2.15rem] top-1 w-4 h-4 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
                <p className="text-xs font-mono text-accent mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>{t.year}</p>
                <h4 className="text-base font-semibold text-foreground mb-1">{t.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center bg-foreground">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-accent mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>Ready to start?</p>
          <h2 className="text-3xl sm:text-4xl font-light text-primary-foreground mb-5" style={{ fontFamily: "'Fraunces', serif" }}>
            Find your place in the Anovra ecosystem
          </h2>
          <p className="text-white/50 text-sm mb-10 leading-relaxed">
            Whether you have skin to care for, products to sell, or a network to grow — Anovra has a place for you.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setView("skintest")}
              className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Take the skin test
            </button>
            <button
              onClick={() => setView("signup")}
              className="px-6 py-3 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/15 transition-colors border border-white/15"
            >
              Become a vendor
            </button>
            <button
              onClick={() => setView("teamlogin")}
              className="px-6 py-3 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/15 transition-colors border border-white/15"
            >
              Join the sales team
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---- CONTACT ----
export function ContactView({ setView }: { setView: (v: View) => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1200);
  }

  const channels = [
    {
      icon: "📧",
      label: "General enquiries",
      value: "hello@anovra.africa",
      sub: "We reply within 24 hours",
    },
    {
      icon: "🏪",
      label: "Vendor support",
      value: "vendors@anovra.africa",
      sub: "Onboarding, catalog & billing help",
    },
    {
      icon: "🛡️",
      label: "Admin & compliance",
      value: "admin@anovra.africa",
      sub: "Platform issues and safety reports",
    },
    {
      icon: "💬",
      label: "WhatsApp business",
      value: "+234 800 ANOVRA",
      sub: "Mon – Fri, 9am – 6pm WAT",
    },
  ];

  const offices = [
    {
      city: "Lagos",
      address: "14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria",
      tag: "HQ",
      photo: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=340&fit=crop&auto=format",
    },
    {
      city: "Abuja",
      address: "Suite 4B, Wuse Zone 5, Abuja FCT, Nigeria",
      tag: "Satellite",
      photo: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&h=340&fit=crop&auto=format",
    },
  ];

  const faqs = [
    { q: "How do I sign up as a vendor?", a: "Click 'Join as a vendor' from the nav or the landing page. You'll need your CAC registration number and a social media handle to complete sign-up." },
    { q: "Is the skin test free for customers?", a: "Yes — the skin test is completely free for anyone. No account required. Vendors' product recommendations are shown at the end." },
    { q: "How does the AI recommendation work?", a: "Our engine analyses 8 signals from your scan — skin tone, type, concern, climate zone, age group, sensitivity, budget, and ingredient history — to rank the most suitable products in a vendor's catalog." },
    { q: "What plans do you offer vendors?", a: "We have a Free tier, a Basic plan (₦12,500/mo), and a Premium plan (₦25,000/mo). Premium includes the embed widget, unlimited catalog, and priority support." },
    { q: "How do I report a harmful ingredient or unsafe product?", a: "Email admin@anovra.africa or use the safety report form in the vendor dashboard. Our ingredient safety layer also automatically flags suspected harmful formulations." },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero */}
      <section className="bg-foreground pt-20 pb-16 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 40%, #C86B3A 0%, transparent 55%)" }}
        />
        <div className="max-w-2xl mx-auto relative z-10">
          <span className="inline-block text-xs text-accent uppercase tracking-widest mb-4 border border-accent/30 px-3 py-1 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>
            Contact us
          </span>
          <h1 className="text-4xl sm:text-5xl font-light text-primary-foreground mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
            We'd love to hear<br />from you
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Whether you're a vendor with a question, a customer needing help, or a partner looking to collaborate — our team is here.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-20">

        {/* Contact channels */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-2xl p-5 hover:border-accent/40 transition-colors">
              <span className="text-2xl mb-3 block">{c.icon}</span>
              <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
              <p className="text-sm font-medium text-foreground mb-1">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Form + offices */}
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-light text-foreground mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
              Send us a message
            </h2>
            <p className="text-sm text-muted-foreground mb-8">Fill in the form and we'll get back to you within one business day.</p>

            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>Message sent!</h3>
                <p className="text-sm text-muted-foreground mb-6">We've received your message and will reply to <strong>{form.email}</strong> within 24 hours.</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", role: "", subject: "", message: "" }); }}
                  className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Full name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Chiamaka Obi"
                      required
                      className="w-full bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Email address *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>I am a…</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent transition-colors appearance-none"
                  >
                    <option value="">Select your role</option>
                    <option value="customer">Customer / Skin test user</option>
                    <option value="vendor">Skincare vendor</option>
                    <option value="partner">Brand or partner</option>
                    <option value="press">Press / Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Subject *</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Vendor onboarding question"
                    required
                    className="w-full bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Message *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us what's on your mind…"
                    required
                    rows={5}
                    className="w-full bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-accent text-white py-3 rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>

          {/* Offices */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-light text-foreground mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Our offices</h2>
              <p className="text-sm text-muted-foreground">Drop in if you're in the area — we love meeting vendors in person.</p>
            </div>
            {offices.map((o) => (
              <div key={o.city} className="bg-card border border-border rounded-2xl overflow-hidden">
                <img src={o.photo} alt={o.city} className="w-full h-36 object-cover" />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{o.city}</h3>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{o.tag}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-accent" />
                    {o.address}
                  </p>
                </div>
              </div>
            ))}

            {/* Social links */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>Follow us</p>
              <div className="space-y-2">
                {[
                  { label: "Instagram", handle: "@anovra.africa" },
                  { label: "Twitter / X", handle: "@anovraHQ" },
                  { label: "LinkedIn", handle: "Anovra Africa" },
                  { label: "TikTok", handle: "@anovra.africa" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="text-accent font-medium">{s.handle}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>FAQ</p>
            <h2 className="text-3xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Common questions</h2>
          </div>
          <div className="max-w-3xl mx-auto divide-y divide-border border border-border rounded-2xl overflow-hidden">
            {faqs.map((f, i) => (
              <FAQItem key={i} question={f.q} answer={f.a} />
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Still have questions?{" "}
            <button onClick={() => {}} className="text-accent font-medium hover:underline">
              hello@anovra.africa
            </button>
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="bg-foreground rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #C86B3A 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <h2 className="text-3xl font-light text-primary-foreground mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
              Ready to get started?
            </h2>
            <p className="text-white/50 text-sm mb-8">No long forms. No waiting. Start your skin test or vendor account in minutes.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setView("skintest")}
                className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Take the skin test
              </button>
              <button
                onClick={() => setView("signup")}
                className="px-6 py-3 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/15 transition-colors border border-white/15"
              >
                Join as a vendor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

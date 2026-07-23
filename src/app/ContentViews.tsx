import { useState } from "react";
import { User, Store, Users, ShieldCheck, Mail, MessageSquare, CheckCircle, ChevronDown, ChevronUp, MapPin, AlertCircle, ExternalLink } from "lucide-react";
import type { View } from "./types";

// ---- ABOUT ----
export function AboutView({ setView }: { setView: (v: View) => void }) {
  const users = [
    {
      role: "Skin Care Customers",
      icon: User,
      tagline: "Know your skin. Find what actually works.",
      color: "bg-amber-50 border-amber-200",
      accentClass: "text-amber-700",
      dotColor: "bg-amber-500",
      photo: "/skin-analysis-feature.jpg",
      desc: "Millions of people in Africa spend money on skincare products that don't match their skin type, tone, or concern — often because there's no accessible, personalized guidance. Anovra changes that.",
      benefits: [
        "AI-powered skin test that analyzes your unique skin type, tone, and concerns",
        "Personalized product recommendations matched to your skin profile",
        "Results from vendors near you, in your budget",
        "Understand what each ingredient does and why it's recommended for you",
        "Scan product labels to check ingredient safety before you buy",
      ],
      cta: { label: "Take the free skin test", view: "skintest" as View },
      ctaSecondary: null,
    },
    {
      role: "Skincare Vendors",
      icon: Store,
      tagline: "Sell smarter. Reach the right customer every time.",
      color: "bg-orange-50 border-orange-200",
      accentClass: "text-orange-700",
      dotColor: "bg-accent",
      photo: "/vendor-dashboard-feature.jpg",
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
      icon: Users,
      tagline: "Grow the network. Earn on every vendor you bring in.",
      color: "bg-rose-50 border-rose-200",
      accentClass: "text-rose-700",
      dotColor: "bg-rose-500",
      photo: "/network-referrals-feature.jpg",
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
      icon: ShieldCheck,
      tagline: "Full visibility. Full control.",
      color: "bg-slate-50 border-slate-200",
      accentClass: "text-slate-700",
      dotColor: "bg-slate-500",
      photo: "/admin-control-feature.jpg",
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
    { year: "2025", title: "Idea born", body: "Founded by Shulammite Omosanya, out of frustration by how hard it was for African consumers to find skincare that actually worked for their skin tone and type." },
    { year: "Q4 2025", title: "Beta launch", body: "First 20 vendors onboarded across Abuja and Ibadan. Skin test engine goes live with 16 African skin concerns." },
    { year: "Q1 2026", title: "AI engine upgrade", body: "Recommendation engine expanded to 8 real-time signals. Ingredient safety layer launched to protect consumers from harmful formulations." },
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
          Every person in Africa deserves skincare advice as personalized as their skin.
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
            {users.map((u, i) => {
              const Icon = u.icon;
              return (
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
                      <Icon className="w-3.5 h-3.5" />
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
            );
          })}
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
      <section className="py-24 px-6 text-center bg-[#FAF7F2] border-t border-border/60">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#C86B3A] mb-4 font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>Ready to start?</p>
          <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-5" style={{ fontFamily: "'Fraunces', serif" }}>
            Find your place in the Anovra ecosystem
          </h2>
          <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
            Whether you have skin to care for, products to sell, or a network to grow — Anovra has a place for you.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setView("skintest")}
              className="px-6 py-3 bg-[#008236] hover:bg-[#006c2c] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              Take the skin test
            </button>
            <button
              onClick={() => setView("signup")}
              className="px-6 py-3 border-2 border-[#008236] text-[#008236] bg-transparent rounded-xl text-sm font-semibold hover:bg-[#008236]/5 transition-colors cursor-pointer"
            >
              Become a vendor
            </button>
            <button
              onClick={() => setView("teamlogin")}
              className="px-6 py-3 border-2 border-[#008236] text-[#008236] bg-transparent rounded-xl text-sm font-semibold hover:bg-[#008236]/5 transition-colors cursor-pointer"
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
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "general", label: "General" },
    { id: "skin", label: "Skin Analysis" },
    { id: "products", label: "Recommendations" },
    { id: "vendors", label: "For Vendors" },
    { id: "privacy", label: "Privacy & Security" },
    { id: "support", label: "Account & Support" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1200);
  }

  const channels = [
    {
      icon: Mail,
      label: "General enquiries",
      value: "hello@anovra.africa",
      sub: "We reply within 24 hours",
    },
    {
      icon: Store,
      label: "Vendor support",
      value: "vendors@anovra.africa",
      sub: "Onboarding, catalog & billing help",
    },
    {
      icon: ShieldCheck,
      label: "Admin & compliance",
      value: "admin@anovra.africa",
      sub: "Platform issues and safety reports",
    },
    {
      icon: MessageSquare,
      label: "WhatsApp business",
      value: "+2349167664619",
      sub: "Mon – Fri, 9am – 6pm WAT",
    },
  ];

  const offices = [
    {
      city: "Aba",
      address: "No 2 Ajiwe street, off brass road, Aba, Nigeria",
      tag: "Branch Office",
      photo: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=340&fit=crop&auto=format",
    },
    {
      city: "Abuja",
      address: "Former pack well, Lubge, FCT, Abuja, Nigeria.",
      tag: "Satellite Office",
      photo: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&h=340&fit=crop&auto=format",
    },
  ];

  const faqs = [
    // General
    {
      cat: "general",
      q: "What is Anovra?",
      a: "Anovra is Africa's skincare intelligence platform that helps people understand their skin through advanced image analysis and connects them with trusted skincare vendors offering personalized product recommendations."
    },
    {
      cat: "general",
      q: "How does Anovra work?",
      a: "Simply upload clear photos of your skin, and Anovra analyzes visible skin characteristics such as texture, pigmentation, dryness, oiliness, redness, pores, and blemishes. Based on the results, you'll receive a personalized skin report and product recommendations from trusted vendors."
    },
    {
      cat: "general",
      q: "Is Anovra a skincare brand?",
      a: "No. Anovra does not manufacture or sell skincare products. We provide a technology platform that helps users understand their skin and discover products from verified skincare vendors."
    },
    {
      cat: "general",
      q: "Is Anovra available across Africa?",
      a: "Anovra launches first in Nigeria, with plans to expand across other African countries."
    },
    // Skin Analysis
    {
      cat: "skin",
      q: "What skin concerns can Anovra identify?",
      a: "Anovra analyzes visible skin characteristics that may indicate concerns such as: Acne, Hyperpigmentation, Dark spots, Uneven skin tone, Melasma, Fine lines, Wrinkles, Dry skin, Oily skin, Combination skin, Sensitive skin, Enlarged pores, Redness, Dehydration, and Visible blemishes."
    },
    {
      cat: "skin",
      q: "Which parts of the body can I analyze?",
      a: "You can analyze any visible skin area, including: Face, Neck, Hands, Arms, Legs, Back, and other visible skin areas."
    },
    {
      cat: "skin",
      q: "Do I need a professional camera?",
      a: "No. A modern smartphone with a clear camera is enough. We also provide guidance to help you capture high-quality images for better analysis."
    },
    {
      cat: "skin",
      q: "Does Anovra diagnose skin diseases?",
      a: "No. Anovra provides an analysis of visible skin characteristics and personalized skincare recommendations. It is not a medical diagnostic tool and does not replace professional medical advice from a dermatologist."
    },
    // Product Recommendations
    {
      cat: "products",
      q: "How are products recommended?",
      a: "Recommendations are based on your visible skin characteristics and matched with products from trusted vendors on the platform. Anovra considers factors such as: Skin type, Skin concerns, Severity, Ingredients, Product compatibility, and Vendor availability."
    },
    {
      cat: "products",
      q: "Can I choose where I buy my products?",
      a: "Yes. You can browse products from multiple verified vendors and choose the one that best fits your preferences."
    },
    {
      cat: "products",
      q: "Can I share my skin report with a skincare vendor?",
      a: "Yes. You can send your skin analysis to a vendor for additional review before making a purchase, allowing you to receive even more personalized guidance."
    },
    // For Vendors
    {
      cat: "vendors",
      q: "Who can become a vendor?",
      a: "Anovra welcomes: Beauty stores, Cosmetic retailers, Organic skincare brands, Online skincare businesses, Beauty entrepreneurs, and Dermatology clinics."
    },
    {
      cat: "vendors",
      q: "How does Anovra help my business?",
      a: "Anovra helps vendors: Reduce consultation time, Personalize recommendations, Build customer trust, Increase conversions, Manage products digitally, Reach more customers, and Gain business insights through analytics."
    },
    {
      cat: "vendors",
      q: "Can I use Anovra with my existing website?",
      a: "Yes. Anovra provides an embeddable skin analysis widget that integrates directly into your website, allowing customers to complete their analysis without leaving your site."
    },
    {
      cat: "vendors",
      q: "Can customers receive recommendations only from my products?",
      a: "Yes. When customers use your unique Anovra link, recommendations are generated exclusively from products available in your Anovra Mini Shop."
    },
    {
      cat: "vendors",
      q: "What is an Anovra Mini Shop?",
      a: "Your Mini Shop is your personalized digital storefront inside Anovra, where you can showcase your products, manage inventory, update pricing, and receive customer orders."
    },
    // Privacy & Security
    {
      cat: "privacy",
      q: "Are my photos safe?",
      a: "Yes. Your uploaded images are securely processed and protected using industry-standard security practices. Your information is handled in accordance with our Privacy Policy."
    },
    {
      cat: "privacy",
      q: "Will my images be shared publicly?",
      a: "No. Your skin images are never publicly displayed and are only used to generate your personalized analysis unless you choose to share your report with a vendor."
    },
    {
      cat: "privacy",
      q: "Can I delete my account?",
      a: "Yes. You can request account deletion at any time, and your personal data will be handled according to our data retention and privacy policies."
    },
    // Account & Support
    {
      cat: "support",
      q: "Do I need to create an account?",
      a: "You can explore parts of Anovra without an account, but creating one allows you to save your analysis history, track your skincare journey, and access personalized recommendations."
    },
    {
      cat: "support",
      q: "How can I contact Anovra?",
      a: "You can reach our support team through the Contact Us page or email us directly at support@anovra.africa. We're here to help with any questions about the platform."
    },
    {
      cat: "support",
      q: "Is Anovra free to use?",
      a: "No. Anovra is a subscription-based platform designed to provide ongoing personalized skincare insights and recommendations. We offer flexible plans for both skincare consumers and skincare vendors, so you can choose the option that best suits your needs."
    },
    {
      cat: "support",
      q: "Can I upgrade or downgrade my plan?",
      a: "Yes. You can change your subscription at any time. Upgrades take effect immediately, while downgrades are applied at the start of your next billing cycle."
    },
    {
      cat: "support",
      q: "Can I cancel my subscription?",
      a: "Yes. You can cancel your subscription whenever you choose. Your access will remain active until the end of your current billing period."
    },
    {
      cat: "support",
      q: "Which plan is best for me?",
      a: "For users: Glow Pass is ideal for occasional skin check-ups. Glow Pass+ is perfect for users actively building a skincare routine and tracking progress. Premium Glow is designed for users who want expert guidance, family profiles, and premium benefits. For businesses: Basic is best for small skincare shops. Vendor Pro includes a 14-day free trial, allowing businesses to experience Anovra's advanced features before subscribing. Brand is built for established brands, clinics, and enterprises that require custom integrations and advanced team management."
    },
    {
      cat: "support",
      q: "What payment methods do you accept?",
      a: "Anovra accepts secure online payments through supported payment providers. Depending on your location, you can pay using debit cards, credit cards, bank transfers, and other supported payment methods."
    },
    {
      cat: "support",
      q: "Does Anovra replace a dermatologist?",
      a: "No. Anovra is a skincare intelligence platform that analyzes visible skin characteristics and provides personalized skincare recommendations. It is designed to support informed skincare decisions and does not replace professional medical diagnosis or treatment. If you have severe, persistent, or worsening skin conditions, you should consult a qualified healthcare professional."
    }
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
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-card border border-border rounded-2xl p-5 hover:border-accent/40 transition-colors">
                <Icon className="w-5 h-5 text-[#008236] mb-3" />
                <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                <p className="text-sm font-medium text-foreground mb-1">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.sub}</p>
              </div>
            );
          })}
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
                      placeholder="Team member"
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
            <h2 className="text-3xl font-light text-foreground mb-3" style={{ fontFamily: "'Fraunces', serif" }}>Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">Find answers to common questions about Anovra's skin analysis, recommendations, and vendor plans.</p>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-4xl mx-auto px-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-[#008236] text-white border-[#008236] shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="max-w-3xl mx-auto divide-y divide-border border border-border rounded-2xl overflow-hidden shadow-xs">
            {faqs
              .filter((f) => activeCategory === "all" || f.cat === activeCategory)
              .map((f, i) => (
                <FAQItem key={i} question={f.q} answer={f.a} />
              ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Still have questions?{" "}
            <a href="mailto:support@anovra.africa" className="text-accent font-semibold hover:underline">
              support@anovra.africa
            </a>
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

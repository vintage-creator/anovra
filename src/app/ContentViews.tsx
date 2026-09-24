import { useState } from "react";
import { User, Store, Users, ShieldCheck, Mail, MessageSquare, ChevronDown, ChevronUp, MapPin, AlertCircle, ExternalLink, ArrowRight, Search } from "lucide-react";
import type { View } from "./types";
import { SocialLinks } from "./SocialLinks";

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
      icon: Store,
      tagline: "Sell smarter. Reach the right customer every time.",
      color: "bg-orange-50 border-orange-200",
      accentClass: "text-orange-700",
      dotColor: "bg-accent",
      photo: "/vendor-dashboard-feature.jpg",
      desc: "Whether you run a single shop or a growing brand, Anovra gives you a complete digital storefront, AI-powered product matching, and real data on what your customers need — so every recommendation feels personal.",
      benefits: [
        "Your own branded skin test page — share your link and let Anovra do the selling",
        "Add your full product catalogue with ingredients, benefits, and safety checks",
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
export function ContactView({ setView, faqOnly = false }: { setView: (v: View) => void; faqOnly?: boolean }) {
  const [form, setForm] = useState({ name: "", email: "", role: "", subject: "", message: "" });
  const [composeOpened, setComposeOpened] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");
  const [faqQuery, setFaqQuery] = useState("");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const categories = [
    { id: "general", label: "General" },
    { id: "skin", label: "Skin Analysis" },
    { id: "products", label: "Recommendations" },
    { id: "vendors", label: "For Vendors" },
    { id: "brands", label: "For Brands" },
    { id: "privacy", label: "Privacy & Security" },
    { id: "support", label: "Account & Support" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const recipient = form.role === "vendor" ? "vendors@anovra.africa" : "hello@anovra.africa";
    const subject = encodeURIComponent(form.subject.trim().slice(0, 120));
    const body = encodeURIComponent(`${form.message.trim()}\n\nFrom: ${form.name.trim()}\nEmail: ${form.email.trim()}\nEnquiry type: ${form.role || "General"}`);
    setComposeOpened(true);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  }

  const channels = [
    {
      icon: Mail,
      label: "General enquiries",
      value: "hello@anovra.africa",
      href: "mailto:hello@anovra.africa",
      sub: "Questions and partnerships",
    },
    {
      icon: Store,
      label: "Vendor support",
      value: "vendors@anovra.africa",
      href: "mailto:vendors@anovra.africa",
      sub: "Onboarding, catalogue & billing help",
    },
    {
      icon: ShieldCheck,
      label: "Admin & compliance",
      value: "admin@anovra.africa",
      href: "mailto:admin@anovra.africa",
      sub: "Platform issues and safety reports",
    },
    {
      icon: MessageSquare,
      label: "WhatsApp business",
      value: "+2349167664619",
      href: "https://wa.me/2349167664619",
      sub: "Mon – Fri, 9am – 6pm WAT",
    },
  ];

  const faqs = [
    // General
    {
      cat: "general",
      q: "What is Anovra?",
      a: "Anovra is Africa's skincare intelligence platform that helps people understand their skin through advanced image analysis and connects them with trusted skincare vendors offering personalised product recommendations."
    },
    {
      cat: "general",
      q: "How does Anovra work?",
      a: "Simply upload clear photos of your skin, and Anovra analyses visible skin characteristics such as texture, pigmentation, dryness, oiliness, redness, pores, and blemishes. Based on the results, you'll receive a personalised skin report and product recommendations from trusted vendors."
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
      a: "Anovra analyses visible skin characteristics that may indicate concerns such as: Acne, Hyperpigmentation, Dark spots, Uneven skin tone, Melasma, Fine lines, Wrinkles, Dry skin, Oily skin, Combination skin, Sensitive skin, Enlarged pores, Redness, Dehydration, and Visible blemishes."
    },
    {
      cat: "skin",
      q: "Which parts of the body can I analyse?",
      a: "You can analyse any visible skin area, including: Face, Neck, Hands, Arms, Legs, Back, and other visible skin areas."
    },
    {
      cat: "skin",
      q: "Do I need a professional camera?",
      a: "No. A modern smartphone with a clear camera is enough. We also provide guidance to help you capture high-quality images for better analysis."
    },
    {
      cat: "skin",
      q: "Does Anovra diagnose skin diseases?",
      a: "No. Anovra provides an analysis of visible skin characteristics and personalised skincare recommendations. It is not a medical diagnostic tool and does not replace professional medical advice from a dermatologist."
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
      a: "Yes. You can send your skin analysis to a vendor for additional review before making a purchase, allowing you to receive even more personalised guidance."
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
      a: "Anovra helps vendors reduce consultation time, personalise recommendations, manage their catalogue, and understand customer activity through analytics."
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
      a: "Your Mini Shop is your personalised digital storefront inside Anovra, where you can showcase your products, manage inventory, update pricing, and receive customer orders."
    },
    // Brand HQ
    {
      cat: "brands",
      q: "Who should register a Brand HQ account?",
      a: "Brand HQ is designed for established skincare brands and distributors managing multiple branches, outlets, or regional teams. An independent shop can start with a vendor account."
    },
    {
      cat: "brands",
      q: "Can I create and manage branch accounts?",
      a: "Yes. Brand HQ can create branch vendor accounts, update their details, and activate, deactivate, or suspend branch access from one workspace."
    },
    {
      cat: "brands",
      q: "Does each branch get its own storefront and skin test link?",
      a: "Yes. Each branch has its own vendor sign-in, storefront, skin test link, and product catalogue under your brand network."
    },
    {
      cat: "brands",
      q: "Can Brand HQ add products for a branch?",
      a: "Yes. Choose an active branch when adding a product from Brand HQ, or let the branch add products from its vendor workspace. New products go through Anovra safety review before appearing publicly."
    },
    {
      cat: "brands",
      q: "How do I compare branch performance?",
      a: "Brand HQ brings branch products, scans, sales records, and activity into one view. Open a branch to inspect its own catalogue and performance in more detail."
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
      a: "No. Your skin images are never publicly displayed and are only used to generate your personalised analysis unless you choose to share your report with a vendor."
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
      a: "You can explore parts of Anovra without an account, but creating one allows you to save your analysis history, track your skincare journey, and access personalised recommendations."
    },
    {
      cat: "support",
      q: "How can I contact Anovra?",
      a: "You can reach our support team through the Contact Us page or email us directly at support@anovra.africa. We're here to help with any questions about the platform."
    },
    {
      cat: "support",
      q: "Is Anovra free to use?",
      a: "New accounts can try premium features for seven days. A free tier remains available afterwards, while paid plans unlock additional customer and business tools."
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
      a: "For users: Glow Pass is ideal for occasional skin check-ups. Glow Pass+ suits users building a skincare routine and tracking progress. Premium Glow offers deeper guidance, family profiles, and partner benefits. For businesses: Basic suits small skincare shops. Vendor Pro adds unlimited tests, a larger catalogue, and analytics. Premium Tier adds API access, a custom domain, and onboarding. Every new account starts with a 7-day trial."
    },
    {
      cat: "support",
      q: "What payment methods do you accept?",
      a: "Anovra accepts secure online payments through supported payment providers. Depending on your location, you can pay using debit cards, credit cards, bank transfers, and other supported payment methods."
    },
    {
      cat: "support",
      q: "Does Anovra replace a dermatologist?",
      a: "No. Anovra is a skincare intelligence platform that analyses visible skin characteristics and provides personalised skincare recommendations. It is designed to support informed skincare decisions and does not replace professional medical diagnosis or treatment. If you have severe, persistent, or worsening skin conditions, you should consult a qualified healthcare professional."
    }
  ];

  if (faqOnly) {
    const query = faqQuery.trim().toLowerCase();
    const visibleFaqs = faqs.filter((faq) =>
      query
        ? `${faq.q} ${faq.a}`.toLowerCase().includes(query)
        : faq.cat === activeCategory
    );

    return (
      <div className="min-h-screen bg-background px-5 py-12 sm:py-16" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase text-[#008236]">FAQs</p>
            <h1 className="mb-3 text-3xl font-semibold text-foreground sm:text-4xl" style={{ fontFamily: "'Fraunces', serif" }}>How can we help?</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">Browse answers by topic or search for what you need.</p>
          </div>
          <label className="relative mb-8 block max-w-2xl">
            <Search aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">Search frequently asked questions</span>
            <input
              type="search"
              value={faqQuery}
              onChange={(event) => { setFaqQuery(event.target.value); setOpenQuestion(null); }}
              placeholder="Search questions and answers"
              className="w-full rounded-md border border-border bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-[#008236] focus:ring-2 focus:ring-[#008236]/15"
            />
          </label>
          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
            <div className="lg:hidden">
              <label htmlFor="faq-topic" className="mb-2 block text-xs font-semibold text-muted-foreground">Topic</label>
              <select
                id="faq-topic"
                value={activeCategory}
                onChange={(event) => { setActiveCategory(event.target.value); setFaqQuery(""); setOpenQuestion(null); }}
                className="w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-foreground outline-none focus:border-[#008236]"
              >
                {categories.map((category) => <option key={category.id} value={category.id}>{category.label} ({faqs.filter((faq) => faq.cat === category.id).length})</option>)}
              </select>
            </div>
            <nav aria-label="FAQ topics" className="hidden gap-2 lg:flex lg:flex-col">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => { setActiveCategory(category.id); setFaqQuery(""); setOpenQuestion(null); }}
                  aria-current={!query && activeCategory === category.id ? "page" : undefined}
                  className={`flex shrink-0 items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${!query && activeCategory === category.id ? "bg-[#008236] font-semibold text-white" : "text-foreground hover:bg-secondary"}`}
                >
                  <span>{category.label}</span>
                  <span className={`text-xs ${!query && activeCategory === category.id ? "text-white/80" : "text-muted-foreground"}`}>{faqs.filter((faq) => faq.cat === category.id).length}</span>
                </button>
              ))}
            </nav>
            <main className="min-w-0">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  {query ? "Search results" : categories.find((category) => category.id === activeCategory)?.label}
                </h2>
                <span className="text-xs text-muted-foreground">{visibleFaqs.length} {visibleFaqs.length === 1 ? "question" : "questions"}</span>
              </div>
              {visibleFaqs.length ? (
                <div className="divide-y divide-border rounded-md border border-border bg-white">
                  {visibleFaqs.map((faq) => (
                    <FAQItem
                      key={faq.q}
                      question={faq.q}
                      answer={faq.a}
                      open={openQuestion === faq.q}
                      onToggle={() => setOpenQuestion(openQuestion === faq.q ? null : faq.q)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-border bg-white p-8 text-center text-sm text-muted-foreground">No matching questions. Try another search or contact us directly.</div>
              )}
              {!query && activeCategory === "brands" && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-[#008236]/20 bg-[#f5f8f5] p-5">
                  <p className="text-sm text-foreground">Ready to set up your brand network?</p>
                  <button onClick={() => setView("brandsignup")} className="inline-flex items-center gap-2 text-sm font-semibold text-[#008236] hover:underline">Register Brand HQ <ArrowRight className="h-4 w-4" /></button>
                </div>
              )}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">Still need help? Our team can assist.</p>
                <button onClick={() => setView("contact")} className="inline-flex items-center gap-2 text-sm font-semibold text-[#008236] hover:underline">Contact Anovra <ArrowRight className="h-4 w-4" /></button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero */}
      <section className="border-b border-border bg-[#f5f8f5] px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-xs font-bold uppercase text-[#008236]">Contact Anovra</p>
          <h1 className="mb-4 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-5xl" style={{ fontFamily: "'Fraunces', serif" }}>Let’s talk about what you need.</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Questions about your account, a product, or working with Anovra? Choose a direct channel or prepare a message below.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16 space-y-16">

        {/* Contact channels */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <a key={c.label} href={c.href} className="group block min-w-0 rounded-md border border-border bg-card p-5 transition-colors hover:border-[#008236]/50 hover:bg-[#f5f8f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008236]">
                <Icon className="w-5 h-5 text-[#008236] mb-3" />
                <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                <p className="break-words text-sm font-semibold text-foreground mb-1 group-hover:text-[#008236]">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.sub}</p>
              </a>
            );
          })}
        </div>

        {/* Message form and headquarters */}
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-light text-foreground mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
              Send us a message
            </h2>
            <p className="text-sm text-muted-foreground mb-8">We’ll prepare your message in your email app. Review it there, then press Send.</p>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Full name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Team member"
                      required
                      maxLength={100}
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
                      maxLength={254}
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
                    maxLength={120}
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
                    maxLength={4000}
                    rows={5}
                    className="w-full bg-card border border-border rounded-lg px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#008236] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006c2c]"
                >
                  Open email app <ArrowRight className="h-4 w-4" />
                </button>
                {composeOpened && <p role="status" className="text-sm text-muted-foreground">Your email app should open with this message. It has not been sent until you press Send there.</p>}
              </form>
          </div>

          {/* Headquarters and social channels */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-md border border-border bg-[#f5f8f5] p-6">
              <MapPin className="mb-4 h-5 w-5 text-[#008236]" />
              <h2 className="mb-1 text-lg font-semibold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Headquarters</h2>
              <p className="text-sm text-muted-foreground">Abuja, Nigeria</p>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Please contact our team before arranging an in-person visit.</p>
            </div>

            {/* Social links */}
            <div className="rounded-md border border-border bg-card p-6">
              <p className="mb-4 text-sm font-semibold text-foreground">Follow Anovra</p>
              <div className="text-[#008236]"><SocialLinks /></div>
            </div>
          </div>
        </div>

        <section className="grid gap-6 border-t border-border pt-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-[#008236]">FAQs</p>
            <h2 className="mb-2 text-2xl font-semibold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Find an answer, faster.</h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">Explore questions about skin analysis, product matching, accounts, privacy, vendor tools, and Brand HQ by topic.</p>
          </div>
          <button onClick={() => setView("faq")} className="inline-flex items-center justify-center gap-2 rounded-md border border-[#008236] px-5 py-3 text-sm font-semibold text-[#008236] transition-colors hover:bg-[#008236]/5">
            Browse FAQs <ArrowRight className="h-4 w-4" />
          </button>
        </section>

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

export function FAQItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-card">
      <button
        onClick={onToggle}
        aria-expanded={open}
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

export function FAQView({ setView }: { setView: (v: View) => void }) {
  return <ContactView setView={setView} faqOnly />;
}

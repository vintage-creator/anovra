import { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  FileText,
  AlertTriangle,
  Scale,
  TestTube,
  Eye,
  Trash2,
  CheckCircle2,
  Search,
  ArrowRight,
  Mail,
  ChevronRight,
  ExternalLink,
  BookOpen,
  UserCheck,
  Building2,
  RefreshCw,
  Info
} from "lucide-react";
import { type View, cn } from "./types";

interface LegalSection {
  id: string;
  number: string;
  title: string;
  plainEnglish: string;
  content: React.ReactNode;
}

export function TermsView({ setView }: { setView: (v: View) => void }) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `${window.location.pathname}#/terms#${id}`);
    }
  };

  useEffect(() => {
    const rawHash = window.location.hash;
    const match = rawHash.match(/#([a-z0-9-]+)$/i);
    const targetId = match ? match[1] : null;
    if (targetId && targetId !== "terms" && targetId !== "privacy") {
      setActiveSectionId(targetId);
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, []);

  const sections: LegalSection[] = [
    {
      id: "acceptance",
      number: "01",
      title: "Acceptance of Terms & Platform Scope",
      plainEnglish: "By using Anovra, you agree to these legal terms. Anovra is a skincare technology platform connecting consumers, brands, and vendors.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Welcome to Anovra (<strong className="text-foreground">“Anovra,” “we,” “us,” or “our”</strong>), operated by Anovra Africa Ltd. These Terms of Service (<strong className="text-foreground">“Terms”</strong>) govern your access to and use of our web application, AI-powered skin analysis tools, multi-vendor marketplace, and associated digital services available at <span className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">anovra.africa</span> and its subdomains.
          </p>
          <p>
            By accessing our platform, creating an account (Individual, Vendor, or Brand HQ), uploading an image for skin analysis, or purchasing products, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to all provisions contained herein, you must immediately discontinue your use of Anovra.
          </p>
          <p>
            Anovra reserves the right to modify or update these Terms at any time. When material updates occur, we will notify registered users via email or system banner notification. Your continued use of the platform after the effective date of revisions constitutes acceptance of the modified Terms.
          </p>
        </div>
      ),
    },
    {
      id: "medical-disclaimer",
      number: "02",
      title: "Non-Medical Cosmetic Disclaimer",
      plainEnglish: "Anovra's AI skin scan is an educational cosmetic guide, NOT a medical diagnosis or prescription. Always patch-test and consult a dermatologist for medical conditions.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
            <strong className="font-semibold block mb-1">Important Notice:</strong>
            Anovra does NOT provide medical advice, clinical dermatology services, or disease diagnosis. All reports, skin concern scores, and product matches are purely cosmetic and informational recommendations.
          </div>
          <p>
            Our artificial intelligence and computer vision algorithms assess visual indicators of skin attributes—including hydration levels, pore visibility, tone evenness, and surface oiliness—calibrated for African skin tones. These metrics represent automated approximations and cannot diagnose dermatological diseases (such as melanoma, severe eczema, psoriasis, or systemic conditions).
          </p>
          <p>
            You should never disregard certified professional medical advice or delay seeking medical attention due to recommendations received from Anovra. Before adopting any new cosmetic product, users are strongly advised to perform a 24-hour patch test behind the ear or on the inner forearm to test for individual allergic sensitivities.
          </p>
        </div>
      ),
    },
    {
      id: "eligibility",
      number: "03",
      title: "Account Eligibility & Security",
      plainEnglish: "You must be at least 16 years old to create an account. You are responsible for keeping your login credentials confidential and safe.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            To use Anovra or register an account, you must be at least 16 years of age (or the age of legal majority in your jurisdiction). By registering, you confirm that all information provided during signup—such as full name, email address, and phone number—is true, complete, and accurate.
          </p>
          <p>
            You are exclusively responsible for safeguarding your account credentials, passwords, and one-time verification links. Any actions conducted under your authenticated session will be attributed to you. If you suspect unauthorized access or compromise of your account, you must contact our security team immediately at <a href="mailto:security@anovra.africa" className="text-[#008236] underline">security@anovra.africa</a>.
          </p>
        </div>
      ),
    },
    {
      id: "facial-data",
      number: "04",
      title: "Facial Scans, User Photos & AI Processing",
      plainEnglish: "Your selfie is processed securely to generate your cosmetic report. We never publish your photos publicly and never sell your facial data.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            To utilize our AI skin test, you may capture or upload a frontal facial photograph. By submitting your photograph, you grant Anovra a limited, non-exclusive, revocable license strictly to transmit, analyze, and process the photograph for the sole purpose of generating your personal skin analysis report and matched product recommendations.
          </p>
          <p>
            <strong className="text-foreground">Our strict commitments:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Your facial photographs are private-by-default and are never showcased in public galleries, marketing materials, or vendor storefronts without explicit written authorization.</li>
            <li>We do not sell, license, or broker facial biometric data to third-party ad networks, data brokers, or external entities.</li>
            <li>You may delete your skin scan photos and stored analysis results at any time through your dashboard or by contacting data privacy support.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "vendor-rules",
      number: "05",
      title: "Vendor Purity Standards & Regulatory Compliance (NAFDAC)",
      plainEnglish: "Vendors must pass CAC verification. Banned, toxic, or hazardous bleaching agents (e.g. mercury, high-dose hydroquinone, steroids) are strictly prohibited.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Skincare vendors and Brand HQ accounts operating on Anovra must meet our rigorous safety, authenticity, and legal criteria. All vendor accounts undergo Corporate Affairs Commission (CAC) verification and identity checks before listing authorization is finalized.
          </p>
          <p>
            <strong className="text-foreground">Prohibited Formulations & Zero-Tolerance Policy:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              All listed products must comply with statutory guidelines issued by the National Agency for Food and Drug Administration and Control (NAFDAC) or equivalent regulatory bodies in the operating jurisdiction.
            </li>
            <li>
              Products containing prohibited or hazardous substances—including, but not limited to, unapproved high-concentration hydroquinone (&gt;2% without prescription), topical corticosteroids (clobetasol, betamethasone), mercury, lead, or toxic caustic bleaching formulations—are unconditionally barred.
            </li>
            <li>
              Vendors must accurately disclose complete ingredient lists (INCI format) for all catalog items. Misrepresentation of ingredients or omission of active compounds constitutes grounds for immediate account suspension, permanent removal, and notification to relevant regulatory authorities.
            </li>
            <li>
              Marketing claims must center on skin tone evenness, barrier repair, and cosmetic glow. Medical disease cure claims or discriminatory colorist marketing are strictly prohibited on Anovra storefronts.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "marketplace-orders",
      number: "06",
      title: "Marketplace Transactions & Vendor Fulfillment",
      plainEnglish: "Products ordered on vendor storefronts are fulfilled directly by the independent vendor. Anovra provides the platform, AI matchmaking, and safety verification layer.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Anovra operates as a curated technology marketplace. When you purchase products through a vendor storefront, the contract of sale is formed directly between you and the respective verified vendor. The vendor is responsible for order packaging, accurate inventory management, courier dispatch, and delivery.
          </p>
          <p>
            While Anovra reviews vendor credibility, product ingredients, and customer feedback, vendors are independent merchants. If you experience order fulfillment delays or receive damaged items, vendors are obligated to provide resolution within their stated delivery timelines. Anovra Customer Care assists in mediating disputes when vendor communication fails.
          </p>
        </div>
      ),
    },
    {
      id: "subscriptions",
      number: "07",
      title: "Vendor Subscriptions, Payouts & Fees",
      plainEnglish: "Vendor SaaS tiers (Free, Basic, Premium) are billed through licensed gateways (Paystack/Flutterwave). Subscription terms and cancellation policies are transparent.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Vendors and brands may subscribe to premium platform tiers to unlock advanced features, including branded skin test widgets, multi-branch Brand HQ analytics, custom domains, and elevated catalog quotas.
          </p>
          <p>
            Subscription payments are securely processed through regulated financial payment gateways (Paystack and Flutterwave). Subscriptions renew automatically at the end of each billing cycle unless cancelled prior to renewal through the Vendor Dashboard. Fees are non-refundable for partially used billing periods, except where required by applicable consumer law.
          </p>
        </div>
      ),
    },
    {
      id: "intellectual-property",
      number: "08",
      title: "Intellectual Property & Platform Rights",
      plainEnglish: "Anovra owns its software, algorithms, trademarks, and design. Vendors retain ownership of their brand trademarks and product photographs.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            The Anovra technology stack, user interfaces, proprietary AI recommendation algorithms, graphics, brand marks, and documentation are the exclusive intellectual property of Anovra Africa Ltd and are protected under international copyright, trademark, and intellectual property statutes.
          </p>
          <p>
            Vendors retain full ownership of their proprietary brand names, logos, and original product photographs uploaded to their catalog. By uploading content, vendors grant Anovra a worldwide, non-exclusive license to display, host, and index this content strictly to operate the storefront and recommendation services.
          </p>
        </div>
      ),
    },
    {
      id: "prohibited-conduct",
      number: "09",
      title: "Prohibited Platform Conduct",
      plainEnglish: "You may not scrape, hack, reverse-engineer our AI, harvest user information, or publish fraudulent product reviews.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>You agree not to engage in any of the following unauthorized activities:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Reverse engineering, decompiling, or attempting to extract proprietary machine learning weights or algorithms from our skin analysis engine.</li>
            <li>Using automated crawlers, bots, or scrapers to extract vendor listings, customer records, or pricing models without explicit API consent.</li>
            <li>Uploading falsified CAC verification documents, forged manufacturer certificates, or counterfeit product listings.</li>
            <li>Submitting false or malicious product reviews or manipulating skin scan scores.</li>
            <li>Transmitting malicious software, viruses, or code intended to compromise server infrastructure or user accounts.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "liability",
      number: "10",
      title: "Limitation of Liability & Indemnification",
      plainEnglish: "Anovra is provided 'as is'. To the extent permitted by law, Anovra is not liable for indirect damages or adverse skin reactions to third-party vendor products.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            To the maximum extent permitted by applicable law, Anovra, its directors, employees, and affiliates shall not be liable for any direct, indirect, incidental, punitive, or consequential damages arising from: (a) your use of or inability to use the platform; (b) allergic reactions or adverse skin responses resulting from products purchased through third-party vendors; or (c) unauthorized access to or alteration of your transmissions or data.
          </p>
          <p>
            You agree to defend, indemnify, and hold harmless Anovra Africa Ltd from and against any claims, liabilities, damages, and expenses (including legal fees) arising out of your breach of these Terms or violation of any regulatory standard or third-party right.
          </p>
        </div>
      ),
    },
    {
      id: "governing-law",
      number: "11",
      title: "Governing Law & Dispute Resolution",
      plainEnglish: "These Terms are governed by Nigerian law. Any unresolved legal disputes will be settled via mediation or arbitration in Abuja/Lagos.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            These Terms of Service and any contractual disputes shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to conflict of law principles.
          </p>
          <p>
            In the event of any controversy or dispute, the parties agree to first attempt resolution through good-faith amicable negotiation for a minimum period of thirty (30) days. If unresolved, the dispute shall be referred to and finally resolved by arbitration in Abuja, Nigeria, administered under the Arbitration and Mediation Act.
          </p>
        </div>
      ),
    },
    {
      id: "legal-inquiries",
      number: "12",
      title: "Questions & Legal Inquiries",
      plainEnglish: "Reach out to our legal and compliance desk for any questions or formal notices.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            If you have questions regarding these Terms of Service or need to serve formal legal notices, please contact us:
          </p>
          <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 text-xs sm:text-sm">
            <p><strong className="text-foreground">Anovra Africa Ltd</strong> (Compliance & Legal Operations)</p>
            <p>Email: <a href="mailto:legal@anovra.africa" className="text-[#008236] underline">legal@anovra.africa</a></p>
            <p>Customer Support: <a href="mailto:hello@anovra.africa" className="text-[#008236] underline">hello@anovra.africa</a></p>
            <p>Headquarters: Abuja, Federal Capital Territory, Nigeria</p>
            <p>Phone: +234 916 766 4619</p>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.plainEnglish.toLowerCase().includes(query) ||
        s.number.includes(query)
    );
  }, [searchQuery, sections]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Header */}
      <div className="border-b border-border/80 bg-gradient-to-b from-[#f5f8f5] to-background pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008236]/10 text-[#008236] text-xs font-semibold">
                <Scale className="w-3.5 h-3.5" />
                <span>Legal & Governance</span>
              </div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Terms of Service
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Clear, transparent, and fair rules governing your use of Anovra&apos;s skin analysis platform, marketplace, and vendor network.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span>Effective Date: October 1, 2026</span>
                <span>•</span>
                <span>Version 2.4</span>
                <span>•</span>
                <span className="text-[#008236] font-medium">NDPR & NAFDAC Aligned</span>
              </div>
            </div>

            {/* Quick Actions & Navigation Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs">
                <button
                  onClick={() => {
                    setActiveTab("terms");
                  }}
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#008236] text-white transition-all shadow-xs"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => {
                    setView("privacy");
                  }}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>

          {/* Search bar inside terms */}
          <div className="mt-8 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search terms, keywords (e.g. photo, NAFDAC, refunds)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-card placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[#008236]/30 focus:border-[#008236] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {/* At-a-Glance Plain English Highlights */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[#008236]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#008236]">
              At a Glance: In Plain English
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-2 shadow-xs hover:border-[#008236]/30 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#008236] flex items-center justify-center font-bold">
                <TestTube className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Cosmetic, Not Clinical</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our AI test gives personalized cosmetic guidance. It is not medical advice or a disease diagnosis.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-2 shadow-xs hover:border-[#008236]/30 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#008236] flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Zero Harmful Bleaches</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vendors must pass CAC verification. Toxic chemicals (mercury, steroid cocktails, dangerous hydroquinone) are permanently banned.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-2 shadow-xs hover:border-[#008236]/30 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#008236] flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Private-by-Default</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your selfie is analyzed solely to generate your skin routine. We never publish or sell your facial photos.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-2 shadow-xs hover:border-[#008236]/30 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#008236] flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Fair & Transparent</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clear vendor fulfillment terms, secure Paystack/Flutterwave billing, and standard Nigerian commercial protections.
              </p>
            </div>
          </div>
        </div>

        {/* Content Layout: Sticky TOC + Section Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Table of Contents */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#008236]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Table of Contents
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {sections.length} Clauses
                </span>
              </div>
              <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer",
                      activeSectionId === s.id
                        ? "bg-[#008236]/10 text-[#008236] font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground/70 w-5">
                      {s.number}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-3 border-t border-border">
                <button
                  onClick={() => setView("privacy")}
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium text-[#008236] hover:bg-[#008236]/10 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Read Privacy Policy</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* Right Detailed Sections */}
          <main className="lg:col-span-8 space-y-8">
            {filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-border p-12 text-center space-y-3">
                <Info className="w-8 h-8 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-foreground text-sm">No clauses matched your query</h3>
                <p className="text-xs text-muted-foreground">
                  Try searching for keywords like &quot;refund&quot;, &quot;photo&quot;, &quot;NAFDAC&quot;, or &quot;CAC&quot;.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-semibold text-[#008236] underline"
                >
                  Reset search
                </button>
              </div>
            ) : (
              filteredSections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#008236] bg-[#008236]/10 px-2.5 py-1 rounded-md">
                      {section.number}
                    </span>
                    <h2
                      className="text-lg sm:text-xl font-semibold text-foreground tracking-tight"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      {section.title}
                    </h2>
                  </div>

                  {/* Plain English Summary Callout */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 sm:p-4 text-xs sm:text-sm text-foreground flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#008236] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-[#008236] block mb-0.5">
                        Key Takeaway:
                      </strong>
                      <span className="text-muted-foreground">{section.plainEnglish}</span>
                    </div>
                  </div>

                  {/* Formal Legal Content */}
                  <div className="pt-2">{section.content}</div>
                </article>
              ))
            )}

            {/* Bottom Support & Return Actions */}
            <div className="rounded-2xl border border-border bg-[#f5f8f5] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Have questions about our terms?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Our compliance and legal team is ready to assist you.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setView("contact")}
                  className="px-4 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Contact Support
                </button>
                <button
                  onClick={() => setView("signup")}
                  className="px-4 py-2 rounded-lg bg-[#008236] hover:bg-[#006c2c] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function PrivacyView({ setView }: { setView: (v: View) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `${window.location.pathname}#/privacy#${id}`);
    }
  };

  useEffect(() => {
    const rawHash = window.location.hash;
    const match = rawHash.match(/#([a-z0-9-]+)$/i);
    const targetId = match ? match[1] : null;
    if (targetId && targetId !== "terms" && targetId !== "privacy") {
      setActiveSectionId(targetId);
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, []);

  const sections: LegalSection[] = [
    {
      id: "overview",
      number: "01",
      title: "Privacy Commitment & Data Controller",
      plainEnglish: "We respect your personal privacy. Anovra complies with the Nigeria Data Protection Act (NDPA), NDPR, and global data privacy standards.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Anovra Africa Ltd (<strong className="text-foreground">“Anovra,” “we,” “us,” or “our”</strong>) is dedicated to protecting the privacy, confidentiality, and security of individuals using our AI skin testing engine, product marketplace, and vendor management services.
          </p>
          <p>
            This Privacy Policy explains how we collect, store, process, protect, and delete your personal data in accordance with the Nigeria Data Protection Act (NDPA 2023), Nigeria Data Protection Regulation (NDPR), and universally accepted privacy benchmarks. Anovra Africa Ltd is the designated Data Controller responsible for personal data processed through our platform.
          </p>
        </div>
      ),
    },
    {
      id: "data-we-collect",
      number: "02",
      title: "Categories of Information We Collect",
      plainEnglish: "We collect your contact info, optional facial scan photos, answers to skin quizzes, and vendor verification documents.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>We collect and process the following categories of data:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-foreground">Account & Identity Information:</strong> Full name, email address, telephone number, password hashes, and shipping addresses.
            </li>
            <li>
              <strong className="text-foreground">Facial Images & Skin Metrics:</strong> Frontal facial photographs captured or uploaded for AI skin analysis; computer vision extraction metrics (e.g. skin tone melanin classification, pore dilation, hydration index, surface texture).
            </li>
            <li>
              <strong className="text-foreground">Skin Profile & Lifestyle Attributes:</strong> Self-reported questionnaire answers, primary skin concerns (hyperpigmentation, acne, barrier weakness, dryness), age bracket, sunscreen usage, and budget preference.
            </li>
            <li>
              <strong className="text-foreground">Vendor & Brand Business Records:</strong> Business registration names, Corporate Affairs Commission (CAC) verification documents, shop descriptions, product inventory lists, and bank account details for payout processing.
            </li>
            <li>
              <strong className="text-foreground">Technical & Usage Logs:</strong> IP address, device model, operating system, browser user agent, referral source, session timestamps, and diagnostic error logs.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "facial-images",
      number: "03",
      title: "Facial Scan Photos & Biometric Handling",
      plainEnglish: "Your facial image is private-by-default, encrypted, used solely for cosmetic analysis, and NEVER sold or rented to third-party advertisers.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs sm:text-sm text-foreground">
            <strong className="font-semibold text-[#008236] block mb-1">Our Core Facial Privacy Guarantee:</strong>
            We treat facial images with the highest confidentiality. Your uploaded photographs are analyzed in real time to generate your personalized skincare recommendations and are NEVER used for commercial surveillance, facial recognition law enforcement databases, or sold to advertising brokers.
          </div>
          <p>
            When you complete an AI skin scan:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-foreground">Explicit Consent:</strong> Facial capture is completely optional. You may skip photo analysis at any time and receive recommendations based solely on manual questionnaire inputs.
            </li>
            <li>
              <strong className="text-foreground">No Public Exposure:</strong> Your photographs are never displayed in public directories, community feeds, or vendor catalogs without explicit prior written authorization.
            </li>
            <li>
              <strong className="text-foreground">Zero Third-Party Commercial Sale:</strong> We never sell, rent, or trade your facial photos or biometric feature maps.
            </li>
            <li>
              <strong className="text-foreground">Vendor Isolation:</strong> Independent marketplace vendors only receive your order items and delivery coordinates—they never receive access to your raw skin scan photos.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "how-we-use-data",
      number: "04",
      title: "How We Use Your Information",
      plainEnglish: "We use your data to generate accurate skincare routines, fulfill orders, protect platform safety, and provide customer support.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>We process your personal information for specific, lawful purposes:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To generate personalized cosmetic skin scores and routine recommendations calibrated for African skin tones.</li>
            <li>To match your skin concerns with verified vendor products that avoid flagged or irritating ingredients.</li>
            <li>To authenticate your identity, prevent fraud, and conduct CAC verification on business merchants.</li>
            <li>To process secure payments and subscription invoicing via regulated gateways (Paystack/Flutterwave).</li>
            <li>To provide timely customer assistance, troubleshoot technical inquiries, and notify you of critical security alerts.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "data-security",
      number: "05",
      title: "Data Security & Storage Architecture",
      plainEnglish: "We protect your data with TLS 1.3 encryption in transit, AES-256 encryption at rest, and strict role-based access control.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Anovra applies multi-layered enterprise security controls to defend user records against unauthorized access, loss, or manipulation:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-foreground">Encryption in Transit:</strong> All HTTP traffic and API communications are enforced with modern TLS 1.3 protocol encryption.</li>
            <li><strong className="text-foreground">Encryption at Rest:</strong> Database records and cloud storage buckets use industry-standard AES-256 encryption.</li>
            <li><strong className="text-foreground">Strict Access Controls:</strong> Only authorized technical personnel bound by strict non-disclosure obligations have role-governed access to production databases.</li>
            <li><strong className="text-foreground">Automated Session Protections:</strong> Inactive sessions automatically expire after 30 minutes to shield against unauthorized access on shared devices.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "data-retention",
      number: "06",
      title: "Data Retention & One-Click Deletion",
      plainEnglish: "You have complete control over your data. You can delete your skin scan photos or your entire account whenever you choose.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            We retain personal information only for the duration necessary to deliver the services requested or satisfy statutory accounting and regulatory requirements.
          </p>
          <p>
            <strong className="text-foreground">Right to Erasure & Deletion:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You may clear your active skin scan data from your account through your dashboard.</li>
            <li>You may request complete, permanent purging of your account, order logs, and photos by submitting a deletion request to <a href="mailto:privacy@anovra.africa" className="text-[#008236] underline">privacy@anovra.africa</a>. Requests are processed within 14 business days.</li>
            <li>When data is deleted, it is permanently wiped from active production databases and scheduled for purging from disaster recovery backups in line with industry rotation cycles.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "third-party-sharing",
      number: "07",
      title: "Third-Party Service Providers",
      plainEnglish: "We only share data with vetted partners (cloud infrastructure, payment processors) necessary to run the service. No third-party ad brokers.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Anovra does not sell or rent personal information to external marketers. We only transfer data to trusted sub-processors that maintain rigorous data protection standards:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-foreground">Payment Processors:</strong> Paystack and Flutterwave process payment transactions under PCI-DSS Level 1 compliance. Anovra never stores complete credit card numbers or CVV codes.</li>
            <li><strong className="text-foreground">Cloud & Database Infrastructure:</strong> Supabase and Amazon Web Services (AWS) provide encrypted database and file storage environments.</li>
            <li><strong className="text-foreground">Legal & Regulatory Authorities:</strong> We disclose data solely if mandated by a valid court order, search warrant, or statutory legal requirement issued under Nigerian law.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "user-rights",
      number: "08",
      title: "Your Legal Rights Under NDPA / NDPR",
      plainEnglish: "You have the right to access, rectify, export, or erase your data, and to revoke consent for photo processing at any time.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>As a data subject, you hold statutory rights regarding your personal information:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-foreground">Right of Access:</strong> Request a copy of all personal records Anovra retains about you.</li>
            <li><strong className="text-foreground">Right to Rectification:</strong> Update inaccurate or outdated profile and contact details.</li>
            <li><strong className="text-foreground">Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request immediate deletion of your skin test history and facial photos.</li>
            <li><strong className="text-foreground">Right to Withdraw Consent:</strong> Revoke consent for AI image analysis at any point without penalty.</li>
            <li><strong className="text-foreground">Right to Lodge a Complaint:</strong> File an inquiry with the Nigeria Data Protection Commission (NDPC) if you believe your data rights have been infringed.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "cookies",
      number: "09",
      title: "Cookies & Local Session Storage",
      plainEnglish: "We use essential cookies and local storage to keep you logged in and preserve your active skin test state.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Anovra uses local storage tokens and essential browser cookies to preserve user sessions, track shopping carts on vendor storefronts, and store temporary skin test progress so you do not lose your analysis when navigating between screens.
          </p>
          <p>
            We do not deploy invasive third-party cross-site behavioral tracking cookies. You may configure your browser to block cookies, although certain authentication features may become unavailable.
          </p>
        </div>
      ),
    },
    {
      id: "contact-dpo",
      number: "10",
      title: "Data Protection Officer & Privacy Inquiries",
      plainEnglish: "Questions or requests? Contact our Data Protection Officer at privacy@anovra.africa.",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            For privacy inquiries, data subject access requests, or regulatory queries, please contact our Data Protection Officer:
          </p>
          <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 text-xs sm:text-sm">
            <p><strong className="text-foreground">Data Protection Officer (DPO)</strong></p>
            <p>Anovra Africa Ltd</p>
            <p>Direct Email: <a href="mailto:privacy@anovra.africa" className="text-[#008236] underline">privacy@anovra.africa</a></p>
            <p>General Support: <a href="mailto:hello@anovra.africa" className="text-[#008236] underline">hello@anovra.africa</a></p>
            <p>Physical Office: Abuja, Federal Capital Territory, Nigeria</p>
            <p>Phone: +234 916 766 4619</p>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.plainEnglish.toLowerCase().includes(query) ||
        s.number.includes(query)
    );
  }, [searchQuery, sections]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Header */}
      <div className="border-b border-border/80 bg-gradient-to-b from-[#f5f8f5] to-background pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008236]/10 text-[#008236] text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Security & Trust</span>
              </div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Privacy Policy
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                How we protect your sensitive facial scan images, skin metrics, and personal information with private-by-default standards.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span>Effective Date: October 1, 2026</span>
                <span>•</span>
                <span>Version 2.4</span>
                <span>•</span>
                <span className="text-[#008236] font-medium">NDPA 2023 & NDPR Compliant</span>
              </div>
            </div>

            {/* Quick Actions & Navigation Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs">
                <button
                  onClick={() => {
                    setView("terms");
                  }}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => {
                    // Already on privacy
                  }}
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#008236] text-white transition-all shadow-xs"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>

          {/* Search bar inside privacy policy */}
          <div className="mt-8 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search privacy topics (e.g. photos, encryption, delete)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-card placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[#008236]/30 focus:border-[#008236] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {/* At-a-Glance Plain English Highlights */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-[#008236]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#008236]">
              At a Glance: In Plain English
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-2 shadow-xs hover:border-[#008236]/30 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#008236] flex items-center justify-center font-bold">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Photos Never Sold</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your selfies are used exclusively to calculate your skin analysis. We never broker or sell facial photos.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-2 shadow-xs hover:border-[#008236]/30 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#008236] flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Encrypted End-to-End</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All communications and image transfers use TLS 1.3 protocol and AES-256 encrypted database storage.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-2 shadow-xs hover:border-[#008236]/30 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#008236] flex items-center justify-center font-bold">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Full Right to Delete</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You own your skin data. Request full erasure of photos and profile history anytime with one click.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-2 shadow-xs hover:border-[#008236]/30 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#008236] flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Vendor Isolation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vendors receive only dispatch shipping details. They never receive your facial photographs.
              </p>
            </div>
          </div>
        </div>

        {/* Content Layout: Sticky TOC + Section Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Table of Contents */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#008236]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Table of Contents
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {sections.length} Clauses
                </span>
              </div>
              <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer",
                      activeSectionId === s.id
                        ? "bg-[#008236]/10 text-[#008236] font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground/70 w-5">
                      {s.number}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </nav>

              <div className="pt-3 border-t border-border">
                <button
                  onClick={() => setView("terms")}
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium text-[#008236] hover:bg-[#008236]/10 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Read Terms of Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* Right Detailed Sections */}
          <main className="lg:col-span-8 space-y-8">
            {filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-border p-12 text-center space-y-3">
                <Info className="w-8 h-8 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-foreground text-sm">No topics matched your search</h3>
                <p className="text-xs text-muted-foreground">
                  Try searching for keywords like &quot;photos&quot;, &quot;retention&quot;, &quot;cookies&quot;, or &quot;delete&quot;.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-semibold text-[#008236] underline"
                >
                  Reset search
                </button>
              </div>
            ) : (
              filteredSections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#008236] bg-[#008236]/10 px-2.5 py-1 rounded-md">
                      {section.number}
                    </span>
                    <h2
                      className="text-lg sm:text-xl font-semibold text-foreground tracking-tight"
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      {section.title}
                    </h2>
                  </div>

                  {/* Plain English Summary Callout */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 sm:p-4 text-xs sm:text-sm text-foreground flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#008236] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-[#008236] block mb-0.5">
                        Key Takeaway:
                      </strong>
                      <span className="text-muted-foreground">{section.plainEnglish}</span>
                    </div>
                  </div>

                  {/* Formal Legal Content */}
                  <div className="pt-2">{section.content}</div>
                </article>
              ))
            )}

            {/* Bottom Support & Return Actions */}
            <div className="rounded-2xl border border-border bg-[#f5f8f5] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Need help exercising your data rights?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Our Data Protection Officer is ready to assist you.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setView("contact")}
                  className="px-4 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Contact DPO
                </button>
                <button
                  onClick={() => setView("skintest")}
                  className="px-4 py-2 rounded-lg bg-[#008236] hover:bg-[#006c2c] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Start Skin Test
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

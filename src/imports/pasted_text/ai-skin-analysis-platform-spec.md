 Build Spec: AI Skin Analysis & Recommendation Platform for African Skincare Vendors

## 1. Product Summary

A B2B2C SaaS platform that gives skincare vendors (in Nigeria, expanding across Africa) an AI-powered skin analysis tool they can put in front of their own customers. Each vendor gets:

- A vendor dashboard to build a product catalog (their own products + curated external products)
- A unique shareable "skin test" link for their customers
- An embeddable widget for their own website
- AI-driven skin analysis from a selfie, mapped to the vendor's product catalog
- Auto-generated, structured recommendations (why recommended, benefits, usage, drawbacks, warnings)
- A built-in ingredient safety layer that flags risky/banned ingredients (critical for the African whitening/lightening product market — NAFDAC and other regulators actively ban mercury, high-dose hydroquinone, and steroid-laced creams)

## 2. User Roles

### A. Vendor (primary customer)
- Signs up, creates a "shop" profile
- Builds/manages product catalog
- Gets a unique shareable link + embeddable widget
- Views analytics (test completions, top concerns, conversion to product clicks/sales)

### B. End Customer (vendor's customer)
- Opens vendor's unique link or widget
- Takes/uploads a selfie + answers a short skin questionnaire
- Gets analysis + matched product recommendations from that vendor's catalog (and optionally curated external products)
- No account required (or optional lightweight account for history tracking)

### C. Platform Admin (you)
- Manages global ingredient safety database
- Manages global "external product" curated library
- Moderates vendor catalogs, reviews flagged ingredients
- Manages subscription tiers/billing

## 3. Core Modules

### 3.1 Vendor Onboarding & Shop Setup
- Sign up (email/phone, business name, location — country/state for regulatory context)
- Shop profile: logo, name, bio, contact/social links, currency
- Generates: yourplatform.com/shop/{vendor-slug} as the shareable test link
- Embed code generator (JS snippet + iframe option) for vendor's own website
- Subscription tier selection (see Section 7)

### 3.2 Product Catalog Management (key vendor-facing feature)
For each product, vendor inputs:
- Product name, photo(s), price, purchase link/CTA
- *Skin concern(s) it addresses* — multi-select from a managed taxonomy (see 3.3)
- *Key ingredients* — searchable/autocomplete from the ingredient database, with free-text option for ingredients not yet in the system (these go to admin review queue)
- *Vendor's own description* of what they believe the product does/treats
- Usage instructions (how, how often, AM/PM, patch test recommended, etc.)
- Skin type suitability (oily, dry, combination, sensitive, all)

System auto-attaches (from ingredient DB, not vendor-edited):
- Known benefits of each ingredient
- Known side effects/disadvantages
- Safety warnings (e.g., photosensitivity, pregnancy caution, max safe concentration)
- *Safety flag* if ingredient is banned/restricted in the vendor's country or globally flagged (mercury, hydroquinone >2%, steroids, etc.) — flagged products are blocked from being recommended until resolved, with vendor notified why

### 3.3 Concern/Category Taxonomy
Admin-managed master list, vendor selects from it (keeps recommendations structured and comparable):
- Brightening/even tone correction
- Hyperpigmentation/dark spot correction
- Tone unification ("one skin tone" — framed around evenness, not lightening complexion)
- Acne/blemish control
- Dryness/hydration
- Oil control
- Anti-aging/fine lines
- Sensitivity/redness/barrier repair
- Sun damage/SPF

Note: I'd recommend reframing raw "skin whitening" as *"tone correction / hyperpigmentation / evenness"* categories rather than complexion lightening — this keeps you aligned with regulatory language in Nigeria and most of Africa, where marketing aimed at lightening natural skin tone (vs. correcting dark spots/melasma) draws regulatory and platform (Meta/Google ad policy) scrutiny. You can still serve the customer need; just frame and tag it as pigmentation evenness rather than tone-lightening.

### 3.4 Skin Test Flow (Customer-facing)
1. Capture: guided selfie flow (front-facing camera, oval face guide overlay, lighting check — reject/warn on backlit or low-light images to reduce false readings)
2. Short questionnaire: skin type, main concern in their words, known sensitivities/allergies, current routine, age range
3. AI analysis output (internal): scores/flags for — pigmentation/dark spots, acne/blemishes, redness/sensitivity signs, dryness/oiliness indicators, visible fine lines/texture
4. Matching engine cross-references analysis + questionnaire against the vendor's catalog (then external curated catalog if vendor opts in or has gaps)
5. Result screen: ranked product recommendations, each with the structured card below

### 3.5 Recommendation Output (per product, your required structure)
- *Why recommended* — tied explicitly to detected concern(s) (e.g., "Your scan showed visible hyperpigmentation around the cheeks; this product targets that with niacinamide and licorice extract")
- *Benefits* — pulled from ingredient DB + vendor description
- *How to use for real results* — frequency, technique, expected timeline, what to pair/avoid pairing with
- *Disadvantages* — e.g., "may cause initial dryness/purging in first 2 weeks," "not ideal for very oily skin"
- *Warnings* — ingredient-driven (photosensitivity → wear SPF, avoid if pregnant/breastfeeding, patch test, discontinue if irritation, see a dermatologist if no improvement in X weeks)
- CTA button → vendor's purchase link/contact (WhatsApp link is a strong default for Nigerian/African market — many vendors sell via WhatsApp/Instagram)

### 3.6 Website Integration
- JS embed widget (modal or inline) — drop-in <script> tag
- iframe fallback for simpler website builders
- Optional REST API for vendors with developers who want native integration

### 3.7 Vendor Analytics Dashboard
- Number of tests taken
- Most common concerns detected among their customers
- Top recommended/clicked products
- Drop-off points in the test flow

## 4. AI/Technical Approach

- *Image analysis*: Start with a transfer-learning model (e.g., fine-tuned EfficientNet/ResNet, or a pre-trained dermatology/skin-attribute model) trained/fine-tuned specifically on darker skin tones — this is the single most important technical differentiator, since most off-the-shelf skin AI models are trained predominantly on lighter skin and perform poorly otherwise. Source or commission training data reflecting Nigerian/African skin tones and lighting conditions.
- *Capture normalization*: guide users to consistent lighting/distance; apply white-balance/exposure correction before scoring to reduce variance across phone cameras.
- *Recommendation engine*: rules-based matching (concern tags + ingredient suitability + skin type) is a reasonable v1 — don't over-invest in ML for matching before you have data volume. Add ML-based ranking later once you have enough usage data.
- *Ingredient safety database*: maintain as structured data (ingredient name, function, known benefits, known side effects, regulatory status by country, max safe concentration) — start by encoding NAFDAC's banned substances list plus internationally recognized restricted skincare ingredients (mercury, hydroquinone thresholds, certain steroids/corticosteroids).
- *Medical disclaimer layer*: every result screen needs a clear "this is not a medical diagnosis, consult a dermatologist for persistent or severe conditions" disclaimer, plus an automatic flag-and-refer message if the scan detects something that looks like it may need clinical attention (unusual moles, suspected infection, etc.) rather than just a cosmetic recommendation.

## 5. Suggested Tech Stack

- *Frontend (customer test flow + widget)*: React/Next.js, lightweight mobile-first design (most users will be on mid-range Android phones — optimize image upload size/compression accordingly, since data costs matter a lot in this market)
- *Vendor dashboard*: React/Next.js admin panel
- *Backend*: Node.js or Python (FastAPI) API layer
- *AI/CV model serving*: Python (FastAPI/Flask) microservice, or hosted inference (Anthropic/OpenAI vision APIs can assist with structured concern descriptions from images, paired with a dedicated CV model for scoring — a hybrid approach is realistic for v1 to ship faster than training a custom model from scratch)
- *Database*: PostgreSQL (structured product/ingredient/vendor data) + object storage (S3-compatible) for images
- *Hosting*: consider African or low-latency-to-Africa infra (e.g., AWS Cape Town region) to keep load times reasonable
- *Payments*: Paystack or Flutterwave for Nigerian/African billing (vendor subscriptions)

## 6. Regulatory/Trust Considerations (build these in from day one)

- NAFDAC compliance messaging for vendors (don't let them list/market banned-ingredient products)
- Clear data privacy policy — facial images are sensitive; get explicit consent, define retention/deletion policy, allow users to request deletion
- Avoid medical claims language ("cures," "treats disease") — frame as cosmetic improvement, not medical treatment
- Avoid colorism-adjacent marketing — frame around "tone evenness/correction" rather than "lightening/whitening" in UI copy, even if vendors internally categorize products that way

## 7. Suggested Monetization (Vendor-facing SaaS)

- Free tier: limited tests/month, platform branding on results page, basic catalog size
- Paid tiers: higher test volume, white-labeled results page, website embed, analytics, priority support
- Possible add-on: commission/affiliate fee on external curated product recommendations

## 8. Suggested Build Phases

1. *MVP*: Vendor signup, manual product catalog entry, basic questionnaire-only matching (no AI image analysis yet), shareable link, basic recommendation card
2. *V2*: Add AI image analysis (start with a vision API + simple scoring heuristics), ingredient safety database, structured recommendation output
3. *V3*: Website embed widget, vendor analytics dashboard, external curated product library
4. *V4*: Custom-trained CV model on African skin tone dataset, ML-based ranking, multi-country regulatory rule sets as you expand beyond Nigeria
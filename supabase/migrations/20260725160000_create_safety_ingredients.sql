-- Create Safety Ingredients Table
CREATE TABLE IF NOT EXISTS public.safety_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  function TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('banned', 'restricted', 'caution', 'safe')),
  scope TEXT NOT NULL,
  max_conc TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.safety_ingredients ENABLE ROW LEVEL SECURITY;

-- Allow public read access to ingredients
CREATE POLICY "Allow public read access to safety_ingredients" ON public.safety_ingredients
  FOR SELECT USING (true);

-- Allow admins to manage ingredients (insert, update, delete)
CREATE POLICY "Allow admins to manage safety_ingredients" ON public.safety_ingredients
  FOR ALL TO authenticated USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- Seed Initial Ingredients
INSERT INTO public.safety_ingredients (name, function, status, scope, max_conc, notes)
VALUES
  ('Mercury / Mercurous Chloride', 'Skin lightening', 'banned', 'Global + NAFDAC', '0%', 'No safe concentration. Neurotoxic. Banned in all cosmetics globally.'),
  ('Hydroquinone', 'Hyperpigmentation treatment', 'restricted', 'NAFDAC (Nigeria)', '2%', 'OTC limit is 2%. Higher concentrations require prescription. Carcinogenic risk at high doses.'),
  ('Clobetasol Propionate', 'Anti-inflammatory (corticosteroid)', 'restricted', 'NAFDAC + WHO', '0.05% (Rx only)', 'Prescription only. Often misused as a skin lightener. Causes skin atrophy at OTC doses.'),
  ('Niacinamide', 'Brightening, barrier support', 'safe', 'Global', 'No limit (10% common)', 'Well-tolerated across all skin tones. No known dangerous interactions at cosmetic doses.'),
  ('Kojic Acid', 'Melanin synthesis inhibitor', 'safe', 'Global', '1–2% recommended', 'Safe at cosmetic concentrations. Photosensitising — pair with SPF.'),
  ('Arbutin (Alpha)', 'Tyrosinase inhibitor', 'safe', 'Global', '2% guideline', 'Generally considered safe. Avoid concentrations above 3% without dermatologist guidance.'),
  ('Retinol', 'Anti-aging, cell turnover', 'caution', 'Global', '1% OTC (EU)', 'Avoid during pregnancy. Photosensitising. Caution combining with AHAs/BHAs.'),
  ('Lactic Acid', 'AHA exfoliant, hydration', 'safe', 'Global', '10% OTC', 'Safe up to 10% at pH >=3.5. Above 10% requires professional supervision.'),
  ('Salicylic Acid', 'Exfoliation, acne control', 'restricted', 'Global + NAFDAC', '2% OTC', 'Beta Hydroxy Acid (BHA). Restricted to 2% max concentration in over-the-counter leave-on products.'),
  ('Glycolic Acid', 'Exfoliation, brightening', 'safe', 'Global', '10% OTC', 'Alpha Hydroxy Acid (AHA). Safe up to 10% in OTC products with a pH of 3.5 or higher. Enhances sun sensitivity.'),
  ('Tretinoin', 'Acne treatment, cell turnover', 'banned', 'Global + NAFDAC', '0% (Rx only)', 'Retinoic acid. Strictly banned in OTC cosmetics globally. Available only with a prescription due to potential birth defect risks and severe skin peeling.'),
  ('Kojic Dipalmitate', 'Hyperpigmentation treatment', 'safe', 'Global', '2%', 'A stable ester derivative of Kojic Acid. Safe and effective at 1–2% concentration in lightening products.'),
  ('Ascorbic Acid (L-Ascorbic Acid)', 'Antioxidant, collagen support', 'safe', 'Global', '20%', 'Pure vitamin C. Generally safe when formulated well. Most effective at 10–20% concentration, but unstable and prone to oxidation.'),
  ('Zinc Oxide', 'Physical UV filter, soothing', 'safe', 'Global', '25%', 'Broad-spectrum mineral sunscreen filter. Globally approved up to 25% max concentration. Extremely safe for sensitive and acne-prone skin.'),
  ('Titanium Dioxide', 'Physical UV filter', 'safe', 'Global', '25%', 'Mineral UV filter. Globally approved up to 25%. Safe in topical formulas; caution in powder form due to inhalation risks.'),
  ('Oxybenzone (Benzophenone-3)', 'Chemical UV filter', 'caution', 'Global + EU', '6% (EU)', 'Chemical filter. Capped at 6% in EU due to high skin absorption rates, potential endocrine disruption, and marine coral bleaching hazard.'),
  ('Octinoxate (Ethylhexyl Methoxycinnamate)', 'Chemical UV filter', 'caution', 'Global', '7.5% depending on region', 'Chemical sunscreen filter. Approved limits vary by market, but it is restricted in some reef-protection zones due to coral bleaching concerns.'),
  ('Avobenzone', 'Chemical UVA filter', 'safe', 'Global', '3–5% depending on region', 'Standard UVA filter. Approved limits vary by market. Photo-unstable on its own, so it is usually paired with stabilising UV filters such as octocrylene.'),
  ('Methylparaben', 'Cosmetic preservative', 'safe', 'Global', '0.4%', 'Globally approved preservative. Safe up to 0.4% in single-ingredient uses. Extensively studied, highly effective, and non-sensitizing.'),
  ('Propylparaben', 'Cosmetic preservative', 'restricted', 'Global + EU', '0.14%', 'Restricted to 0.14% in the EU due to precautionary concerns regarding potential weak estrogenic activity.'),
  ('Formaldehyde', 'Preservative / sterilizer', 'banned', 'Global + NAFDAC', '0%', 'Globally banned in cosmetics. Known human carcinogen, contact allergen, and sensitizing agent.'),
  ('Dibutyl Phthalate (DBP)', 'Plasticizer / solvent', 'banned', 'EU + NAFDAC', '0%', 'Globally banned in cosmetic products (especially nail polishes) due to endocrine disruption and reproductive toxicity risks.'),
  ('Diethyl Phthalate (DEP)', 'Fragrance solvent', 'safe', 'Global', 'No limit', 'Reviewed by CIR and deemed safe in cosmetics. Does not pose the reproductive health risks associated with other phthalates.'),
  ('BHA (Butylated Hydroxyanisole)', 'Preservative / antioxidant', 'caution', 'Global', '0.5%', 'Synthetic antioxidant. Classified as a precautionary caution due to endocrine disruption concerns. Limited to 0.5% in cosmetics.'),
  ('BHT (Butylated Hydroxytoluene)', 'Preservative / stabilizer', 'safe', 'Global', '0.8%', 'Synthetic antioxidant. Deemed safe in cosmetics up to 0.8% in leave-on formulas. Prevents oil rancidity.'),
  ('Triclosan', 'Antibacterial / preservative', 'restricted', 'Global + NAFDAC', '0.3%', 'Restricted to 0.3% max in leave-on creams. Banned in OTC body washes due to thyroid hormone concerns and environmental bioaccumulation.'),
  ('Coal Tar', 'Keratolytic agent', 'banned', 'EU + NAFDAC', '0% (Rx only)', 'Banned in EU cosmetics due to polycyclic aromatic hydrocarbon (PAH) content and potential carcinogenic risk. Permitted in Rx shampoos.'),
  ('Lead / Lead Acetate', 'Heavy metal impurity / dye', 'banned', 'Global + NAFDAC', '0%', 'Banned globally in all cosmetics. Heavy metal toxin that causes neurological damage.'),
  ('Resorcinol', 'Acne treatment / hair dye', 'restricted', 'Global + EU', '1.25% OTC', 'Restricted in leave-on acne treatments to 1.25%. Known skin sensitizer and thyroid health concern at high concentrations.'),
  ('Bakuchiol', 'Antioxidant, retinol alternative', 'safe', 'Global', '1%', 'Plant-derived retinol alternative. Generally well tolerated, non-photosensitising, and often used for soothing support.'),
  ('Centella Asiatica (Cica)', 'Soothing, skin barrier repair', 'safe', 'Global', 'No limit', 'Extremely safe plant extract. Promotes wound healing, collagen synthesis, and calms irritated skin.'),
  ('Hyaluronic Acid', 'Humectant, hydration', 'safe', 'Global', '2% common', 'Generally safe and naturally present in the skin. Helps retain water to support a plumper, hydrated feel.')
ON CONFLICT (name) DO NOTHING;

UPDATE public.safety_ingredients
SET
  max_conc = '2% guideline',
  notes = 'Generally considered safe. Avoid concentrations above 3% without dermatologist guidance.'
WHERE name = 'Arbutin (Alpha)';

UPDATE public.safety_ingredients
SET
  function = 'Antioxidant, collagen support',
  notes = 'Pure vitamin C. Generally safe when formulated well. Most effective at 10–20% concentration, but unstable and prone to oxidation.'
WHERE name = 'Ascorbic Acid (L-Ascorbic Acid)';

UPDATE public.safety_ingredients
SET
  max_conc = '3–5% depending on region',
  notes = 'Standard UVA filter. Approved limits vary by market. Photo-unstable on its own, so it is usually paired with stabilising UV filters such as octocrylene.'
WHERE name = 'Avobenzone';

UPDATE public.safety_ingredients
SET
  notes = 'Plant-derived retinol alternative. Generally well tolerated, non-photosensitising, and often used for soothing support.'
WHERE name = 'Bakuchiol';

UPDATE public.safety_ingredients
SET
  max_conc = '7.5% depending on region',
  notes = 'Chemical sunscreen filter. Approved limits vary by market, but it is restricted in some reef-protection zones due to coral bleaching concerns.'
WHERE name = 'Octinoxate (Ethylhexyl Methoxycinnamate)';

UPDATE public.safety_ingredients
SET
  notes = 'Generally safe and naturally present in the skin. Helps retain water to support a plumper, hydrated feel.'
WHERE name = 'Hyaluronic Acid';

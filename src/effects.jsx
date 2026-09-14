import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import LightRays from './react-bits/LightRays';
import StarBorder from './react-bits/StarBorder';

function AtmosphericLight() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(preference.matches);
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);
  if (reduced) return null;
  return <LightRays raysOrigin="top-right" raysColor="#439fff" raysSpeed={0.24} lightSpread={0.7} rayLength={2.1} fadeDistance={1.4} followMouse mouseInfluence={0.09} noiseAmount={0.025} distortion={0.035} />;
}

const rays = document.getElementById('hero-rays');
if (rays) createRoot(rays).render(<AtmosphericLight />);
const cta = document.getElementById('candidate-cta');
if (cta) createRoot(cta).render(
  <StarBorder as="a" className="candidate-star-border" color="#ffd84c" speed="5s" backgroundColor="#102957" borderColor="#2769b5" href="https://deputadowellingtonjose.lovable.app/" target="_blank" rel="noopener noreferrer">
    Conhecer o site do candidato <span aria-hidden="true">↗</span>
  </StarBorder>
);

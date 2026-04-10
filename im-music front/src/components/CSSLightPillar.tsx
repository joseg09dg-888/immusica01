import React from 'react';
import './CSSLightPillar.css';

export default function CSSLightPillar() {
  return (
    <div className="css-light-pillar" aria-hidden="true">
      <div className="css-lp-beam css-lp-beam-1" />
      <div className="css-lp-beam css-lp-beam-2" />
      <div className="css-lp-beam css-lp-beam-3" />
      <div className="css-lp-beam css-lp-beam-4" />
      <div className="css-lp-glow css-lp-glow-1" />
      <div className="css-lp-glow css-lp-glow-2" />
    </div>
  );
}

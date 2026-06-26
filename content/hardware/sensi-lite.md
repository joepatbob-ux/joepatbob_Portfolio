---
{
  "id": "sensi-lite",
  "title": "Sensi Lite",
  "subtitle": "32 segments. 3 buttons. A full thermostat experience.",
  "imageAlt": "Sensi Lite thermostat prototype, three-quarter view on black",
  "imageSrc": "/images/sensi-lite-tilted.png",
  "imageLayout": "full-width",
  "imagePosition": "left"
}
---

The Sensi Lite was the most constrained product I've worked on. Display: 32 segments. Input: three buttons — up, down, menu/action. Mandate: a complete thermostat experience for a budget-tier product.

This is where design becomes editorial. You can't show everything — you have to decide what matters most, and make that decision invisible.

**Navigation: flat and cyclical**

Hierarchy is expensive when you have three buttons. I kept navigation flat and cyclical — the user moves through settings in a loop rather than diving into nested menus. The menu/action button serves double duty: a standard press moves through the flow, a long press enters homeowner settings, a second long press accesses contractor configuration.

That last detail matters. Contractor settings can break an HVAC configuration if a homeowner wanders into them. The long-press-to-long-press pattern keeps those settings accessible to the people who need them and invisible to those who don't — without removing DIY capability.

**Order as logic**

With flat navigation, the sequence of settings isn't just organizational — it's functional. Some settings are conditional: if a user configures a heat pump, reversing valve direction needs to follow immediately. I sequenced settings based on that logic, defaulting to the most common equipment configuration at the top to minimize installation time.

**Testing**

Usability testing revealed that 23% of users stalled at the three-dot menu button, which didn't read as interactive. Auto mode caused hesitation in 30% — confirming conditional sequencing was load-bearing. Iconography testing (five variants, one question: which says "system off?") landed on a square inside a circle — borrowed from the media stop symbol — and carried forward across later products.

I also observed physical installation behavior: wire tucking, snap-to-baseplate, clip strength. Those observations fed directly into the hardware design.

**The decisions I lost**

Two positions didn't survive stakeholder review. Post-launch data proved them right.

I wanted fan circulation runtime surfaced higher for homeowner accessibility. Pushed lower in favor of a mobile-first vision — it became added noise for customer service. I proposed placing the menu/action button on the opposite side of the display to reduce accidental capacitive taps. Hardware engineering preferred in-line. Accidental taps became a meaningful post-launch issue requiring a firmware patch.

I don't tell these stories to relitigate them. I tell them because they changed how I work. Document the testing rationale. If you're going to lose an argument, lose it with evidence.

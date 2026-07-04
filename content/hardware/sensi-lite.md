---
{
  "id": "sensi-lite",
  "title": "Sensi Lite",
  "subtitle": "Thirty-two segments, three buttons, no room to hide.",
  "imageAlt": "Sensi Lite thermostat prototype, three-quarter view on black",
  "imageSrc": "/images/sensi-lite-tilted.png",
  "imageLayout": "full-width",
  "imagePosition": "left"
}
---

Sensi Lite was the most constrained product I have worked on: thirty-two display segments and three buttons — up, down, and menu/action. The mandate was a complete thermostat experience for a budget-tier product that still had to feel considered.

At this level of constraint, design becomes editorial. Every character has to earn its place, every button press has to count, and every hidden layer has to be hidden for a reason.

**Navigation stayed flat because hierarchy was too expensive.**

Hierarchy is expensive when you have three buttons. I kept navigation flat and cyclical — users move through settings in a loop rather than drilling into nested menus — and let the menu/action button change roles by press: a standard press advances the flow, a long press enters homeowner settings, and a second long press reaches contractor configuration.

That last layer matters. Contractor settings can break an HVAC configuration if a homeowner stumbles into them; the long-press-to-long-press pattern keeps them reachable for installers and out of sight for everyone else, without removing DIY capability.

**With flat navigation, order becomes logic.**

When navigation is flat, the sequence of settings is functional, not just organizational. Some settings are conditional — configure a heat pump, and reversing valve direction has to follow immediately. So I sequenced settings by dependency logic, defaulting the most common equipment configuration to the top to cut installation time.

**Testing had to include the whole product.**

Usability testing showed 23% of users stalling at the three-dot menu button because it did not read as interactive, and auto mode causing hesitation in 30% — confirming the conditional sequencing was doing real work. Icon testing across five variants landed on a square inside a circle, borrowed from the media stop symbol and carried into later products. I also watched physical installation — wire tucking, snap-to-baseplate behavior, clip resistance — and fed those observations back into the hardware. On a product this constrained, the line between UI and physical design is thin.

**When the display goes dark, the system still has to communicate.**

Sensi Lite relies on power stealing from the HVAC system. When that power is lost or insufficient, the display cannot function — so the question becomes how the device reports its state when the screen a user would normally check has gone dark. I was part of the team that worked through what shuts down, in what order, and how state gets communicated when the hardware cannot show it: a prioritized shutdown sequence and a notification flow that surfaces device state through the cloud to the mobile app. The phone becomes the display when the thermostat cannot be. That work is the subject of US Patent 12,608,066, awarded April 2026.

**The decisions I lost changed how I work.**

Two positions did not survive stakeholder review, and post-launch data proved them right. I wanted fan circulation runtime surfaced higher for homeowners; it was pushed down for a mobile-first vision and became a recurring support issue. I proposed moving the menu/action button to the opposite side of the display to reduce accidental capacitive taps; hardware engineering preferred in-line alignment, and the taps became a post-launch issue that needed a firmware patch.

I do not tell those stories to relitigate them. I tell them because they taught me to document the testing rationale — if you are going to lose an argument, lose it with evidence, so when the data comes in the record is already there.

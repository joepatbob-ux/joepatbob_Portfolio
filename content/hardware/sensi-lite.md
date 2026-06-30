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

Sensi Lite was the most constrained product I have worked on.

Thirty-two display segments. Three buttons: up, down, and menu/action. The mandate was a complete thermostat experience for a budget-tier product that still had to feel considered.

At this level of constraint, design becomes editorial.

You cannot show everything, so every character has to earn its place. Every button press has to count. Every hidden layer has to be hidden for a reason.

**Navigation stayed flat because hierarchy was too expensive.**

Hierarchy is expensive when you have three buttons.

I kept navigation flat and cyclical so users move through settings in a loop rather than drilling into nested menus. The menu/action button serves different roles depending on how it is pressed: a standard press moves through the flow, a long press enters homeowner settings, and a second long press accesses contractor configuration.

That last layer matters.

Contractor settings can break an HVAC configuration if a homeowner stumbles into them. The long-press-to-long-press pattern keeps those settings reachable for installers and out of sight for everyone else, without removing DIY capability.

**With flat navigation, order becomes logic.**

When navigation is flat, the sequence of settings is not just organizational. It is functional.

Some settings are conditional. Configure a heat pump, and reversing valve direction needs to follow immediately. The order of the flow has to match the logic of the equipment.

I sequenced settings based on dependency logic, with the most common equipment configuration defaulting to the top to reduce installation time.

**Testing had to include the whole product.**

Usability testing revealed that 23% of users stalled at the three-dot menu button because it did not read as interactive. Auto mode caused hesitation in 30%, confirming the conditional sequencing was doing real work.

Icon testing across five variants landed on a square inside a circle, borrowed from the media stop symbol, and carried forward into later products.

I also observed physical installation: wire tucking, snap-to-baseplate behavior, and clip resistance. Those observations fed directly back into the hardware design.

On a product this constrained, the line between UI and physical design is thin.

**When the display goes dark, the system still has to communicate.**

Thermostats like Sensi Lite rely on power stealing from the HVAC system. When that power is lost or insufficient, the display cannot function normally.

The question becomes what the system does next and how it tells the user what is happening when the device they would normally check has gone dark.

I was part of the team that worked through that problem: what shuts down, in what order, and how device state gets communicated when the hardware cannot display it.

The answer involved a prioritized shutdown sequence and a notification flow that surfaces device state through the cloud to the mobile app. The user's phone becomes the display when the thermostat cannot be.

That work is the subject of US Patent 12,608,066, awarded April 2026.

**The decisions I lost changed how I work.**

Two positions did not survive stakeholder review. Post-launch data proved them right.

I wanted fan circulation runtime surfaced higher for homeowner accessibility. It was pushed down in favor of a mobile-first vision and became a recurring customer service issue.

I proposed moving the menu/action button to the opposite side of the display to reduce accidental capacitive taps. Hardware engineering preferred in-line alignment. Accidental taps became a post-launch issue that required a firmware patch.

I do not tell those stories to relitigate them.

I tell them because they changed how I work.

Document the testing rationale. If you are going to lose an argument, lose it with evidence, so when the data comes in, the record is already there.

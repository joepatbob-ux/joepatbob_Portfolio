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

Sensi Lite is the most constrained product I've worked on: thirty-two display segments, three buttons (up, down, menu/action), and a brief for a complete thermostat experience that still had to feel premium. With three inputs, hierarchy is too expensive, so navigation stays flat and cyclical — the menu/action button does different jobs depending on how it's pressed: a normal press advances, a long press opens homeowner settings, a second long press reaches contractor configuration, keeping settings that can break an HVAC system within reach for installers and out of the way for everyone else. With flat navigation, order does the work a menu hierarchy usually would, so I sequenced settings by dependency (heat pump setup leads straight into reversing-valve direction), most common configuration first.

Sensi Lite also runs on power stolen from the HVAC system, so when power drops too low for the display to run, the device still has to communicate state. I helped work out a prioritized shutdown sequence and a notification flow that pushes device state to the mobile app, so the phone stands in for the display when the thermostat can't — the low-power detection method is the subject of US Patent 12,608,066. Two of my calls lost stakeholder review, and post-launch data proved both right, which taught me to put reasoning on the record before losing an argument.

**What the icon testing found**

In usability testing, 23% of users stalled at the three-dot menu button because it didn't read as pressable, and auto mode made 30% hesitate — a sign the conditional sequencing was pulling its weight. Icon testing ran five variants and settled on a square inside a circle, lifted from the media stop symbol; that mark carried into later products.

**Where UI ends and hardware begins**

I sat in on physical installs, watching people tuck wires, snap the unit onto its baseplate, and fight with the clips, then turned what I saw into hardware requirements — clip resistance, baseplate fit, where the controls sat. On a product this small, UI and physical design stop being separate problems.

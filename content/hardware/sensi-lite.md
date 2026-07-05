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

Sensi Lite was the most constrained product I have worked on: thirty-two display segments and three buttons — up, down, and menu/action. The brief was a complete thermostat experience for a budget-tier product that still had to feel considered.

With that little to work with, most of the design is deciding what to cut. A segment that is not doing real work, a button press that goes nowhere, a setting hidden out of habit rather than reason — none of it survives.

**Navigation stayed flat because hierarchy was too expensive.**

Three buttons make hierarchy expensive. It is the same problem as designing for a remote: every state has to be reachable through a tiny, fixed set of inputs. So I kept navigation flat and cyclical. Rather than drilling into nested menus, users loop through the settings, and the menu/action button does different jobs depending on how it is pressed. A normal press moves through the flow. A long press opens homeowner settings. A second long press reaches contractor configuration.

That last layer earns its obscurity. Contractor settings can break an HVAC configuration if a homeowner wanders into them, so the long-press-to-long-press gesture keeps them within reach for installers and out of the way for everyone else. Owners who want to get there still can.

**With flat navigation, order becomes logic.**

When navigation is flat, the order of the settings does real work; it is not just a filing system. Some settings depend on earlier ones — set up a heat pump, and reversing-valve direction has to come right after. So I ordered everything by those dependencies and put the most common equipment configuration first, which shaves time off the install.

**Testing had to include the whole product.**

In usability testing, 23% of users stalled at the three-dot menu button because it did not read as something you could press, and auto mode made 30% hesitate — a sign the conditional sequencing was pulling its weight. Icon testing ran through five variants and settled on a square inside a circle, lifted from the media stop symbol; that one carried into later products. I also sat in on physical installs, watching people tuck wires, snap the unit onto its baseplate, and fight with the clips, and I turned what I saw into hardware requirements, from clip resistance and baseplate fit to where the controls sat. On a product this small, UI and physical design stop being separate problems.

**When the display goes dark, the system still has to communicate.**

Sensi Lite runs on power stolen from the HVAC system, and when that power drops too low the display cannot run. That raises an odd question: how does the device tell you what it is doing once the screen you would normally check has gone dark? I was part of the team that worked out the answer — what shuts down, in what order, and how the device reports its state when it cannot show anything itself. What we landed on was a prioritized shutdown sequence plus a notification flow that pushes device state through the cloud to the mobile app, so the phone stands in for the display when the thermostat cannot. The low-power detection method behind that shutdown sequence is the subject of US Patent 12,608,066, awarded April 2026.

**The decisions I lost changed how I work.**

Two of my positions did not survive stakeholder review, and the post-launch data proved both of them right. I wanted fan-circulation runtime surfaced higher for homeowners; it got pushed down in favor of a mobile-first vision and turned into a recurring support call. I argued for moving the menu/action button to the far side of the display to cut down on accidental capacitive taps; hardware engineering preferred keeping it in line, and those taps became a post-launch problem that needed a firmware patch.

I keep those two around for one reason: they taught me to write down the reasoning behind every test. If you are going to lose an argument, lose it on the record — then the evidence is already there when the data comes in and settles it.

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

This is where design becomes editorial. You can't show everything, so you have to decide what matters most — and then make that decision invisible to the user.

**Starting with function, not form**

Before touching any design tool, I mapped every function the thermostat needed to support against every constraint it had to work within. Some requirements were obvious. Some were regulatory — fan circulation runtime is mandated. Some emerged from conversations with engineering: fewer relays meant a narrower range of compatible equipment, which was actually a gift — a smaller decision space for the user.

**Navigation: flat and cyclical**

Hierarchy is expensive when you have three buttons. I kept the navigation flat and cyclical — the user moves through settings in a loop rather than diving into nested menus. The menu/action button serves double duty: a standard press moves through the flow, a long press enters a homeowner settings menu, a second long press accesses the contractor configuration menu.

That last detail matters. Contractor settings can break an HVAC configuration if a homeowner accidentally wanders into them. The long-press-to-long-press pattern keeps those settings accessible to the people who need them, invisible to the people who don't — without removing DIY installation capability entirely. That lives in the app.

**Order as logic**

With flat navigation, the sequence of settings isn't just organizational — it's functional. Some settings are conditional: if a user configures their system as a heat pump, options like reversing valve direction need to follow immediately. Getting the order wrong means asking users to answer questions before they have context to answer them.

I sequenced settings based on that conditional logic, defaulting to the most common equipment configuration at the top — informed by contractor feedback — to reduce installation time at the thermostat.

**Testing beyond the screen**

I ran physical installation testing with real users, observing not just how they navigated the UI but how they interacted with the hardware itself. Could they tuck the wires easily? Did the snap-to-baseplate mechanism communicate itself without instruction? Those observations fed directly back into the product — including tweaks to the baseplate design, strengthening the clips and reducing twisting during installation.

**Iconography validation**

How do you show that the HVAC system is off using only a symbol? I ran guerrilla testing — five icon variants, one question: which one says "system off"? We landed on a square inside a circle, borrowing the stop symbol from media players. Users recognized it immediately. It informed iconography decisions across later products.

**Task testing**

Usability testing on the mode-switching flow revealed that 23% of users abandoned the task early, most stalling at the three-dot menu button which didn't read as interactive. That finding directly shaped how I labeled and positioned the menu entry point. Auto mode caused hesitation in roughly 30% of users — confirmation that conditional sequencing wasn't just a logical preference, it was load-bearing. After clearing the first task, users navigated the rest of the menu with significantly less confusion, validating the flat cyclical structure once the entry point was clear.

**The decisions I lost, and what happened after**

Two positions didn't survive stakeholder review. Post-launch data proved them right.

The first: I wanted the fan circulation runtime setting surfaced higher in the menu for homeowner accessibility. It was pushed lower in favor of a mobile-first product vision. The result was added noise for customer service — friction that could have been avoided.

The second: I proposed placing the menu/action button on the opposite side of the display from the other two buttons to reduce accidental capacitive taps. Validation came back roughly 50/50, and hardware engineering preferred an in-line layout for manufacturing simplicity. Accidental taps became a meaningful post-launch issue — significant enough to require a firmware adjustment to partially mitigate it.

I don't tell these stories to relitigate the decisions. I tell them because they changed how I work. I now document testing rationale and design decisions more rigorously so the reasoning is on record regardless of what gets decided. If you're going to lose an argument, lose it with evidence.

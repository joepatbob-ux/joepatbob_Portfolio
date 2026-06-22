// lib/sections/hardware.ts
// Chapter copy: `title` = nav label; `subtitle` = on-slide headline; `body` = scrollable copy.
import type { Section } from '../types'

export const hardware: Section = {
  id: 'hardware',
  label: 'Hardware',
  eyebrow: '',
  headline: 'Designing for a screen is one thing.',
  overviewBody: `Designing for hardware is another problem entirely. Over several product cycles at Copeland, I led UX across five thermostat products — each with its own constraint profile, audience, and set of tradeoffs.

The through-line across all of them: the interface has to do the hard work so the person using it doesn't.`,
  overviewMeta: [
    { label: 'Role', value: 'Lead Product Designer' },
    { label: 'Company', value: 'Copeland (Sensi)' },
    {
      label: 'Products',
      value: 'Sensi Touch 2 · Sensi Lite · Verdant VX4 · Verdant Line Voltage · EIM',
      wide: true,
    },
    {
      label: 'Patents',
      value: 'US 12,608,066 · Segment display character set (pending)',
      wide: true,
    },
  ],
  lessonTitle: '',
  lessonBody: '',
  chapters: [
    {
      id: 'touch-2',
      title: 'Touch 2',
      subtitle: "Inheriting a touchscreen that didn't know it was a touchscreen.",
      body: `When I came onto Touch 2, the existing interface was doing something common and understandable — replicating the visual language of the fixed segment thermostat that sat next to it in the product line. Safe, familiar, wrong.

A touchscreen isn't a fixed segment display with more pixels. It's a different contract with the user entirely. Touch 1 wasn't broken — the menu structure was actually solid — but it wasn't taking advantage of what the hardware could do.

Before any design work, I analyzed Touch 1's strengths and weaknesses, mapped the competitive landscape, and ran interviews across utility partners, contractors, and customers. That breadth mattered — each group had a different relationship with the product and different failure modes to surface.

**What I kept**

The core menu architecture. Changing navigation that users already understood would have introduced friction without adding value. Good bones are good bones.

**What I changed**

The visual language, the interaction model, and one pattern that changed everything: the action button.

Every screen has a primary action. In Touch 1, that action was buried or inconsistent. I introduced a persistent, contextual action button that surfaced whatever the most important next step was — save a setting, get help, complete a pairing process, confirm a selection. One button, one job, always in the same place, always relevant to where you are.

Simple in concept. Significant in practice. It gave the interface a consistent logic that users could learn once and apply everywhere.

**Designing for what comes next**

The less visible decision on Touch 2 was designing the interface architecture to be extensible. At the time, remote sensors and the EIM weren't in scope. I built the UI framework so those features could be added without breaking the existing structure.

They were added later. They fit cleanly. That's the goal.

**Hardware and software, decided together**

I was involved from the industrial design evaluation phase — running testing, observing, and feeding back on how different hardware form factor concepts affected the UI. On a touchscreen product, the physical and digital decisions aren't separate problems. I was the connection between them.

The Touch 2 also became the industry's thinnest smart thermostat at .77" — a hardware constraint that shaped every UI decision about information density and touch target sizing. And it was the first smart thermostat to win a JD Power award, external validation that the balance between capability and usability landed where it needed to.

The Touch 2 patterns later informed consulting work with Trane's internal design team on their premium touchscreen thermostat — a signal that the work held up outside our own product line.`,
      imageAlt: 'ID evaluation session with Touch 2 prototypes on a table',
      imageSrc: '/images/hw-touch2.jpg',
      imageLayout: 'portrait',
      imagePosition: 'left',
    },
    {
      id: 'eim',
      title: 'EIM',
      subtitle: 'Solving a problem by moving it somewhere better.',
      body: `The Equipment Interface Module is designed to work with both indoor and outdoor HVAC equipment — a flexibility most EIMs don't offer. The configuration challenge: how does a contractor tell the EIM what kind of equipment it's connected to?

The obvious answer — configure it at the unit — requires traveling back and forth between the thermostat and the equipment. In a typical installation that means multiple trips, often up and down stairs, often in tight mechanical spaces.

I moved the configuration to the thermostat.

Through a simple pairing and configuration flow, the contractor sets the equipment location and type from the thermostat, once, without leaving. The EIM receives that information and configures itself accordingly.

The product context makes the scale of that decision clearer: 44% of homes have four wires or fewer, but heat pump installations require six. The EIM was built for that gap. And where the leading competitor shipped three separate modules to cover the same use cases, the Sensi EIM did it with one.

Contractors noticed immediately. In field training sessions following launch, two separate distributor groups called out the pairing process independently — specifically that configuring from one location, without going back and forth to press buttons, was what they appreciated most. The launch webinar drew over 180 contractors. That's the design decision validated in the field, by the people it was built for.

Sometimes the best UX is the one that makes you forget you did any UX at all.

**Patent: US 12,608,066**

When power stealing from the HVAC system is lost, the EIM and Sensi Lite face a choice: show an on-device error, or blank the display and surface device state to the mobile app. I designed the UX logic and notification flow behind that decision. It's the subject of US Patent 12,608,066, awarded April 2026.`,
      imageAlt: 'Equipment Interface Module product photo',
      imageSrc: '/images/devices/eimpath.svg',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'sensi-lite',
      title: 'Sensi Lite',
      subtitle: '32 segments. 3 buttons. A full thermostat experience.',
      body: `The Sensi Lite was the most constrained product I've worked on. Display: 32 segments. Input: three buttons — up, down, menu/action. Mandate: a complete thermostat experience for a budget-tier product.

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

I don't tell these stories to relitigate the decisions. I tell them because they changed how I work. I now document testing rationale and design decisions more rigorously so the reasoning is on record regardless of what gets decided. If you're going to lose an argument, lose it with evidence.`,
      imageAlt: 'Sensi Lite thermostat prototype, three-quarter view on black',
      imageSrc: '/images/sensi-lite-tilted.png',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'verdant',
      title: 'Verdant',
      subtitle: 'Designing for hospitality, distance, and every language at once.',
      body: `The Verdant VX4 and Line Voltage thermostats serve the hospitality market — a fundamentally different audience than a homeowner. Hotel guests speak different languages, have varying levels of tech familiarity, and interact with the thermostat once rather than repeatedly over years. The design has to communicate immediately, to anyone, without instruction.

The Line Voltage thermostat for the European market pushed this further: text wasn't a reliable tool. I replaced text labels with iconography throughout — a visual language that communicates function without relying on any single language. An icon either communicates or it doesn't. There's no copy to cover for it.

**A custom character set, designed for distance**

Standard 7-segment displays prioritize simplicity of manufacture over legibility. I designed a high-density segment character set from scratch — angled slices and a flexible grid geometry that renders numbers with far greater clarity at distance, while retaining enough flexibility to display the full alphanumeric character set for status messages and configuration labels.

The primary use case: a guest reading the temperature from across a hotel room. The character set was designed around that moment. It's the subject of a pending US patent.`,
      imageAlt: 'Custom segment character set showing full alphanumeric range in orange on black',
      imageSrc: '/images/Segment_Drawing.jpeg',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
  ],
}

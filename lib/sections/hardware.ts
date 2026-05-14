// lib/sections/hardware.ts
import type { Section } from '../types'

export const hardware: Section = {
  id: 'hardware',
  label: 'Hardware',
  eyebrow: 'Case Study — Hardware',
  headline: 'The interface has to\ndo the hard work.',
  overviewBody: `Designing for hardware is a different problem than designing for screens. Over several product cycles at Copeland, I led UX across five thermostat products — each with its own constraint profile, audience, and set of tradeoffs. From a 1728px touchscreen to 32 segments and 3 buttons.

I'm a named inventor on US Patent 12,608,066 for power loss management, and have a second patent pending for a custom segment display character set.`,
  pullQuote: 'The interface has to do the hard work so the person using it doesn\'t.',
  lessonTitle: 'What hardware\nteaches you.',
  lessonBody: `Designing for hardware strips away the safety nets. You can't push an update to fix a confusing menu on a shipped thermostat. You can't add a tooltip to a 32-segment display. The decisions you make are the decisions users live with.

That pressure is clarifying. It makes you more deliberate about every choice, more rigorous about validation, and more honest about the difference between what you prefer and what actually works.

It also makes everything else feel a little more spacious.`,
  chapters: [
    {
      id: 'touch-2',
      title: 'Sensi Touch 2',
      subtitle: 'Inheriting a touchscreen that didn\'t know it was a touchscreen',
      body: `When I came onto Touch 2, the existing interface was replicating the visual language of the fixed segment thermostat next to it in the product line — safe, familiar, wrong.

A touchscreen isn't a fixed segment display with more pixels. It's a different contract with the user entirely.

I kept the core menu architecture. I changed the visual language, the interaction model, and introduced a persistent, contextual action button: one button, one job, always in the same place. The less visible decision was designing the architecture to be extensible. Remote sensors and the EIM weren't in scope. I built the UI framework so they could be added without breaking existing structure. They were added later. They fit cleanly.`,
      imageAlt: 'ID evaluation session with Touch 2 prototypes on a table',
      imageSrc: '/images/hw-touch2.jpg',
      imageLayout: 'portrait',
      imagePosition: 'left',
    },
    {
      id: 'eim',
      title: 'EIM',
      subtitle: 'Solving a problem by moving it somewhere better',
      body: `The Equipment Interface Module supports both indoor and outdoor HVAC equipment. The configuration challenge: how does a contractor communicate equipment type without traveling back and forth between thermostat and unit?

I moved the configuration to the thermostat. Through a simple pairing flow, the contractor sets location and equipment type once, without leaving. The EIM configures itself accordingly. Contractors noticed immediately.

Patent US 12,608,066 covers the resulting power management behavior: blanking the display and surfacing device state to the mobile app rather than showing an on-device error when power stealing is lost.`,
      imageAlt: 'Contractor reviewing EIM device in discussion with Copeland team',
      imageSrc: '/images/hw-eim.jpg',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'sensi-lite',
      title: 'Sensi Lite',
      subtitle: '32 segments. 3 buttons. A full thermostat experience.',
      body: `The most constrained product I've worked on. 32 segments. Three buttons: up, down, and menu/action.

Navigation stayed flat and cyclical. The menu/action button serves triple duty: standard press advances, long press enters homeowner settings, second long press reaches contractor configuration — accessible to the people who need it, invisible to those who don't.

With flat navigation, sequence is logic. I ordered settings based on conditional dependencies so users answer questions only when they have context.

Two design positions didn't survive stakeholder review. Post-launch data proved them right.`,
      imageAlt: 'Sensi Lite 32-segment display showing thermostat UI',
      imageSrc: '/images/hw-sensilite.jpg',
      imageLayout: 'landscape',
      imagePosition: 'left',
    },
    {
      id: 'verdant',
      title: 'Verdant',
      subtitle: 'Designing for hospitality, distance, and every language at once',
      body: `The Verdant VX4 and Line Voltage thermostats serve the hospitality market — guests who speak different languages, interact with the thermostat once, and read it from across a hotel room.

The Line Voltage thermostat for the European market pushed further: I replaced all text labels with iconography. An icon either communicates or it doesn't.

To support the Verdant display, I designed a high-density segment character set from scratch — angled slices with flexible geometry that renders numbers with far greater clarity at distance. Pending US patent.`,
      imageAlt: 'Custom segment character set showing full alphanumeric range in orange on black',
      imageSrc: '/images/hw-verdant.jpg',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'trane',
      title: 'Trane',
      subtitle: 'Designing inside someone else\'s house',
      body: `The Trane budget-tier thermostat was built under an OEM arrangement. Two stakeholder sets, two priority sets, a product shipping under someone else's name. I designed the complete UI.

The brand stayed Trane's. Working within their visual language surfaced most concretely in iconography — fixed segment displays have no room for ambiguity.

Trane's thermostats include a motion sensor our products don't have. Getting deep into how it worked seeded thinking about how motion sensing could integrate into our own product line.`,
      imageAlt: 'Verdant VX4 PCB and display hardware',
      imageSrc: '/images/hw-trane.jpg',
      imageLayout: 'portrait',
      imagePosition: 'right',
    },
  ],
}

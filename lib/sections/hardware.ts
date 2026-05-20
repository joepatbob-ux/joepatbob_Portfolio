// lib/sections/hardware.ts
import type { Section } from '../types'

export const hardware: Section = {
  id: 'hardware',
  label: 'Hardware',
  eyebrow: '',
  headline: 'The interface has to do the hard work.',
  overviewBody: `Designing for hardware is a different problem than designing for screens. Over several product cycles at Copeland, I led UX across thermostat products, each with its own constraint profile, audience, and set of tradeoffs. From a 1728px touchscreen to 32 segments and 3 buttons. Two patents came out of this work.`,
  pullQuote: 'The interface has to do the hard work so the person using it doesn\'t.',
  lessonTitle: 'What hardware teaches you.',
  lessonBody: `Designing for hardware strips away the safety nets. You can't push an update to fix a confusing menu on a shipped thermostat. You can't add a tooltip to a 32-segment display. The decisions you make are the decisions users live with.

That pressure is clarifying... it makes you more deliberate, more rigorous, more honest about the difference between what you prefer and what actually works.

It also makes everything else feel a little more spacious.`,
  chapters: [
    {
      id: 'sensi-lite',
      title: 'Sensi Lite',
      subtitle: 'Physical prototype — 32 segments, three controls, one enclosure.',
      body: `That's the full constraint profile. Navigation stayed flat and cyclical. The menu/action button serves triple duty: standard press moves you forward, long press gets you into homeowner settings, another long press gets you into contractor territory — the people who need it know to look, everyone else never thinks to.

In a flat menu, order does the work that hierarchy can't. I ordered settings based on conditional dependencies so users answer questions only when they have context.

One decision that didn't survive stakeholder review: I wanted the menu button on the opposite side of the display from the up/down controls. The buttons are capacitive with no tactile click, so physical separation reduces accidental triggers. Stakeholders pushed back. Grouping the menu button between up/down was simpler to engineer and matched layouts from previous models that used physical buttons. We ran paper user tests. Favorability difference was negligible. We went with the option that reduced engineering complications.

Post-launch, we started seeing field reports of mis-taps. With the layout fixed, adjusted the tap sensitivity in firmware until the buttons behaved the way the layout should have.

One constraint runs beneath all of it: Sensi Lite runs on power-stealing from a 2-wire system — no common wire, no stable supply. When power drops below threshold, the device sheds capability in sequence. The display goes dark. A blank screen with no explanation looks like a dead device. The solution: the device notifies the cloud before Wi-Fi goes down, which pushes an alert to the homeowner's phone. The screen is dark, but the app already told you why. US Patent 12,608,066.`,
      imageAlt: 'Sensi Lite thermostat prototype, three-quarter view on black',
      imageSrc: '/images/sensi-lite-tilted.png',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'touch-2',
      title: 'Sensi Touch 2',
      subtitle: 'Inheriting a touchscreen that didn\'t know it was a touchscreen.',
      body: `The original Touch thermostat was designed to work like the fixed segment display next to it in the product line: mode, fan, and schedule buttons along the bottom, up/down and menu controls to the right. Treating a touchscreen like a high-res segment display misses the point of having one.

When I came onto Touch 2, the first thing I changed was the interaction model. Mode and fan controls collapsed into a single quick-action — because that's the actual behavior: users change mode and fan together, or in immediate sequence. Separating them into discrete buttons was a holdover from hardware constraints that no longer applied. I also unified the menu structure so the purpose of each screen was obvious without digging around.

The longer payoff came from a decision that wasn't on the feature list. When we added a 900MHz radio for remote sensor support, we didn't know what future accessories would follow. So I designed the pairing flow to be simple and repeatable — familiar enough that firmware could reuse the pattern and users would recognize it regardless of which accessory was being added. The EIM came later. The pairing flow fit cleanly without rework, even though the EIM is exclusively contractor-facing and the remote sensor is homeowner-facing — same pattern, two very different people on either end of it.`,
      imageAlt: 'ID evaluation session with Touch 2 prototypes on a table',
      imageSrc: '/images/hw-touch2.jpg',
      imageLayout: 'portrait',
      imagePosition: 'left',
    },
    {
      id: 'eim',
      title: 'EIM',
      subtitle: 'The thermostat does the talking so the contractor doesn\'t have to do the walking.',
      body: `Contractors work in awkward places. Furnaces in basements, compressors outside at the unit, thermostat on the wall somewhere in between. The EIM was Copeland's first Equipment Interface Module, a dual-use unit supporting both indoor and outdoor equipment. Standard pairing required walking to the unit to initiate a process, then walking back to the thermostat to complete it, sometimes multiple trips if the timing didn't line up.

We started the pairing process automatically at boot, so by the time the contractor reached the thermostat, the EIM was already announcing itself. The entire pairing flow, including assigning the unit as indoor or outdoor, happened at the thermostat in a single pass.

We ran an EIM roadshow: live sessions with contractors, hands-on pairing, open feedback. Contractors who had configured HVAC equipment for years noticed without prompting that something that used to require multiple trips was just done at the thermostat. The configuration didn't go away. The contractor just never had to leave the thermostat to do it.`,
      imageAlt: 'Equipment Interface Module product photo',
      imageSrc: '/images/Devices/eimpath.svg',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'verdant',
      title: 'Verdant',
      subtitle: 'Numbers can be delightful too.',
      body: `The hospitality market puts a specific kind of pressure on a thermostat. A guest interacts with it once, from across the room, in a language it may not share. It needs to communicate clearly before anyone walks over to touch it.

Customers wanted something that felt premium. The economics pushed back. Fixed segment displays keep cost down in a way LCDs don't, and that tradeoff wasn't going away. The real question was whether a segment display could be designed to not look like one.

Standard 7-segment can't get there. The numerals are recognizable but crude, and distance makes it worse. The 7 is ambiguous. The 1 sits right-justified in its cell, throwing off spacing across multi-digit numbers.

So I designed a new character set from scratch. In a 4-multiplexed display, four segments share a single pin. Add segments to improve a character and you add pins, which adds complexity to the display driver, which adds cost. The display also has to carry a lot beyond temperature digits: mode indicators, fan status, occupancy state, connectivity, battery level, demand response alerts, scheduler status. Every segment added to the character set competes directly with everything else the display needs to show. The design problem wasn't just how characters should look. It was how to get the most legibility out of 21 segments per character while leaving enough headroom in the pin budget for the rest of the display to function.

The answer was angled geometry, sliced forms that break from the horizontal and vertical rigidity of standard 7-segment. The 7 reads cleanly. The 1 centers in its cell. The result reads closer to an LCD without the cost of one. A pending US patent covers the character set.`,
      imageAlt: 'Custom segment character set showing full alphanumeric range in orange on black',
      imageSrc: '/images/hw-verdant.jpg',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
  ],
}

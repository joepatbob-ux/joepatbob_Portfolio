// lib/sections/everything-else.ts
import type { Section } from '../types'

export const everythingElse: Section = {
  id: 'everything-else',
  label: 'Everything In Between',
  eyebrow: 'About',
  headline: 'Joseph Patrick\nRoberts.',
  overviewBody: `Principal Product Designer working at the intersection of hardware and software. Brand-trained. St. Louis-based.

Location: St. Louis, MO · Email: me@joepatbob.com · Patents: 1 awarded · 1 pending`,
  pullQuote: 'Our job is to do the hard work\nso users don\'t have to.',
  lessonTitle: 'Direct,\ncollaborative,\nnot precious.',
  lessonBody: `I'm collaborative by nature and direct by preference. I'll push back when I think something is wrong, and I'll document why — but I'm not precious about outcomes. The goal is a better product, not a preserved opinion.

I bring brand thinking, systems thinking, and a genuine interest in the constraints that make design problems interesting. Hardware constraints. Regulatory requirements. OEM relationships. Budget tiers. These aren't obstacles — they're the brief.

If that sounds like the kind of designer you're looking for, let's talk.

me@joepatbob.com`,
  chapters: [
    {
      id: 'who',
      title: 'Who I am',
      subtitle: 'Brand-trained, product-tempered.',
      body: `I'm a Principal Product Designer with a background in brand design that never really went away. I started in brand, identity, packaging, print — and carried those instincts into product design when I made the switch. The through-line is the same: every touchpoint is part of the experience, whether it's the app, the device, the packaging it shipped in, or the email a support agent sends when something goes wrong.

I now design primarily at the intersection of hardware and software — thermostats, embedded displays, mobile apps, and the web applications that tie them together. It's a domain where the physical and digital decisions are inseparable, and where the stakes of getting it wrong are real. You can't push an update to fix a bad button placement on a shipped thermostat.`,
      imageAlt: 'Joseph Patrick Roberts',
      imageSrc: undefined,
      imageLayout: 'portrait',
      imagePosition: 'right',
    },
    {
      id: 'thinking',
      title: 'How I think about design',
      subtitle: 'Form, function, and foolproofing.',
      body: `Our job is to do the hard work so users don't have to. I keep that close. Design isn't about imagining an ideal user in an ideal situation. It's about accounting for the full range of people who will actually use what you make — including the ones who will use it in ways you never anticipated.

I think of design as the place where art meets functionality. Form and function aren't in opposition — the best design is where they become indistinguishable.

I also believe UX extends well beyond the product itself. The way a company prices its products is a UX decision. The way a support agent talks to a frustrated customer is a UX decision. The packaging a product ships in is a UX decision. I advocate for experience thinking at every point in the company, not just the parts with pixels.`,
      imageAlt: 'Design thinking principles',
      imageSrc: undefined,
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'principles',
      title: 'What I believe',
      subtitle: 'Four working principles.',
      body: `01 — If it's worth buying, it sells itself.
Good products don't need tricks. They need to work.

02 — Value flows from the user up, not the boardroom down.
A product makes money because someone found it worth paying for. That's the direction that matters.

03 — Our job is to do the hard work so users don't have to.
Complexity doesn't disappear — it just moves. It should move toward us, not them.

04 — It's okay to move the cheese, as long as you put it somewhere better.
Change isn't the problem. Disorienting change is.`,
      imageAlt: 'Four working principles',
      imageSrc: undefined,
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'background',
      title: 'Background',
      subtitle: 'How I got here.',
      body: `I came up through brand design — identity systems, packaging, print — before moving into product design. That background shows up in how I think about visual communication, typographic hierarchy, and the full lifecycle of a product experience beyond the screen.

At Copeland I've shipped five thermostat products across touchscreen, fixed segment, hospitality, and OEM contexts. I'm a named inventor on US Patent 12,608,066 for power loss management in smart thermostats, and have a second patent pending for a custom segment display character set designed for distance legibility.

Patents: US 12,608,066 — Low Power Detection (Awarded · 2026) · Segment display character set (Pending)

I'm based in the St. Louis area.`,
      imageAlt: 'Background and experience',
      imageSrc: undefined,
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'in-between',
      title: 'Everything in between',
      subtitle: "The work that doesn't fit in a case study.",
      body: `Not everything worth doing fits a case study format. These are the things I do because they make the work — and the people doing it — better.

The demo kit. The sales team needed to demo the Sensi thermostat at client sites where finding a power outlet wasn't a given. So I built a portable kit — single-board power, Sensi-branded foam-cut case, thermostat and remote sensor mounted and ready to go. It worked well enough that official versions were commissioned for the whole sales team.

Launch swag. Every major feature launch or product release deserves a moment. I design stickers and shirts to mark them — not as marketing collateral, but as artifacts for the team. Something physical that says "we shipped this."

Headshots, sorted. Consistent professional headshots matter, for the company's presence and for the people in it. I've run multiple corporate headshot sessions at the office so that everyone has a photo that looks like it belongs to the same organization.

Feed the engineers. During our company homecoming, I organized a crawfish boil for the software development team. There's no UX rationale here. Sometimes you just feed people. It turns out that's also collaboration.

Inspiring Horizons. Copeland runs an outreach program — volunteering in the community, showing up for organizations that need hands. We've sorted donated clothing at the Little Bit Foundation and volunteered at food banks across the St. Louis area. Good design solves problems for people. So does showing up on a Saturday morning to sort kids' shoes.`,
      imageAlt: 'Portable Sensi demo kit with branded foam-cut case',
      imageSrc: '/images/img-demo-kit.jpeg',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
  ],
  closingQuote: {
    quote: 'Our job is to do the hard work\nso users don\'t have to.',
    attribution: 'Joseph Patrick Roberts',
  },
}

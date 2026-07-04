---
{
  "id": "verdant",
  "title": "Verdant",
  "subtitle": "Designing for guests who will never be onboarded.",
  "imageAlt": "Custom segment character set showing full alphanumeric range in orange on black",
  "imageSrc": "/images/Segment_Drawing.jpeg",
  "imageLayout": "full-width",
  "imagePosition": "left"
}
---

The Verdant VX4 and Line Voltage thermostats serve the hospitality market — a fundamentally different context than residential. Hotel guests speak different languages, arrive with different levels of technical familiarity, and interact with the thermostat once rather than over years. There is no onboarding, no help text a guest will read, no learning curve. The interface has to communicate immediately, to anyone, or it fails.

**Text was not a reliable tool.**

The Line Voltage thermostat for the European market pushed this further. Text could not carry the language range the product had to serve, so I replaced labels with iconography throughout — a visual language built entirely around function. An icon either communicates or it does not, and there is no copy underneath to cover for ambiguity.

**The character set had to work from across a hotel room.**

Standard 7-segment displays are optimized for manufacturing simplicity, not legibility, and reading a temperature from across a room is a different problem than reading it up close. I started by researching standard and non-standard fixed-segment forms, then mapped ideal numerals in Lato — the same typeface used in Sensi Touch 2, where it had already proven itself. Working on transparency paper, I overlaid every digit to find common points and cut lines, then reduced the total segment count by identifying where segments always appear together and could be treated as one. That reduction required concessions in less common letterforms like W and Q; user testing confirmed those edge cases were legible enough for the contexts where they appeared.

**The testing had to match the room.**

The final candidates went to A/B testing on PCB prototypes from our supplier, in a large room simulating hotel scale — roughly 15 to 20 feet of viewing distance, with participants who had no familiarity with the product. We varied lighting, displayed random text, and measured both read accuracy and aesthetic preference across versions. The character set that came out of it is the subject of a pending US patent, with the novel claim at the intersection of segment geometry and the reduction method.

**Knowledge should not stay trapped in one product line.**

The wireless protocol developed for Verdant's hardware found its way into Sensi's room sensor architecture — not because the products share an ecosystem, but because the problem was the same and the work already existed. Expertise built in one context is an asset everywhere the same problem shows up, and the organizational cost of siloing it by product line is real.

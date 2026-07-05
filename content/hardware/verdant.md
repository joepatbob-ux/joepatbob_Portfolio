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

The Verdant VX4 and Line Voltage thermostats serve the hospitality market, which is a different world from residential. Hotel guests speak different languages, bring wildly different comfort with technology, and touch the thermostat once instead of living with it for years. There is no onboarding, and no help text a guest will stop to read. The interface has to land immediately, with anyone, or it has failed. This is lean-back design in the literal sense: read from across the room, understood at a glance, operated without instruction.

**Text was not a reliable tool.**

The Line Voltage model for the European market pushed that further. Text could not stretch across the range of languages the product had to serve, so I dropped labels and built the interface out of icons instead, a visual language tied entirely to function. An icon either reads or it does not, and there is no caption underneath to bail it out.

**The character set had to work from across a hotel room.**

Standard 7-segment displays are drawn for manufacturing, not for reading, and reading a temperature from across a room is a different problem than reading it up close. I started by studying existing segment forms, both standard and non-standard, then drew ideal numerals in Lato, the same typeface we already used in Sensi Touch 2. On transparency paper, I overlaid every digit to find the points and cut lines they shared, then pulled the segment count down by spotting segments that always fire together and treating them as one. That cost me some accuracy on the rarer letterforms, like W and Q, but testing showed they stayed legible in the places they actually turned up.

**The testing had to match the room.**

The finalists went to A/B testing on PCB prototypes from our supplier, in a room big enough to stand in for a hotel: 15 to 20 feet of viewing distance, with participants who had never seen the product. We changed the lighting, put random text on the displays, and measured both how accurately people read them and which versions they simply preferred. The character set that came out of it is the subject of a pending US patent, with the novel claim sitting where the segment geometry meets the reduction method.

**Knowledge should not stay trapped in one product line.**

The wireless protocol we built for Verdant's hardware later turned up in Sensi's room-sensor architecture. Not because the two products share an ecosystem, but because the underlying problem was identical and the work already existed. When the same problem surfaces in two places, expertise from one is worth reaching for, and walling it off by product line carries a real cost.

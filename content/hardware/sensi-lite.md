---
{
  "id": "sensi-lite",
  "title": "Sensi Lite",
  "subtitle": "Thirty-two segments, three buttons, nowhere to hide.",
  "imageAlt": "Sensi Lite thermostat prototype, three-quarter view on black",
  "imageSrc": "/images/sensi-lite-tilted.png",
  "imageLayout": "full-width",
  "imagePosition": "left"
}
---

Sensi Lite is the most constrained product I've worked on. Thirty-two display segments, three buttons, and a brief for a complete thermostat experience that still had to feel premium. With three inputs, hierarchy is too expensive, so navigation stays flat and cyclical. The menu button does different jobs depending on how you press it: a normal press advances, a long press opens homeowner settings, a second long press reaches contractor config. That keeps the settings that can break an HVAC system within reach for installers and out of the way for everyone else. When order does the work a menu usually would, sequencing matters, so I ordered settings by dependency. Heat-pump setup leads straight into reversing-valve direction, most common config first.

Thirty-two segments doesn't leave room for icons, so every label has to earn its space. "OFF" is one of the words I leaned on hardest: short enough to fit, plain enough to read at a glance, and flexible enough to reuse across different screens instead of needing a dedicated symbol per context.

Sensi Lite also runs on power stolen from the HVAC system. When power drops too low for the display, the device still has to communicate state. I helped work out a prioritized shutdown sequence and a notification flow that pushes state to the phone, so the app stands in when the thermostat can't. That low-power detection method is US Patent 12,608,066.

**Weighing UX risk against engineering risk**

During testing, people were split on where the menu button should sit relative to the up/down arrows. I raised a mis-tap concern about the option we ended up shipping, but the trade-off favored less engineering risk at the time. Customer service feedback after launch surfaced the same issue. The fix ended up being a firmware adjustment to the capacitive button's debounce and sensitivity, not a layout change. A reasonable call going in doesn't mean it's the right call once real usage data shows up, and it's worth revisiting either way.

---
{
  "id": "wr-connect",
  "title": "WR Connect",
  "subtitle": "The right protocol for the moment.",
  "headline": "Greenfield design for a high-stakes technical audience.",
  "imageAlt": "WR Connect app — NFC configuration flow for ignition control board",
  "imageLayout": "full-width",
  "imagePosition": "left"
}
---

WR Connect started from nothing: no legacy to inherit, no existing users to keep happy, no design debt. The problem was hard enough without any of that.

Its users are contractors setting up ignition control boards under time pressure, usually in a cramped mechanical space, on equipment that cannot even be powered up until the configuration is right. A bad interaction here does not just annoy someone; it can damage components and send the contractor back for an unpaid return visit. The traditional way to configure these boards is DIP switches and cryptic three-digit codes printed on the board, documentation written for engineers, and the technician standing at the unit, where one wrong setting can fry something before the system ever runs.

**The installation state defined the interaction model.**

Because HVAC systems sit unpowered during installation, anything that needed a live board was off the table. That ruled out Bluetooth for initial setup and pointed straight at NFC. The flow ended up simple: a big Read button pulls the current configuration off the board, the settings show up as a plain list you can edit, and a Write button pushes the new configuration back over NFC. No power, no DIP switches, no three-digit codes. All the complexity that used to live on the board moved into the app, where a contractor can get it right before anything touches hardware.

**Not every contractor needs the beginner path.**

For repeat jobs, the app keeps saved profiles, some shipped by Copeland and some the contractor builds. Someone who installs the same board all week can skip the Read entirely and write a known configuration straight to it. A technician who already knows exactly what to change can do the same. The app carries all three paths without pushing everyone through the one built for a first-timer.

**One tool across configuration and diagnostics.**

Copeland makes replacement boards for most of the competitor models a contractor runs into, and WR Connect drives all of them, so it is the same tool no matter what is being swapped in. Once the system powers on, Bluetooth opens a diagnostic channel, and the app that just configured the board can watch it run: live fault codes, system status, operating data. The board gets one tool for setup and another mode for diagnostics, each on the protocol that fits the moment.

WR Connect won Gold for Most Valuable App at the 2023 ACHR News Dealer Design Awards. The better signal came later: the core functionality was folded into Copeland Mobile, the broader platform for the whole product line. The standalone app was retired, but the work it proved out kept going.

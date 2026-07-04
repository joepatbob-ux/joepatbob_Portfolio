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

WR Connect was a blank canvas — no legacy to inherit, no existing users to protect, no accumulated design debt. The problem was hard enough on its own.

The audience: contractors configuring ignition control boards under time pressure, often in tight mechanical spaces, with equipment that cannot be powered on if the configuration is wrong. A bad interaction does not mean frustration — it means damaged components and a return visit the contractor does not get paid for. Traditionally, configuration runs through DIP switches and cryptic 3-digit codes on the board itself, requiring the technician to be physically at the unit with documentation written for engineers, where an incorrect setting can damage components before the system ever comes on.

**The installation state defined the interaction model.**

HVAC systems are off during installation, so any method requiring a powered board was eliminated — which ruled out Bluetooth for initial setup and pointed directly to NFC. The flow is straightforward by design: a prominent Read button pulls the current configuration off the board, settings appear as a simple list to change, and a Write button transfers the updated configuration back over NFC. No power required, no DIP switches, no cryptic codes. The complexity that lived on the physical board moved into the app, where it could be managed correctly before anything touched hardware.

**Not every contractor needs the beginner path.**

For repeat jobs, the app supports saved profiles — both predefined by Copeland and user-created — so a contractor who does the same board type regularly can skip the Read and write a known configuration directly. Experienced technicians who already know what needs changing can do the same. All three workflows are supported without forcing anyone through the one designed for the least experienced user.

**One tool across configuration and diagnostics.**

The boards cover a meaningful range of the market: Copeland produces replacement boards for most competitor models a contractor would encounter, and WR Connect is the common configuration interface across all of them — one tool regardless of what is being replaced. Once the system powered on, Bluetooth opened a diagnostic channel, so the same app that configured the board could now monitor it in real time: live fault codes, system status, operational data. One tool across two distinct phases of the technician's workflow, with a different protocol suited to each.

WR Connect won Gold for Most Valuable App at the 2023 ACHR News Dealer Design Awards. More telling: the core functionality was absorbed into Copeland Mobile, a broader platform serving the full product portfolio. The standalone app did not survive. The work did.

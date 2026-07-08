---
{
  "chapterId": "web-apps-kelvin-ds",
  "headline": "Modernizing without forcing disruption.",
  "subhead": "Four products across two domains, used by grocery operators, hotel managers, medical facility staff, and property managers — each with their own stakes, workflows, and appetite for change.",
  "ndaNote": "This work is under NDA. What's shown here is the rollout strategy and patterns validated in production, not the system itself."
}
---

Kelvin unifies four products that grew up separately — Sensi MTM (small-business HVAC), Verdant Thermostat Manager (hospitality), Copeland Connect+ (cold-chain retail), and Copeland TempTrak 6 (cold-chain medical/pharma) — each built by its own team, none talking to the others, all working well enough to keep running, which was exactly the trap: the cost of leaving them alone never shows up on a dashboard, while the cost of changing them is right there, especially where users have regulatory SOPs tied to specific screens (in TempTrak, redrawing a screen can trigger documented retraining and an SOP revision). Kelvin isn't a rebuild; it's a shared visual and interaction language — built on a themed shadcn foundation with custom components for alarm management, schedule configuration, and device status — that lets the four products drift toward consistency without any of them stopping to do it.

Because the usual design-system playbook (freeze features, migrate everything, relaunch) is too risky for regulated workflows, Kelvin ships on a parallel track: new, non-critical features get built in Kelvin and run next to the existing interface, so a component proves out in lower-stakes MTM before it's tuned for TempTrak's higher stakes. I used AI to turn out component documentation and stakeholder artifacts fast enough that alignment conversations happened while the system was still being built, though the judgment — what needed to exist, how it should behave, where the risk lived — stayed mine. The signal that it worked wasn't a screenshot; it was users who'd dug in against change starting to ask when the next piece ships.

---

**Why "if it ain't broke" was the rational move**

TempTrak's users are medical and pharmaceutical facility managers under regulatory oversight — their temperature logs are compliance documents, and acknowledging an alarm can be tied to SOPs that reference specific screens. The hardware raises the stakes further: temperature, humidity, and door sensors feed the system around the clock, so a UI change that trips up a monitoring workflow can open a gap in the chain of custody for materials that can't be compromised. Getting it wrong here doesn't cost a bad review — it costs something real.

**Built in, not bolted on**

Kelvin bakes accessibility into the component level — dark mode, dynamic type, contrast compliance — rather than retrofitting it after the fact, alongside shared interaction patterns calibrated for each product's different stakes and production efficiency through reuse instead of parallel, inconsistent implementations.

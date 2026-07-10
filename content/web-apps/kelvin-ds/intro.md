---
{
  "chapterId": "web-apps-kelvin-ds",
  "headline": "Modernizing without forcing disruption.",
  "subhead": "Four products across two domains, used by grocery operators, hotel managers, medical facility staff, and property managers — each with their own stakes, workflows, and appetite for change.",
  "ndaNote": "This work is confidential. What's shown here is the rollout strategy and patterns validated in production, not the system itself."
}
---

Kelvin unifies four products that grew up apart: Sensi MTM in small-business HVAC, Verdant Thermostat Manager in hospitality, Copeland Connect+ in cold-chain retail, and Copeland TempTrak 6 in cold-chain medical and pharma. Each was built by its own team, none talking to the others, all working well enough to keep running. That was exactly the trap. The cost of leaving them alone never shows up on a dashboard, while the cost of changing them is right there in front of you, especially where users have regulatory SOPs tied to specific screens. In TempTrak, redrawing a screen can trigger documented retraining and an SOP revision.

So Kelvin isn't a rebuild. It's a shared visual and interaction language, built on a themed shadcn foundation with custom components for alarm management, schedule configuration, and device status, that lets the four products drift toward consistency without any of them stopping to do it. Instead of four teams each designing their own version of the same component, there's one to maintain and extend. Developers who move between products can assume how things behave instead of relearning each one, and research and customer feedback from one product actually informs decisions on the others instead of staying siloed.

The usual design-system playbook, freeze features and migrate everything and relaunch, is too risky for regulated workflows. Kelvin ships on a parallel track instead. As features roll out normally within each product, each one becomes a proof point I use to show stakeholders on the other products how their own similar features could benefit from moving to the shared component, so adoption spreads product by product instead of through a mandated migration. I used AI to turn out component docs and stakeholder artifacts fast enough that those conversations could happen quickly, though the judgment stayed mine. The signal that it worked wasn't a screenshot. It was users who'd dug in against change starting to ask when the next piece ships.

---

**The real challenge wasn't design, it was buy-in**

The efficiency case for Kelvin was never the hard part. The hard part was getting sign-off from PMs and engineering leads on products running different tech stacks, each with their own roadmap and no built-in incentive to absorb a shared component that wasn't built for their stack. That's an organizational problem as much as a design one, and it's the piece that actually decides whether a design system survives past its first few components.

**Why "if it ain't broke" was the rational move**

TempTrak's users are medical and pharmaceutical facility managers under regulatory oversight. Their temperature logs are compliance documents, and acknowledging an alarm can be tied to SOPs that reference specific screens. Temperature, humidity, and door sensors feed the system around the clock, so a UI change that trips up a monitoring workflow can open a gap in the chain of custody for materials that can't be compromised. Getting it wrong here doesn't cost a bad review. It costs something real.

**Built in, not bolted on**

Kelvin bakes accessibility into the component level, dark mode, dynamic type, contrast compliance, instead of retrofitting it later. Interaction patterns are calibrated for each product's different stakes, and reuse replaces parallel, inconsistent implementations.

---
{
  "number": "04",
  "heading": "It's okay to move the cheese, as long as you put it somewhere better.",
  "ndaNote": "The work is under NDA. What follows is the rollout strategy and the patterns validated in production."
}
---

The standard design system playbook — freeze features, migrate everything, relaunch — doesn't work for a user base with regulatory SOPs and hardware dependencies. The risk profile is too high and the organizational will for that kind of disruption doesn't exist.

Instead, Kelvin rolls out through a parallel track approach: small, non-critical features built in Kelvin running alongside the existing interface. Users can try them, give feedback, and continue using what they know. No forced migration. No retraining before the new experience has proven itself.

This strategy does something the big-bang approach can't: it generates cross-platform intelligence. A component validated in MTM — a lower-stakes HVAC management context — informs how the same component gets calibrated for TempTrak's higher-stakes environment. Shared patterns, validated at different risk levels, in sequence.

The feedback has been clear. Users aren't asking "why did you change things." They're asking for more, faster. Task completion is quicker — clearing alarms, setting defrost cycle schedules, managing configurations. The things that used to require navigating a tangle of overlapping paths now have a clear, direct route.

Moving the cheese worked because the new location is better. That's the only acceptable reason to move it.

**Alarm management**
Across cold chain products, alarm acknowledgment is a frequent, high-stakes task. The legacy interfaces handled it inconsistently depending on entry point and feature version. Kelvin establishes a single, predictable pattern that works the same way regardless of how you got there.

**Schedule configuration**
Setting defrost cycles, temperature schedules, and setpoint controls involves similar underlying logic across MTM, Verdant, and the cold chain products — but the legacy implementations looked and behaved differently in each. A shared scheduling component with product-appropriate configuration reduces cognitive load for users who operate across products and development effort for new schedule-related features.

**Sensor and device status**
Hardware status communication — connected, disconnected, alert, offline — appears across all four products. Kelvin standardizes how device state is communicated visually and behaviorally, so users develop reliable expectations regardless of which product they're in.

Kelvin is a foundation, not a finish line. As parallel track validation continues, the rollout will expand to more complex workflows — eventually including the SOP-critical flows in TempTrak that require the most careful transition planning.

The goal isn't a redesigned product. It's a portfolio that can keep evolving without accumulating the kind of debt that requires another ground-up intervention in five years.

What's visible is the outcome: customers asking for more of something they used to resist. That's the real before and after.

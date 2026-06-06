/** Structured copy for Web Apps — single Kelvin DS chapter. */

export const WEB_APPS_KELVIN_CHAPTER_ID = 'web-apps-kelvin-ds'

export const WEB_APPS_KELVIN = {
  headline: "Unifying Copeland's Product Suite.",
  subhead:
    "Building Kelvin — a design system for four products, two domains, and a user base that can't afford mistakes.",
  subStories: [
    {
      number: '01',
      heading: 'The Products',
      intro: '',
      products: [
        {
          name: 'Sensi MTM',
          domain: 'HVAC Management',
          description:
            'Bulk thermostat control for small businesses and property managers handling HVAC across many locations without visiting each one.',
        },
        {
          name: 'Verdant Thermostat Manager',
          domain: 'Hospitality HVAC',
          description:
            "The software backbone for hospitality properties. Hotel operators configuring room temperature schedules, managing setpoint limits, monitoring system status across a property. The legacy interface had three structural problems worth naming: content was dense and unmanageable without collapsible columns, actions were scattered across the UI rather than consolidated in a predictable location, and the layout didn't adapt across devices. Those three things became the design brief.",
        },
        {
          name: 'Copeland Connect+',
          domain: 'Cold Chain Retail',
          description:
            'Cold chain monitoring for grocery refrigeration. Operators monitoring units, receiving alerts, managing temperature compliance across store locations. Before any design work, I ran user discovery interviews to capture authentic operator experiences — understanding what they needed, where they succeeded, and where the existing UI created friction. That research directly shaped the Connect+ redesign direction and the initial prototypes for iterative testing.',
        },
        {
          name: 'Copeland TempTrak 6',
          domain: 'Cold Chain Medical',
          description:
            "Cold chain monitoring for medical and pharmaceutical refrigeration. The highest-stakes product in the portfolio — temperature excursions here don't mean spoiled food, they mean compromised vaccines, medications, and biologics.",
        },
      ],
      inertia: `The fragmentation wasn't careless. Each product was built to work — and it did, well enough to generate revenue, well enough to retain customers, well enough that proposing a significant UI investment always lost to the next feature request.

That's a specific organizational dynamic worth naming. When software is making money, the business case for fixing its UX is always harder to make than the business case for new capabilities. The cost of inaction is invisible. The cost of change is obvious. So nothing changes.

Year after year, features get bolted on through the path of least resistance. In TempTrak, this produced multiple ways to accomplish the same task — each one the remnant of a different team's solution to the same problem, all preserved because removing any of them might break someone's workflow. The UI accumulated complexity the way a city accumulates one-way streets: each decision made local sense, the aggregate made navigation unreasonable.`,
    },
    {
      number: '02',
      heading: 'These users cannot afford to be confused.',
      intro: `The stakes vary across the portfolio, but they're never low.`,
      complianceCallout: `In TempTrak, users are medical and pharmaceutical facility managers operating under regulatory oversight. Temperature logs are compliance documents. Alarm acknowledgment is a documented procedure. Their Standard Operating Procedures reference specific UI flows — which means a changed interface doesn't just require retraining, it potentially invalidates documented processes that exist for regulatory reasons.

The hardware integration compounds this. Temperature sensors, humidity sensors, door sensors — all feeding data into these systems. A UI change that disrupts a sensor workflow doesn't just frustrate a user, it creates a gap in the monitoring chain for materials that cannot be compromised.`,
      close: `This is why the "if it ain't broke" culture persisted. Caution made sense. The cost of being wrong wasn't a bad review — it was a cold chain failure in a medical facility.

Any modernization strategy had to account for all of this. Not work around it. Account for it.`,
    },
    {
      number: '03',
      heading:
        'Named for the man who figured out how to measure temperature.',
      intro: `The design system is called Kelvin — named for Lord Kelvin, whose foundational work on temperature measurement underpins the domain these products operate in.

Kelvin is built on a themed shadcn foundation with custom components developed for the specific interaction patterns that appear across the portfolio. The goal isn't visual homogeneity for its own sake — it's a shared language that makes each product feel like it belongs to the same family while serving its own user context.`,
      pillars: [
        {
          num: '01',
          label: 'Consistent visual language across all four products.',
          text: 'Typography, color, spacing, component behavior. A user moving between MTM and TempTrak should feel orientation, not disorientation.',
        },
        {
          num: '02',
          label: 'Shared interaction patterns for overlapping functionality.',
          text: 'Alarm management, schedule configuration, sensor status — calibrated appropriately for the different stakes of each context.',
        },
        {
          num: '03',
          label: 'Production efficiency for development.',
          text: 'Shared components mean less rebuilding, fewer inconsistencies introduced by parallel implementation, and a clearer path for future feature work.',
        },
        {
          num: '04',
          label: 'Accessibility built in from the component level.',
          text: "Dark mode, dynamic type, contrast compliance. The kind of thing that's expensive to add to custom components and free from a well-built system.",
        },
      ],
    },
    {
      number: '04',
      heading:
        "It's okay to move the cheese, as long as you put it somewhere better.",
      ndaNote:
        'The work is under NDA. What follows is the rollout strategy and the patterns validated in production.',
      body: `The standard design system playbook — freeze features, migrate everything, relaunch — doesn't work for a user base with regulatory SOPs and hardware dependencies. The risk profile is too high and the organizational will for that kind of disruption doesn't exist.

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

What's visible is the outcome: customers asking for more of something they used to resist. That's the real before and after.`,
      thesisClose: '',
    },
  ],
} as const

/** Structured copy for the Mobile case study (Sensi · WR Connect). */

export const MOBILE_SECTION_TABS = [
  { id: 'sensi', label: 'Sensi' },
  { id: 'wr-connect', label: 'WR Connect' },
] as const

export type MobileSectionId = (typeof MOBILE_SECTION_TABS)[number]['id']

export function mobileChapterId(sectionId: MobileSectionId): string {
  return `mobile-${sectionId}`
}

export const MOBILE_SENSI = {
  headline: 'The foundation, not the feature.',
  intro: `By the time I took ownership of the app design, it had the kind of UI you'd expect from a product that moved fast and prioritized shipping: functional, but patchy. Custom controls where system components would have worked fine. Patterns that made sense in 2017 and never got revisited. A design language that accumulated inconsistencies over years of one-off decisions.

The ratings reflected it. Around 4.3 stars. Not bad, but not a product people were excited about.

The first phase was a ground-up redesign: simplified thermostat control, a cleaner dashboard, consistent system states, a design language that actually felt intentional. Ratings climbed from 4.3 to 4.7 on iOS, 4.4 on Android.

Shipping the redesign was the easy part. Keeping it good over time — that's the harder problem.

**The platform migrations to SwiftUI on iOS and Material Expressive on Android were the opportunity to actually fix it.**

The practical reason: Apple and Google ship OS updates that change system behaviors, components, and visual defaults. Custom components don't get those updates automatically. System components do. For an app supporting hardware going back to 2014, that matters more than it does for most. Platform-native components absorb OS changes automatically — custom ones don't, and on a lean team that maintenance overhead compounds fast.

The design reason: system components bring a lot for free. Accessibility behaviors, dynamic type support, dark mode, haptic patterns, expected interaction models. Custom components have to earn all of that separately, and they often don't. Dark mode couldn't be a standalone project — the team was too lean and the backlog too real. Moving to platform-native made it a side effect: every migrated screen got dark mode as part of the deal, not as a separate pass.

There's a philosophy underneath this: users spend more time in other apps than they do in ours. It's in our interest to follow the patterns that already work. That bandwidth is better spent on the decisions that are genuinely unique to Sensi.

**How we're doing it**

This isn't a big-bang rewrite. Feature-freezing a shipping product to modernize everything at once isn't realistic, and it's nearly impossible to justify to stakeholders who see platform migration as cosmetic work.

The strategy is screen-by-screen: when a new feature touches a screen, that screen gets migrated. New work gets built in SwiftUI or Material Expressive from the start. Legacy screens get updated when there's a natural reason to open them.

To make sure feedback came from the right cross-section of users, I built a structured beta program with filtered recruiting — across OS, hardware tenure, control preference, and accessibility needs. Not just the loudest people who opt into betas. The improvement from 4.3 to 4.7 didn't happen by accident.

It's slower, but sustainable. Every migration is tied to something real rather than being pure overhead. Two birds, one stone, every time.`,
  subStories: [
    {
      heading: 'When the app and the device contradicted each other.',
      body: `The legacy app used full-screen color to communicate HVAC mode. Orange for heat, blue for cool, neutral for passive. The intent was right: mode state is important information, and making it ambient rather than buried in a label is good instinct.

The execution had three problems.

**The solution: move the color to the number.**

Instead of the background adopting the mode color, the displayed temperature adopts it. The information is still ambient — sitting on the most prominent element on the screen — but surgical rather than wholesale.

One change. Three problems solved. Accessibility contrast is predictable. Dark mode works without special casing. The app and the thermostat now speak the same visual language. A user who glances at their device and opens the app sees the same system communicating the same information.`,
      problems: [
        {
          label: 'Accessibility',
          text: 'A saturated orange or blue background creates contrast failures for text and UI elements sitting on top of it. WCAG compliance becomes a moving target when the background color is dynamic.',
        },
        {
          label: 'Dark mode',
          text: "There's no clean dark mode equivalent for a full-bleed orange screen. Desaturate it and it becomes unrecognizable. Leave it as-is and it doesn't work. Neither is acceptable.",
        },
        {
          label: 'Consistency',
          text: 'The Sensi Touch 2 thermostat already used a better visual language for mode communication — temperature numbers turning blue when cooling, orange when heating. Independent reviewers called it out specifically, noting it made it easier to know exactly when the HVAC was running. The app and the device were telling two different stories to the same user.',
        },
      ],
      scrubber: {
        beforeSrc: '/images/mobile-android-legacy-fullbleed-orange.png',
        afterSrc: '/images/mobile-android-v1-dark-orange-number.png',
        beforeAlt: 'Legacy full-bleed orange heat mode screen',
        afterAlt: 'Refined UI with mode color on the temperature number',
        caption: 'Drag — orange full-bleed vs. dark mode with color on the number',
      },
    },
    {
      heading: "Removing a button that was doing someone else's job.",
      body: `The installation flow is one of the highest-stakes experiences in the app. A homeowner selecting the wrong wires in the wirepicker — the screen where users identify which wires are connected to their thermostat — means the app infers the wrong equipment configuration. Getting it wrong has real consequences.

Which makes clarity here non-negotiable.

The legacy flow had two buttons at the bottom of every screen: Previous and Next — a pattern inherited from early mobile design.

Modern iOS and Android navigation already provides a reliable back action. It lives in the navigation bar at the top of every screen. Users expect it there. Adding a second back button at the bottom creates visual clutter, splits attention, and buries the primary action between two competing controls.

I removed Previous entirely.

With the redundant button gone, Continue became the clear primary action. The help link moved from a small text link buried below the buttons to a proper tappable action above Continue. The progress indicator moved into the native navigation bar, showing install step position without taking up screen real estate.

App Store reviewers picked up on it without prompting. One long-term user called out the step-by-step guidance as "a little touch that made me fall in love with it." That kind of feedback doesn't come from the interface getting out of the way by accident.

Users bring mental models from every app they've ever used. Fighting those models is expensive. Borrowing established platform patterns means reliable behavior for free — and the testing budget goes toward the decisions that actually need it.`,
    },
    {
      heading: "A content surface that couldn't feel like an ad.",
      intro: `Sensi partners with utility companies to offer energy demand-response programs — enroll and save money during peak usage hours. Good programs. Low enrollment because users had no reason to go looking for them inside the app.

There was also no good way to surface new features or products to existing users. The thermostat card wasn't the place for it.

Spotlight was the answer: a named, dedicated section on the home screen, separate from the thermostat card, carrying partner content, product news, and savings opportunities. New screen, built native from the start.

**The hard constraints**

The content isn't mine. Card copy is written by Copeland's marketing team in collaboration with energy partners. I don't control headline length, offer details, or partner logos. The design system has to handle all of that while still feeling like Sensi.

We lose the user at the tap. Learn More opens a partner-owned enrollment flow in an in-app browser. The card has one shot to inform and motivate before the handoff. It can't rely on the next screen to do any of the work.

And it can't feel like an ad. Sensi users trust the app to be a neutral utility tool. The moment Spotlight reads like a banner, that trust takes a hit.`,
      decisions: [
        {
          label: 'Named section',
          text: 'Spotlight is a named section, not injected into the existing feed. Users can see it, understand what it is, and choose to engage. The thermostat card stays untouched.',
        },
        {
          label: 'Partner attribution',
          text: "Partner logos sit at the top of every card. Users should know the offer is coming from their utility company, not from Sensi. Transparency builds more trust than white-labeling the content.",
        },
        {
          label: 'Consistent CTA',
          text: "The Learn More CTA is always the same style and position regardless of content type. Once you've tapped one Spotlight card, you know how all of them work. Expiration dates shown explicitly when relevant. No dark patterns.",
        },
        {
          label: 'Soft notification',
          text: 'A count badge on the section header acts as a soft notification — no push alert, but users get a signal when something new is waiting.',
        },
      ],
      testingHeading: 'What testing revealed',
      testingBody: `I tested the card design through iterative copy development and in-depth user interviews, running multiple rounds before launch. The biggest risk wasn't the design — it was the content. Working directly with energy partners to get the messaging right meant the cards communicated real program value rather than generic marketing copy. The result was content that informed without overselling, which is the only way a trust-dependent utility app can carry a content surface.`,
      closeBody: `Energy program enrollment increased measurably after launch. Specific numbers are under NDA.

The metric I watch most closely: app store ratings held. 4.7 iOS · 4.4 Android, flat through the Spotlight launch. For a content surface added to a utility app, no regression is a win. It means users didn't experience it as an intrusion.

Spotlight also created a repeatable integration path for future partners without needing to redesign anything. The system does the work.`,
    },
  ],
} as const

export const MOBILE_WR_CONNECT = {
  headline: 'Greenfield design for a high-stakes technical audience.',
  body: `Not all mobile work is maintenance. WR Connect was a blank canvas — no legacy to inherit, no existing users to protect, no design debt to carry. Just a hard problem and the freedom to solve it correctly.

The audience was different too. Not a homeowner who installs a thermostat once and opens the app twice a year. A contractor configuring ignition control boards under time pressure, often in tight mechanical spaces, with a system that cannot be powered on if the configuration is wrong. The stakes of a bad interaction aren't frustration — they're damaged equipment and a return visit.

The problem: configuration is traditionally done through dip switches or cryptic 3-digit codes on the board itself. Both methods require the technician to be physically at the board, potentially with the system live, reading documentation designed for engineers rather than installers.

There's a compounding risk: an incorrect configuration can damage components. The configuration has to be right before the system comes on, not after.

**The constraint that drove the solution**

HVAC systems are typically off during installation. Any configuration method requiring a powered board was a non-starter — that ruled out Bluetooth for initial setup and pointed directly at NFC.

NFC payload delivery let the contractor configure the board entirely from the app: guided, validated, error-checked, then transferred with a tap. No power required. No cryptic codes. No dip switches. The complexity moved from the physical board into the app, where it could be managed intelligently before anything touched hardware.

Once the system was powered, Bluetooth opened a diagnostic channel. The same app that configured the board could now monitor it in real time — live fault codes, system status, operational data. One tool, two phases of the technician's workflow, solving a different problem at each phase.

**How it landed**

WR Connect received a Gold Dealer Design Award from ACHR News. More telling: the core functionality was absorbed into Copeland Mobile, a broader platform serving the full product portfolio. The product didn't survive as a standalone app. The work did.`,
  imageAlt: 'WR Connect app — NFC configuration flow for ignition control board',
} as const

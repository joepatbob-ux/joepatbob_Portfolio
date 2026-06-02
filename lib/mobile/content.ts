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
  headline: "Don't just redesign.\nFix the foundation.",
  meta: [
    { label: 'Role', value: 'Principal Product Designer' },
    { label: 'Platform', value: 'iOS + Android' },
    { label: 'Timeline', value: '2018 – Present' },
    { label: 'Outcome', value: '4.3 → 4.7 iOS · 4.4 Android' },
  ],
  intro: `Sensi has been around for a while. By the time I took ownership of the app design, it had the kind of UI you'd expect from a product that moved fast and prioritized shipping: functional, but patchy. Custom controls where system components would have worked fine. Patterns that made sense in 2017 and never got revisited. A design language that accumulated inconsistencies over years of one-off decisions.

The ratings reflected it. Around 4.3 stars on the App Store. Not bad, but not a product people were excited about.

The first phase was a ground-up redesign of the core experience: simplified thermostat control, a cleaner dashboard, consistent system states, and a design language that actually felt intentional. It worked. Ratings climbed from 4.3 to 4.7 on iOS.

But shipping the redesign was the easy part. Keeping it good over time — that's the harder problem. The platform migrations to SwiftUI on iOS and Material Expressive on Android were the opportunity to actually fix the foundation. This isn't a big-bang rewrite. The strategy is screen-by-screen: when a new feature touches a screen, that screen gets migrated. Two birds, one stone, every time.`,
  subStories: [
    {
      heading: 'When a design decision breaks three things at once.',
      body: `The legacy app used full-screen color to communicate HVAC mode. Orange for heat, blue for cool, neutral for passive. The intent was right: mode state is important information, and making it ambient rather than buried in a label is good instinct.

The execution had three problems.

The solution: move the color to the number. Instead of the background adopting the mode color, the displayed temperature adopts it. Orange for heat. Blue for cool. Neutral for passive. The information is still ambient — sitting on the most prominent element on the screen — but it's surgical rather than wholesale. One change. Three problems solved.`,
      problems: [
        {
          label: 'Accessibility',
          text: 'A saturated orange or blue background creates contrast failures for text and UI elements that sit on top of it. WCAG compliance becomes a moving target when the background color is dynamic.',
        },
        {
          label: 'Dark mode',
          text: "There's no clean dark mode equivalent for a full-bleed orange screen. The color either has to be desaturated into something unrecognizable or left as-is. Neither works.",
        },
        {
          label: 'Brand consistency',
          text: 'The Sensi Touch 2 thermostat uses a different visual language for mode communication. The app and the device were telling two different stories to the same user.',
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
      body: `The installation flow is one of the highest-stakes experiences in the app. A homeowner selecting the wrong wires in the wirepicker means the app infers the wrong equipment configuration. Getting it wrong has real consequences.

The legacy install flow had two buttons at the bottom of every screen: Previous and Next. Modern iOS and Android navigation already provides a reliable back action — it lives in the navigation bar at the top of every screen. Adding a second back button at the bottom creates visual clutter, splits attention, and buries the primary action between two competing controls.

I removed Previous entirely.

With the redundant button gone, Continue became the clear primary action. The help link moved from a small text link buried below the buttons to a proper tappable action above Continue. The progress indicator moved into the native navigation bar, showing install step position without taking up screen real estate.

App Store reviewers picked up on the install experience without prompting.`,
      quote:
        'One long-term user specifically called out the step-by-step install guidance as "a little touch that made me fall in love with it."',
    },
    {
      heading: "A content surface that doesn't feel like an ad.",
      body: `Sensi partners with utility companies to offer energy demand-response programs. Good programs. Low enrollment because users had no reason to go looking for them inside the app.

Spotlight was the answer. A named, dedicated section on the home screen, separate from the thermostat card, that can carry partner content, product news, and savings opportunities.

The hard constraints: the content isn't mine. Card copy is written by Copeland's marketing team in collaboration with energy partners. I don't control the headline length, the offer details, or the partner's logo. The design system had to handle all of that while still feeling like Sensi. And it can't feel like an ad — Sensi users trust the app to be a neutral utility tool.

Energy program enrollment increased measurably after launch. App store ratings held at 4.7 iOS · 4.4 Android through the Spotlight launch. For a content surface added to a utility app, no regression is a win.`,
      decisions: [
        {
          label: 'Named section',
          text: 'Spotlight is a named section, not injected into the existing feed.',
        },
        {
          label: 'Partner attribution',
          text: "Partner logos sit at the top of every card — users should know the offer is coming from their utility company, not from Sensi.",
        },
        {
          label: 'Consistent CTA',
          text: 'The Learn More CTA is always the same style and position.',
        },
        {
          label: 'No dark patterns',
          text: 'Expiration dates are shown explicitly when relevant. No dark patterns.',
        },
      ],
    },
    {
      heading: 'What ongoing modernization actually looks like.',
      body: `The app is better than it was, and it keeps getting better. Not because of a single launch, but because the strategy creates steady compounding improvement over time.

Every feature that ships moves the codebase forward. Every screen that gets touched gets migrated. The debt doesn't accumulate the way it used to because the strategy doesn't allow for it.

When a dark mode rendering issue surfaced post-launch in the schedules view, it was resolved quickly. That's a direct benefit of the native component approach. Issues that would have required custom debugging in a bespoke component surfaced cleanly and fixed fast.`,
      thesisClose: `The goal isn't a spike in ratings. It's a product that stays current, feels native on both platforms, and doesn't need another ground-up redesign in five years. That's a harder thing to show in a portfolio than a single before/after. But it's a more honest picture of what good product design looks like at scale.`,
    },
  ],
} as const

export const MOBILE_WR_CONNECT = {
  headline: 'Greenfield design for a high-stakes technical audience.',
  meta: [
    { label: 'Product', value: 'WR Connect' },
    { label: 'Audience', value: 'HVAC technicians' },
    { label: 'Award', value: 'Gold Dealer Design Award' },
  ],
  body: `Not all mobile work is modernization. WR Connect was a greenfield product. No legacy to inherit, no existing users to protect, no design debt to pay down. Just a hard problem and a blank canvas.

The problem: configuring an ignition control board is traditionally done through dip switches or by cycling through cryptic 3-digit codes on the board itself. Both methods require the technician to be physically at the board, in an awkward position, with the system potentially live.

There's a compounding risk: you don't want to power on a misconfigured ignition control board. The configuration has to be right before the system comes on, not after.

HVAC systems are typically off during installation — any method requiring a powered board was a non-starter. That ruled out Bluetooth for initial setup and pointed directly at NFC.`,
  phases: [
    {
      label: 'Phase 1 — NFC',
      text: 'NFC payload delivery let the contractor configure the board entirely from the app: guided, validated, error-checked, then transferred with a tap. No power required. No cryptic codes.',
    },
    {
      label: 'Phase 2 — Bluetooth',
      text: "Once the system was installed and powered, Bluetooth opened a diagnostic channel. One tool, two phases of the technician's workflow, solving a different problem at each phase.",
    },
  ],
  award:
    'Gold Dealer Design Award · ACHR News · WR Connect NFC configuration flow.',
  imageAlt: 'WR Connect app — NFC configuration flow for ignition control board',
} as const

---
{
  "headline": "Updating the experience without disrupting the relationship."
}
---

When I took full ownership of Sensi, the app worked but showed it — custom controls where a platform component would've done better, patterns from 2017 nobody had revisited, ratings sitting at 4.3. The first phase was a ground-up redesign: cleaner thermostat control, a dashboard that held together, consistent system states. Ratings climbed to 4.7 iOS / 4.6 Android. Keeping it good since has been a matter of ongoing platform migration and testing at scale, done without ever pausing the product to do it.

Two decisions changed how the app feels day to day. The legacy app painted the entire screen orange/blue/neutral for HVAC mode, which broke contrast ratios, had no dark-mode equivalent, and contradicted the thermostat itself, which colors just the temperature number — moving the color onto the number fixed all three at once and finally matched app to hardware. And Spotlight: a named section for partner offers and utility savings programs, kept separate from the thermostat card, with explicit partner attribution and a consistent CTA position, so a promotional surface never reads as an ad on a tool people trust. Since launch, the permanent opt-out rate has dropped roughly 75–80% and held there, while taps into the enrollment flow have grown substantially, without moving App Store ratings (4.7 iOS / 4.6 Android).

**Removing a button that was doing someone else's job**

The legacy install flow put Previous and Next at the bottom of every screen, but iOS and Android already give reliable back navigation at the top, where people reach for it. Dropping Previous let Continue stand alone, moved the help link up as a real tappable target, and moved the progress indicator into the nav bar. One long-time reviewer called the resulting step-by-step guidance "a little touch that made me fall in love with it."

**Content I don't control**

Spotlight's content comes from Copeland's marketing team working with energy partners — I don't control headline length, offer framing, or partner branding, and each card gets one shot before handing off to a partner's own enrollment flow. So the design had to do the controlling: hold the line on "doesn't read as an ad" while still making the card worth a tap.

**Testing at a few million users**

With a few million active users, there's enough traffic to run real experiments — A/B tests and ranked-choice validation settle questions that would otherwise come down to whoever argued hardest. The beta program recruits deliberately across OS version, hardware generation, control preference, and accessibility needs, so decisions reflect the actual user base, not just its loudest slice.

**Migration as strategy, not a rewrite**

The SwiftUI and Material Expressive migrations weren't a fresh coat of paint — OS updates quietly change system behavior and defaults, and custom components sit those updates out while system components pick them up for free. For an app still supporting hardware back to 2014, that gap widens fast. I ran the migration screen by screen, tied to real feature work, so every step shipped alongside something a user asked for.

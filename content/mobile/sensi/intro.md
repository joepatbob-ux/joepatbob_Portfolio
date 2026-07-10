---
{
  "headline": "Updating the experience without disrupting the relationship."
}
---

When I took full ownership of Sensi, the app worked but it showed its age. Custom controls where a platform component would've done better, patterns from 2017 nobody had revisited, ratings stuck at 4.3. Phase one was a ground-up redesign: cleaner thermostat control, a dashboard that held together, consistent system states. Ratings climbed to 4.7 iOS and 4.6 Android.

Two decisions changed how the app feels day to day. The legacy app painted the whole screen orange, blue, or neutral for HVAC mode, which broke contrast ratios, had no dark-mode equivalent, and contradicted the thermostat itself, which only colors the temperature number. Moving the color onto the number fixed all three at once and finally matched app to hardware. Then Spotlight: a named section for partner offers and utility savings programs, kept separate from the thermostat card, with explicit attribution and a consistent CTA position, so a promotional surface never reads as an ad on a tool people trust. Since launch the permanent opt-out rate has dropped roughly 75 to 80% and held, taps into the enrollment flow have grown substantially, and App Store ratings haven't moved off 4.7 iOS and 4.6 Android.

**Modernizing without a modernization budget**

Sensi is the company's only consumer-facing product, and it doesn't get much room on the roadmap. Dev resources are lean and the instinct is "don't break what isn't broken," so outdated patterns stick around by default. Asking for dedicated modernization time was never realistic, so I stopped asking. Instead I tie platform migration to whatever feature is already approved: dropping the legacy Previous button in favor of native back navigation rode in alongside an install-flow update, and one long-time reviewer called the result "a little touch that made me fall in love with it."

**Content I don't control**

Spotlight's content comes from Copeland's marketing team working with energy partners. I don't control headline length, offer framing, or partner branding, and each card gets one shot before handing off to a partner's own enrollment flow. So the design had to do the controlling: hold the line on "doesn't read as an ad" while still making the card worth a tap.

**Testing at a few million users**

With a few million active users, there's enough traffic to run real experiments. A/B tests and ranked-choice validation settle questions that would otherwise come down to whoever argued hardest. The beta program recruits across OS version, hardware generation, control preference, and accessibility need, so decisions reflect the whole user base, not its loudest slice.

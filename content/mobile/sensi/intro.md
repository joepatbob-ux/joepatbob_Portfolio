---
{
  "headline": "Modernizing a mature app without breaking trust."
}
---

By the time I took full ownership of the Sensi app, it had the kind of design you would expect from a product that moved fast: functional but inconsistent. Custom controls where platform components would have worked, patterns from 2017 that never got revisited, ratings around 4.3 stars. Not bad enough to fix on its own — but not structured well enough to scale.

The first phase was a ground-up redesign: cleaner thermostat control, a coherent dashboard, consistent system states. Ratings climbed to 4.7 on iOS and 4.4 on Android. Shipping the redesign was tractable; keeping it good over time is the harder problem.

**Platform migration is product strategy.**

The migrations to SwiftUI and Material Expressive were not cosmetic. Apple and Google ship OS updates that change system behaviors and visual defaults; custom components do not inherit those updates, system components do. For an app supporting hardware going back to 2014, that debt compounds fast. So the strategy is screen by screen, tied to real work — when a feature touches a screen, that screen gets migrated. Slower than a big-bang rewrite, but every migration is justified by something shipping.

**Testing works differently at this scale.**

With a few million active users, the app has enough surface area to run structured experiments. A/B testing and ranked-choice validation inform decisions that would otherwise come down to opinion, and the beta program uses filtered recruiting across OS version, hardware generation, control preference, and accessibility needs. The goal is feedback that reflects the actual user base, not just the most vocal segment.

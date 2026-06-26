---
{
  "headline": "The foundation, not the feature."
}
---

By the time I took ownership of the app design, it had the kind of UI you'd expect from a product that moved fast and prioritized shipping: functional, but patchy. Custom controls where system components would have worked fine. Patterns that made sense in 2017 and never got revisited. A design language that accumulated inconsistencies over years of one-off decisions.

The ratings reflected it. Around 4.3 stars. Not bad, but not a product people were excited about.

The first phase was a ground-up redesign: simplified thermostat control, a cleaner dashboard, consistent system states, a design language that felt intentional. Ratings climbed from 4.3 to 4.7 on iOS, 4.4 on Android.

Shipping the redesign was the easy part. Keeping it good over time is the harder problem.

**The platform migrations to SwiftUI and Material Expressive were the opportunity to actually fix it.**

The practical reason: Apple and Google ship OS updates that change system behaviors, components, and visual defaults. Custom components don't get those updates automatically. System components do. For an app supporting hardware going back to 2014, that maintenance overhead compounds fast.

The design reason: system components bring accessibility behaviors, dynamic type, dark mode, and expected interaction models for free. Custom components have to earn all of that separately — and on a lean team, they often don't. Dark mode became a side effect of migration rather than a standalone project. Every migrated screen got it as part of the deal.

There's a philosophy underneath this: users spend more time in other apps than they do in ours. Following established platform patterns isn't conceding ground — it's directing effort toward the decisions that are genuinely unique to Sensi.

**How we're doing it**

This isn't a big-bang rewrite. Feature-freezing a shipping product to modernize everything at once isn't realistic, and it's nearly impossible to justify to stakeholders who see platform migration as cosmetic work.

The strategy is screen-by-screen: when a new feature touches a screen, that screen gets migrated. New work is built in SwiftUI or Material Expressive from the start. Legacy screens get updated when there's a natural reason to open them.

I used AI to compress the distance between design intent and working prototype — producing platform-accurate interaction models from Figma quickly enough to validate behavior before it became an engineering conversation. That speed matters when you're proposing a migration strategy to stakeholders skeptical of the ROI. A prototype that shows the migrated experience is a faster path to alignment than a deck that describes it.

To make sure feedback came from the right cross-section of users, I built a structured beta program with filtered recruiting — across OS version, hardware tenure, control preference, and accessibility needs. Not just the loudest people who opt into betas.

It's slower, but sustainable. Every migration is tied to something real rather than being pure overhead.

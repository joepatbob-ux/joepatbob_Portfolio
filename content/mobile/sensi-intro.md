---
{
  "headline": "The foundation, not the feature."
}
---

By the time I took ownership of the app design, it had the kind of UI you'd expect from a product that moved fast and prioritized shipping: functional, but patchy. Custom controls where system components would have worked fine. Patterns that made sense in 2017 and never got revisited. A design language that accumulated inconsistencies over years of one-off decisions.

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

It's slower, but sustainable. Every migration is tied to something real rather than being pure overhead. Two birds, one stone, every time.

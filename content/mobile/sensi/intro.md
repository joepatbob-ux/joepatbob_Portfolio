---
{
  "headline": "Modernizing a mature app without breaking trust."
}
---

By the time I took full ownership of the Sensi app, it looked like what it was: a product that had moved fast. It worked, but it was inconsistent — custom controls where a platform component would have done the job, patterns from 2017 that nobody had gone back to, ratings sitting around 4.3. Nothing broken enough to demand a fix, and nothing solid enough to build on either.

The first phase was a ground-up redesign: cleaner thermostat control, a dashboard that held together, system states that behaved the same way every time. Ratings climbed to 4.7 on iOS and 4.4 on Android. Shipping that was the easy part. Keeping it good year over year is where the real work is.

**Platform migration is product strategy.**

The migrations to SwiftUI and Material Expressive were not a fresh coat of paint. Apple and Google push OS updates that quietly change system behavior and visual defaults, and custom components sit those updates out while system components pick them up for free. For an app that still supports hardware going back to 2014, that gap widens fast. So I ran the migration screen by screen, tied to real work: when a feature touches a screen, that screen gets migrated. It is slower than a big-bang rewrite, but every step ships alongside something a user actually asked for.

**Testing works differently at this scale.**

With a few million active users, there is enough traffic to run real experiments. A/B tests and ranked-choice validation settle questions that would otherwise come down to whoever argued hardest, and the beta program recruits deliberately across OS version, hardware generation, control preference, and accessibility needs. The point is to hear from the actual user base, not just the loudest slice of it.

---
{
  "heading": "Removing a button that was doing someone else's job."
}
---

The installation flow is one of the highest-stakes experiences in the app. A homeowner selecting the wrong wires in the wirepicker — the screen where users identify which wires are connected to their thermostat — means the app infers the wrong equipment configuration. Getting it wrong has real consequences.

Which makes clarity here non-negotiable.

The legacy flow had two buttons at the bottom of every screen: Previous and Next — a pattern inherited from early mobile design.

Modern iOS and Android navigation already provides a reliable back action. It lives in the navigation bar at the top of every screen. Users expect it there. Adding a second back button at the bottom creates visual clutter, splits attention, and buries the primary action between two competing controls.

I removed Previous entirely.

With the redundant button gone, Continue became the clear primary action. The help link moved from a small text link buried below the buttons to a proper tappable action above Continue. The progress indicator moved into the native navigation bar, showing install step position without taking up screen real estate.

App Store reviewers picked up on it without prompting. One long-term user called out the step-by-step guidance as "a little touch that made me fall in love with it." That kind of feedback doesn't come from the interface getting out of the way by accident.

Users bring mental models from every app they've ever used. Fighting those models is expensive. Borrowing established platform patterns means reliable behavior for free — and the testing budget goes toward the decisions that actually need it.

---
{
  "heading": "When the app and the device contradicted each other.",
  "problems": [
    {
      "label": "Accessibility",
      "text": "A saturated orange or blue background creates contrast failures for text and UI elements sitting on top of it. WCAG compliance becomes a moving target when the background color is dynamic."
    },
    {
      "label": "Dark mode",
      "text": "There's no clean dark mode equivalent for a full-bleed orange screen. Desaturate it and it becomes unrecognizable. Leave it as-is and it doesn't work. Neither is acceptable."
    },
    {
      "label": "Consistency",
      "text": "The Sensi Touch 2 thermostat already used a better visual language for mode communication — temperature numbers turning blue when cooling, orange when heating. Independent reviewers called it out specifically, noting it made it easier to know exactly when the HVAC was running. The app and the device were telling two different stories to the same user."
    }
  ],
  "scrubber": {
    "beforeSrc": "/images/mobile-android-legacy-fullbleed-orange.png",
    "afterSrc": "/images/mobile-android-v1-dark-orange-number.png",
    "beforeAlt": "Legacy full-bleed orange heat mode screen",
    "afterAlt": "Refined UI with mode color on the temperature number",
    "caption": "Drag — orange full-bleed vs. dark mode with color on the number"
  }
}
---

The legacy app used full-screen color to communicate HVAC mode. Orange for heat, blue for cool, neutral for passive. The intent was right: mode state is important information, and making it ambient rather than buried in a label is good instinct.

The execution had three problems.

**The solution: move the color to the number.**

Instead of the background adopting the mode color, the displayed temperature adopts it. The information is still ambient — sitting on the most prominent element on the screen — but surgical rather than wholesale.

One change. Three problems solved. Accessibility contrast is predictable. Dark mode works without special casing. The app and the thermostat now speak the same visual language. A user who glances at their device and opens the app sees the same system communicating the same information.

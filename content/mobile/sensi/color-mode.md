---
{
  "heading": "When the app and the thermostat contradicted each other.",
  "problems": [
    {
      "label": "Accessibility",
      "text": "Saturated full-bleed backgrounds broke contrast ratios for overlaid UI elements."
    },
    {
      "label": "Dark mode",
      "text": "There was no workable dark mode equivalent for a full-bleed orange screen."
    },
    {
      "label": "Consistency",
      "text": "The thermostat display already used a better pattern: the temperature number changing color rather than the entire screen."
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

The legacy app used full-screen color to communicate HVAC mode: orange for heat, blue for cool, neutral for off. The intent was right — mode state matters, and making it ambient is a good instinct. But the execution broke down three ways, and the thermostat display already modeled the fix: color on the temperature number, not the whole screen. The app and the device were telling two different stories about the same system state.

Moving the color from the background to the number closed all three at once — predictable contrast, dark mode without special casing, and the app finally speaking the hardware's visual language. Glance at the thermostat, open the app, and you see the same information expressed the same way.

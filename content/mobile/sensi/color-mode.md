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

The legacy app painted the whole screen to show HVAC mode: orange for heat, blue for cool, neutral for off. The instinct was sound. Mode is worth surfacing, and making it ambient is a reasonable way to do it. The trouble was that the execution broke in three places at once, and the thermostat itself already pointed to the fix: it colored the temperature number, not the entire screen. So the app and the device were describing the same system in two different visual languages.

Moving the color off the background and onto the number cleared all three problems together. Contrast became predictable, dark mode stopped needing special cases, and the app finally matched what the hardware had been doing all along. Now you can glance at the thermostat, open the app, and read the same state the same way in both places.

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

The legacy app used full-screen color to communicate HVAC mode: orange for heat, blue for cool, neutral for off.

The intent was right. Mode state is important information, and making it ambient is a good instinct.

The execution created three problems that could not be solved independently. Saturated full-bleed backgrounds broke contrast ratios for overlaid UI elements. There was no workable dark mode equivalent. And the thermostat display already used a better pattern: the temperature number changing color rather than the entire screen.

The app and the device were telling two different stories about the same system state.

Moving the color from the background to the temperature number closed all three at once.

Contrast ratios became predictable. Dark mode worked without special casing. The app adopted the same visual language the hardware was already using.

A user glancing at the thermostat and opening the app now sees the same information expressed the same way.

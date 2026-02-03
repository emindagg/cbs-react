# 🌞🌙 Astronomy - Astronomy Globe Feature

Visualize sun/moon position, solar terminator, and celestial events.

## 📋 Contents

- **`index.js`** - Main entry point
- **`astronomy-globe.js`** - Main astronomy visualization
- **`sun-position.js`** - Calculate sun position (azimuth, elevation)
- **`moon-position.js`** - Calculate moon position and phase
- **`solar-terminator.js`** - Day/night boundary line
- **`celestial-events.js`** - Sunrise, sunset, solar noon

## 🎯 Features

- **Sun Position:** Real-time sun location on globe
- **Moon Position:** Moon location and current phase
- **Solar Terminator:** Day/night boundary visualization
- **Celestial Events:** Sunrise/sunset times for any location
- **Time Control:** View positions at any date/time

## 📦 Usage

```javascript
import { AstronomyGlobe } from './features/astronomy/index.js';

const astro = new AstronomyGlobe({
    map: mapInstance,
    datetime: new Date(), // Current time or specific date
    showSun: true,
    showMoon: true,
    showTerminator: true
});

// Get sun position for location
const sunPos = astro.getSunPosition({
    lat: 40.7128,
    lon: -74.0060,
    date: new Date()
});

console.log('Sun azimuth:', sunPos.azimuth);
console.log('Sun elevation:', sunPos.elevation);

// Get celestial events
const events = astro.getCelestialEvents({
    lat: 40.7128,
    lon: -74.0060,
    date: new Date()
});

console.log('Sunrise:', events.sunrise);
console.log('Sunset:', events.sunset);
console.log('Solar noon:', events.solarNoon);
```

## 🌍 Use Cases

- **Solar Panel Planning:** Optimal panel orientation
- **Photography:** Golden hour, blue hour timing
- **Agriculture:** Sunlight exposure for crops
- **Outdoor Activities:** Daylight planning
- **Education:** Teaching astronomy concepts

## 📚 Dependencies

Uses [SunCalc](https://github.com/mourner/suncalc) library for astronomical calculations.

---

**Status:** 🔴 Not Yet Implemented
**Priority:** Low (Optional Feature)
**Last Updated:** 2025-01-XX

# FastSend UI Specification v2.0

> **Audience:** Implementation Engineer (Agent 2)  
> **Source app:** `frontend2/` — React Native / Expo 54, Reanimated v4, @expo/vector-icons, expo-linear-gradient  
> **Current state:** Light theme (#F7F6FA bg), lime-green (#BBF246) accent, System font, hardcoded emoji icons, Animated API only  
> **Goal:** Premium dark-theme photo-sharing app — clean, bold, unmistakably modern

---

## 1. Design Direction

### Theme Decision: **Dark Theme (fixed, non-adaptive)**

**Rationale:**  
The dominant direction in 2025–2026 premium mobile apps (Darkroom, VSCO, Halide, Notion, Linear, Craft) is a fixed dark theme for media-centric and productivity tools. A fixed dark theme is the right call for FastSend for three reasons:

1. **Photos look dramatically better on dark.** QR codes on white pop against a near-black background; guest selfies and event shots feel cinematic rather than flat.
2. **Premium signal.** Users associate a crisp dark UI with professional tools (compare Camera+ vs. stock Photos app). FastSend targets event organizers who want to feel like they're using pro software.
3. **Avoids adaptive complexity.** Adaptive theming doubles component testing surface and causes subtle color-math bugs. Ship one flawless experience first.

Do **not** follow the current `colors.ts` which labels dark hex values as `bgElevated` while using `#F7F6FA` as `bg`. The entire background stack must invert.

### Aesthetic: **"Midnight Studio"**
Deep obsidian backgrounds with a single electrifying lime-green accent, frosted-glass cards, and sharp typographic hierarchy. Think Linear meets Darkroom. Not neon cyberpunk — restrained, confident, premium.

---

### Color Palette (all hex values are final)

#### Background Stack (3-layer system)
| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#080B0F` | Root screen background |
| `bgCard` | `#111318` | Card / panel surfaces |
| `bgElevated` | `#1A1E25` | Input fields, inline sections |
| `bgOverlay` | `#23282F` | Bottom sheets, modals, tooltips |
| `bgStripe` | `#0E1116` | Alternating row backgrounds |

#### Brand Accent
| Token | Hex | Usage |
|-------|-----|-------|
| `lime` | `#C4F135` | Primary CTA buttons, active tab indicator, highlights |
| `limeLight` | `#D9F76A` | Hover/pressed state of lime |
| `limeDark` | `#96C018` | Disabled lime, secondary lime use |
| `limeGlow` | `rgba(196,241,53,0.15)` | Background glow behind logo, icon badge fills |
| `limeGlowStrong` | `rgba(196,241,53,0.25)` | Pressed button shadow color |

> **Why #C4F135 over the current #BBF246?** At 5% higher luminance it reads better on `#080B0F` and passes WCAG AA at 14px bold. The difference is imperceptible in daylight but significant on OLED.

#### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#F0F2F5` | Headings, labels, primary content |
| `textSecondary` | `#8B919A` | Subtitles, supporting copy |
| `textMuted` | `#525860` | Placeholders, timestamps, meta |
| `textDisabled` | `#363B42` | Disabled states |
| `textOnLime` | `#0A0D10` | Text placed directly on lime background |

#### Borders & Dividers
| Token | Hex | Usage |
|-------|-----|-------|
| `border` | `#1F2429` | Card borders, input outlines (default) |
| `borderFocus` | `#C4F135` | Input focus ring |
| `borderStrong` | `#2D3338` | Section dividers, separators |

#### Semantic Colors
| Token | Hex | Light glow |
|-------|-----|------------|
| `success` | `#22C55E` | `rgba(34,197,94,0.14)` |
| `error` | `#F43F5E` | `rgba(244,63,94,0.14)` |
| `warning` | `#F59E0B` | `rgba(245,158,11,0.14)` |
| `info` | `#3B82F6` | `rgba(59,130,246,0.14)` |

#### Glass Effect Recipe
For frosted-glass panels (QR card, bottom sheet):
```
backgroundColor: 'rgba(17,19,24,0.80)'
borderColor: 'rgba(255,255,255,0.06)'
backdropFilter: blur(20px)   // web only — on native, layer a BlurView
```
On React Native use `expo-blur` `<BlurView intensity={60} tint="dark">` layered under the card content for the QR card specifically.

---

## 2. Typography

### Font Decision: **Inter (via expo-font + @expo-google-fonts/inter)**

**Why Inter:**
- Designed specifically for screen legibility at all sizes, with tabular numerals (critical for the invite code display and stat values)
- Expo Google Fonts package ships pre-bundled — no runtime download risk
- Used by Linear, Vercel, Raycast — the exact reference apps for this aesthetic
- Weight range 300–900 all available; letter-spacing at negative values looks clean at display sizes
- Avoid SF Pro / San Francisco: it is locked to Apple platforms and the system fallback on Android degrades the design

**Install command:**
```bash
npx expo install @expo-google-fonts/inter expo-font
```

**Font weights to load:** `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`, `Inter_800ExtraBold`

**Monospace for invite codes:** Use `SpaceMono_400Regular` from `@expo-google-fonts/space-mono`. Do not use `fontFamily: 'monospace'` — it resolves to Courier on iOS which looks archaic.

### Typography Scale

| Role | Size | Weight | Letter-spacing | Line-height | Token name |
|------|------|--------|----------------|-------------|------------|
| Hero | 40px | 800 | -1.5px | 44px | `typography.hero` |
| H1 | 32px | 800 | -1.0px | 38px | `typography.h1` |
| H2 | 24px | 700 | -0.5px | 30px | `typography.h2` |
| H3 | 18px | 600 | -0.2px | 24px | `typography.h3` |
| Body | 15px | 400 | 0px | 22px | `typography.body` |
| Body Bold | 15px | 600 | 0px | 22px | `typography.bodyBold` |
| Caption | 13px | 400 | 0.1px | 18px | `typography.caption` |
| Label | 12px | 700 | 0.8px | 16px | `typography.label` (use for section headers, uppercase) |
| Mono | 28px | 700 | 6px | 34px | `typography.monoCode` (invite code display) |
| Mono Small | 14px | 500 | 2px | 20px | `typography.monoSmall` (trip codes in list) |

### Updated `typography.ts` Token Shape
```typescript
export const typography = {
  // Font family tokens (strings to use in fontFamily prop)
  fontRegular:    'Inter_400Regular',
  fontMedium:     'Inter_500Medium',
  fontSemiBold:   'Inter_600SemiBold',
  fontBold:       'Inter_700Bold',
  fontExtraBold:  'Inter_800ExtraBold',
  fontMono:       'SpaceMono_400Regular',

  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    xxl:  32,
    hero: 40,
  },
  // ... (full token shape in Section 3)
};
```

---

## 3. Spacing & Geometry

### Spacing Scale (unchanged, already correct)
```typescript
export const spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
};
```

### Border Radius Tokens
```typescript
export const radius = {
  xs:   6,   // small tags, badges
  sm:   10,  // inner elements within cards
  md:   14,  // input fields
  lg:   20,  // cards, panels
  xl:   28,  // large cards, bottom sheets
  xxl:  36,  // full-bleed hero cards
  pill: 999, // buttons, status pills, tab bar
};
```

### Shadow/Elevation Tokens (React Native StyleSheet values)
```typescript
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 16,
  },
  // Lime glow shadow — apply to PrimaryButton (type='primary')
  limeGlow: {
    shadowColor: '#C4F135',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
};
```

### Signature Visual Element: **Pill-shaped CTAs + Razor-sharp cards**
- All primary action buttons: `borderRadius: radius.pill` (fully rounded ends)
- All content cards: `borderRadius: radius.lg` (20px) — tight enough to feel structured, not bubble-gum
- QR card: `borderRadius: radius.xl` (28px) — special treatment, it's a showcase element
- Tab bar: `borderRadius: radius.pill` floating, 68px height
- The contrast of pill buttons against square-ish cards creates deliberate visual rhythm
- No gradients on backgrounds — gradients are reserved for the primary button only

---

## 4. Animation Strategy

### Library Decision: **Reanimated v4 for everything — retire the Animated API**

**Rule:** All new animations use `react-native-reanimated` (v4, already installed). The old `Animated` API calls in all screens must be migrated. Reanimated v4 runs entirely on the UI thread — no bridge lag, no dropped frames on Android, and the new `useAnimatedStyle` + `withSpring` / `withTiming` API is cleaner than `Animated.sequence`.

Exception: `Animated.interpolate` used on the `InputField` border color can stay — `borderColor` is not a native driver property anyway; both APIs require JS thread for that specific case. Migrate to Reanimated's `useAnimatedStyle` with `useSharedValue` so at least the value tracking is consistent.

### 4 Animation Primitives

#### Primitive 1: `FadeSlideIn` (screen entry, card entrance)
```typescript
// Usage: wrap content on mount
const opacity = useSharedValue(0);
const translateY = useSharedValue(24);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ translateY: translateY.value }],
}));

useEffect(() => {
  opacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
  translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
}, []);
```
Apply to: all screen root views, list item cards (staggered by index × 60ms).

#### Primitive 2: `SpringScale` (button press feedback)
```typescript
// On pressIn:
scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
// On pressOut:
scale.value = withSpring(1, { damping: 12, stiffness: 300 });
```
Apply to: PrimaryButton, tab icons, card taps, back button, action rows.

#### Primitive 3: `PulseLoop` (live indicator, loading dots)
```typescript
const scale = useSharedValue(1);
useEffect(() => {
  scale.value = withRepeat(
    withSequence(
      withTiming(1.35, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      withTiming(1.0,  { duration: 700, easing: Easing.inOut(Easing.sin) }),
    ),
    -1, // infinite
    false
  );
}, []);
```
Apply to: the green dot in `LivePill`, any "processing" indicator.

#### Primitive 4: `ShimmerSweep` (skeleton loading state)
```typescript
// translateX sweeps from -screenWidth to +screenWidth
const translateX = useSharedValue(-screenWidth);
useEffect(() => {
  translateX.value = withRepeat(
    withTiming(screenWidth, { duration: 1200, easing: Easing.linear }),
    -1
  );
}, []);
// Render as an absolutely-positioned LinearGradient overlay:
// colors: ['transparent', 'rgba(255,255,255,0.06)', 'transparent']
```
Apply to: trip card placeholders in TripsScreen while loading, QR loading state.

### Screen Entry Animations
| Screen | Animation |
|--------|-----------|
| SplashScreen | Logo: `SpringScale` from 0.6 → 1 with `damping: 14`. Title: `FadeSlideIn` delayed 200ms. Tagline: `FadeSlideIn` delayed 450ms |
| Login / Register | Card: `FadeSlideIn` translateY 40→0, full screen fade 0→1, 380ms |
| Onboarding | Hero image scale: 0.92 → 1 over 600ms + `FadeSlideIn` for copy |
| HomeScreen | Staggered `FadeSlideIn` on each section (eyebrow → heading → live card → section rows) |
| ActiveTrip | `FadeSlideIn` on mount, then QR card pops in with 80ms delay spring |
| CreateTrip | `FadeSlideIn` identical to Login |
| Tabs switch | Built-in Expo Router tab animation is sufficient — do not override |

### Tab Switch: Native Tab Press
Use `tabBarIcon` with `SpringScale` on the icon when `focused` changes. No custom tab switch screen animation needed — the existing fade animation at the Stack level handles it.

### QR Code Display
When `inviteCode` transitions from `null` → string, animate the QR card with a `withSpring` scale from 0.88 → 1.0 with `damping: 18, stiffness: 180`. Add a brief opacity fade (0 → 1, 250ms). This makes the QR "materialize" rather than snap in.

### 3D Look Strategy: **Shadows + subtle perspective, no gradients on cards**
- Use `shadows.md` on all cards (see Section 3)
- On the QR card specifically, add a 2px `border` with `rgba(255,255,255,0.07)` and `shadows.lg` to create depth
- Use `perspective(800)` + `rotateX(1.5deg)` on the QR card only as a fixed tilt — not interactive, just adds 3D shelf depth
- Do NOT use gradients on card backgrounds — they flatten depth on dark themes. Only use gradient on the primary button.

---

## 5. Icon Strategy

### Chosen Icon Set: **Ionicons**

**Why Ionicons over alternatives:**
- Feather: great but too thin at 20px on dark backgrounds, hairline strokes disappear
- MaterialCommunityIcons: inconsistent visual weight, mixing Google + community designs
- MaterialIcons: dated Material Design 2 style
- Ionicons: designed for iOS+Android parity, filled and outline variants, thick enough strokes to read on dark at 20–24px, best overall quality in the set

**Usage pattern:** Use filled variants (`-sharp` suffix or the solid version) for active/selected states. Use outline variants for inactive states in the tab bar.

### Icon Name Reference Table

| Purpose | Active (filled) | Inactive (outline) | Size |
|---------|----------------|-------------------|------|
| Home tab | `home` | `home-outline` | 24 |
| Archive / Trips tab | `folder` | `folder-outline` | 24 |
| Notifications tab | `notifications` | `notifications-outline` | 24 |
| Settings tab | `settings` | `settings-outline` | 24 |
| Search | `search` | `search-outline` | 20 |
| Camera / Photo | `camera` | `camera-outline` | 22 |
| User / Person | `person` | `person-outline` | 22 |
| Email | `mail` | `mail-outline` | 20 |
| Lock / Password | `lock-closed` | `lock-closed-outline` | 20 |
| Warning / Error | `warning` | `warning-outline` | 20 |
| Back arrow | `arrow-back` | — | 24 |
| Chevron right | `chevron-forward` | — | 20 |
| QR Code | `qr-code` | `qr-code-outline` | 22 |
| Upload / Push photos | `cloud-upload` | `cloud-upload-outline` | 22 |
| End / Stop trip | `stop-circle` | `stop-circle-outline` | 22 |
| Add / Plus | `add-circle` | `add-circle-outline` | 24 |
| Check / Done | `checkmark-circle` | `checkmark-circle-outline` | 20 |
| Clock / Time | `time` | `time-outline` | 18 |
| Guests / People | `people` | `people-outline` | 22 |
| Live indicator (badge) | `radio` | — | 16 |
| Photo count | `images` | `images-outline` | 20 |

**Import pattern:**
```typescript
import { Ionicons } from '@expo/vector-icons';

<Ionicons name="home" size={24} color={colors.lime} />
```

Replace ALL emoji instances with the corresponding Ionicons icon. See Section 8 for the full emoji-to-icon replacement map.

---

## 6. Component Inventory

### 6.1 Tab Bar

**Design:** Floating pill, elevated, no border top line, shadow underneath.

```
Style spec:
  backgroundColor:  #111318          (bgCard)
  borderRadius:     999              (pill)
  height:           64px
  marginHorizontal: 20px
  marginBottom:     20px             (above bottom safe area)
  paddingVertical:  8px
  borderWidth:      1px
  borderColor:      #1F2429          (border)
  shadow:           shadows.md
  overflow:         'hidden'
```

**Active tab indicator:** When a tab is focused, render a `#C4F135` (lime) background pill behind the icon, 36×36, `borderRadius: 18`. Do NOT use a lime underline or top bar — the background pill is the indicator.

**Icon rendering (updated `TabIcon` component):**
```typescript
// Replace the emoji-based TabIcon with:
const TabIcon = ({ name, focused, badge }) => (
  <View style={{ position: 'relative' }}>
    <Animated.View style={[
      iconWrapStyle,
      focused && { backgroundColor: colors.lime }, // lime pill bg
      focusedScaleStyle  // SpringScale primitive
    ]}>
      <Ionicons
        name={focused ? name : `${name}-outline`}
        size={22}
        color={focused ? colors.textOnLime : colors.textMuted}
      />
    </Animated.View>
    {badge > 0 && <BadgeDot count={badge} />}
  </View>
);
```

**Label style:** `fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold'`
Active label color: `#F0F2F5` (textPrimary)
Inactive label color: `#525860` (textMuted)

---

### 6.2 PrimaryButton

```
Dimensions:
  height:           56px
  borderRadius:     999 (pill)
  paddingHorizontal: 32px

Primary variant:
  background:       linear-gradient(135deg, #C4F135 0%, #96C018 100%)
                    — use expo-linear-gradient <LinearGradient> wrapping the TouchableOpacity
  textColor:        #0A0D10 (textOnLime)
  fontSize:         16px, fontWeight: 700
  shadow:           shadows.limeGlow

Secondary variant:
  background:       #1A1E25 (bgElevated)
  border:           1px solid #2D3338 (borderStrong)
  textColor:        #F0F2F5 (textPrimary)

Danger variant:
  background:       #F43F5E (error)
  textColor:        #FFFFFF
  shadow:           { shadowColor: '#F43F5E', shadowOpacity: 0.4, shadowRadius: 16 }

Ghost variant:
  background:       transparent
  textColor:        #C4F135 (lime)

Disabled:
  background:       #1A1E25
  textColor:        #363B42 (textDisabled)
  shadow:           none

Animation:
  pressIn:  SpringScale → 0.95
  pressOut: SpringScale → 1.0
  (use Reanimated, not Animated API)

Haptics:
  On pressIn, fire: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  Install: npx expo install expo-haptics
  Wrap call in try/catch — some Android devices don't support it
```

The gradient for primary button:
```typescript
import { LinearGradient } from 'expo-linear-gradient';

// Inside the button render:
<LinearGradient
  colors={['#C4F135', '#96C018']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.button}
>
  <Text style={styles.label}>{title}</Text>
</LinearGradient>
```

---

### 6.3 InputField

```
Dimensions:
  height:           56px
  borderRadius:     14px (radius.md)
  paddingHorizontal: 16px

Default state:
  background:       #1A1E25 (bgElevated)
  border:           1px solid #1F2429 (border)

Focus state (animated, 200ms):
  border:           1.5px solid #C4F135 (borderFocus = lime)
  background:       #1F2429 (slightly lighter — bgElevated + 5%)

Error state:
  border:           1.5px solid #F43F5E (error)
  background:       rgba(244,63,94,0.06)

Label:
  fontSize: 12px, fontWeight: 700, letterSpacing: 0.5px
  color: #8B919A (textSecondary)
  position: above field (static label, not floating)
  marginBottom: 6px

Icon:
  Left-aligned Ionicons icon, color: #525860 (textMuted) in default state
  color: #C4F135 (lime) in focus state (animate the color change)
  size: 18px, marginRight: 10px

Placeholder text color: #525860 (textMuted)
Input text color: #F0F2F5 (textPrimary)
Cursor color: #C4F135 (lime)

Error message:
  fontSize: 12px, color: #F43F5E
  Ionicons "warning-outline" size 12, inline left of error text
  marginTop: 6px

Animation:
  Migrate from Animated.Value to useSharedValue + useAnimatedStyle
  Animate borderColor and optionally a very subtle background shift
```

---

### 6.4 Card (generic content card)

```
background:    #111318 (bgCard)
borderRadius:  20px (radius.lg)
border:        1px solid #1F2429 (border)
padding:       20px (spacing.lg)
shadow:        shadows.sm

For "elevated" variant (QR card, profile card):
  background:  #111318
  border:      1px solid rgba(255,255,255,0.06)
  shadow:      shadows.md
```

---

### 6.5 StatCard (ActiveTripScreen)

**Current:** Basic bordered box with emoji icon.  
**New:**

```
layout:
  flex: 1 (two side-by-side in a row)
  height: 90px
  background: #111318 (bgCard)
  borderRadius: 16px (radius.md)
  border: 1px solid #1F2429
  padding: 16px
  alignItems: center

content stack (top to bottom):
  1. Ionicons icon — size 20, color: #C4F135 (lime)
  2. Value text — 28px, Inter_800ExtraBold, color: #F0F2F5, letterSpacing: -0.5
  3. Label text — 11px, Inter_600SemiBold, color: #525860, uppercase, letterSpacing: 1px

Entrance animation:
  FadeSlideIn primitive, staggered: guests card at 0ms, photos card at 80ms
```

---

### 6.6 LivePill

**Current:** Green pill with a pulsing dot — functional but small.  
**New (dramatically upgraded):**

```
Container:
  flexDirection: row
  alignItems: center
  gap: 8px
  backgroundColor: rgba(34,197,94,0.12)  (successLight)
  borderRadius: 999 (pill)
  paddingHorizontal: 14px
  paddingVertical: 8px
  border: 1px solid rgba(34,197,94,0.30)

Outer pulse ring (NEW):
  position: absolute (centered on the dot)
  width: 20px, height: 20px, borderRadius: 10
  border: 1.5px solid rgba(34,197,94,0.5)
  animate: scale 1→2, opacity 1→0, repeat infinite (1400ms cycle)
  This creates the "WiFi pulse" / "radar ping" effect

Inner dot:
  width: 8px, height: 8px, borderRadius: 4
  background: #22C55E (success)
  animate: PulseLoop primitive (scale 1→1.3, 700ms)

LIVE text:
  fontSize: 11px, fontWeight: 800, letterSpacing: 2px
  color: #22C55E (success)
  fontFamily: Inter_800ExtraBold
  textTransform: uppercase
```

The double-ring pulse (outer ring fades out as it expands) creates a genuine live broadcast feel — like a recording indicator on a camera.

---

### 6.7 ScreenShell

**Current:** Plain `SafeAreaView` wrapping a `View`, both `backgroundColor: colors.bg`.

**New:**
```typescript
// ScreenShell adds a very subtle radial glow at the top-center of the screen
// to break up the flat black — like a faint light source
//
// Implementation: absolutely positioned LinearGradient at the top
// colors: ['rgba(196,241,53,0.04)', 'transparent']
// start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 }
// height: 30% of screen height
// width: 100%
//
// This is extremely subtle — just enough to prevent the screen from feeling dead.
// Do NOT make it visible at full opacity. The glow should only be noticeable
// when the screen is side-by-side with a flat #080B0F reference.

export const ScreenShell = ({ children, glow = false }) => (
  <SafeAreaView style={styles.safe}>
    {glow && (
      <LinearGradient
        colors={['rgba(196,241,53,0.04)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        pointerEvents="none"
      />
    )}
    <View style={styles.container}>{children}</View>
  </SafeAreaView>
);
```

Apply `glow={true}` on: SplashScreen, OnboardingScreen, ActiveTripScreen (green glow from LIVE status).

---

## 7. Screen-by-Screen Redesign Notes

### 7.1 SplashScreen (`src/app/index.tsx`)

- Replace the `📷` emoji with an `Ionicons "camera"` icon at size 42, color `#C4F135` (lime), centered in the logo ring. The ring itself: `width: 96, height: 96, borderRadius: 28, backgroundColor: rgba(196,241,53,0.12), border: 1px solid rgba(196,241,53,0.25)`.
- Migrate the `Animated.spring` + `Animated.timing` calls to Reanimated's `withSpring` / `withTiming` + `useSharedValue`.
- Add the `ScreenShell glow={true}` so a faint lime halo bleeds from the top — it reads as a camera flash / photo app.
- The "Your moments, delivered instantly." tagline: increase to 16px, `Inter_400Regular`, color `#8B919A` (textSecondary), letterSpacing 0.3.
- Background: `#080B0F`. Remove the current `colors.bg` which is `#F7F6FA`.

---

### 7.2 OnboardingScreen (`src/app/onboarding.tsx`)

**This screen has the most critical copy bug — fix immediately:**

- **REMOVE** "Wherever You Are Health Is Number One" and "There is no instant way to a healthy life". Replace with:
  - Title: `Share Every\n` + `Moment` (where "Moment" renders on lime highlight)
  - Subtitle: "Create a trip, share your QR code, and let AI deliver photos to every guest automatically."
- The hero image (`logo-glow.png`) should be replaced or wrapped — render a dark overlay so it works on `#080B0F` background. Add `tintColor` treatment or a dark-to-transparent gradient over it.
- Carousel indicator dots: switch from the current single-bar design to 3 dots (even if there's only one slide for now) — `width: 8, height: 8, borderRadius: 4`. Active dot: `backgroundColor: #C4F135, width: 24`. Inactive: `backgroundColor: #2D3338`.
- "Get Started" button: replace with the new `PrimaryButton` (lime gradient, pill shape, 56px height). Current button is hardcoded `backgroundColor: colors.textPrimary` — wrong.
- Bottom background: change from `#FFFFFF` to `#080B0F`. The white fade overlay (`rgba(255,255,255,0.92)`) must become `rgba(8,11,15,0.92)`.

---

### 7.3 LoginScreen (`src/app/login.tsx`)

- Replace `📷` logo emoji with `Ionicons "camera"` in the logo mark badge.
- Replace `⚠️` in the error banner with `Ionicons "warning" size={16} color={colors.error}`.
- Replace `✉️` InputField icon with `Ionicons "mail-outline"`.
- Replace `🔒` InputField icon (×2) with `Ionicons "lock-closed-outline"`.
- The "FASTSEND" app-name label above the heading: change color from `colors.amber` (lime) to a more subtle `#8B919A` — the lime is too aggressive for small uppercase labels. Or remove it entirely; the logo mark already identifies the brand.
- Card background: `#111318` (bgCard), border `#1F2429`. Currently uses `colors.bgCard` which maps to `#FFFFFF` in the old theme — must update theme tokens.
- "Forgot Password?" link: keep `colors.lime` color — it's the right call for a text link.

---

### 7.4 RegisterScreen (`src/app/register.tsx`)

- All changes identical to LoginScreen (same structure): replace emoji icons, update background, apply dark card.
- Replace `👤` with `Ionicons "person-outline"`.
- The four `InputField` rows need a `gap: spacing.sm` (8px) between them inside the card — currently there's no visual breathing room.
- Heading "Create account": increase to `typography.h1` (32px), `Inter_800ExtraBold`, letterSpacing -1.
- Subtitle "Start sharing memories in seconds": update to `typography.body` (15px), color `#8B919A`.

---

### 7.5 HomeScreen (`src/app/(tabs)/index.tsx`)

**This screen needs the most work. The current content is copy-pasted from a fitness app.**

- **DELETE** the `workouts` array, `plans` array, all references to "Popular Workouts", "Today Plan", "kcal", "time" labels, progress bars, and the `▶` play button overlay. None of this is FastSend content.
- **NEW layout** (top to bottom):
  1. **Header row:** Left = "Good [time of day]" eyebrow (12px label) + user display name as H2. Right = avatar circle with initials (32px, lime bg, 2-letter initials).
  2. **Active trip live card** (when `activeTripId` is set): Full-width card, `#111318` bg, lime-green left border (3px), `LivePill` in top-right corner, "Your trip is live" title + "Tap to push photos or view QR code" subtitle. Two inline action buttons: "View QR" (ghost) and "Push Photos" (lime, small pill).
  3. **"No active trip" CTA** (when no trip): A prominent `PrimaryButton` "Start New Trip" centered, below a brief headline "Ready to share?", subtitle "Create a trip and get a QR code in seconds."
  4. **Recent Trips section:** Last 2–3 ended trips from the archive, shown as compact cards (invite code + date + guest count). "See all →" link to Trips tab. If no trips: single empty-state row ("No past trips yet").
- Delete the search bar from the home screen — it's not used for anything meaningful in the current data model.
- **Remove the `workoutCard` horizontal scroll** entirely.

---

### 7.6 TripsScreen (`src/app/(tabs)/trips.tsx`)

- Header "Trip Archive": fine as-is, just update colors to dark theme (`textPrimary: #F0F2F5`).
- Count badge: change `backgroundColor: colors.amberGlow` to `backgroundColor: rgba(196,241,53,0.12)` and badge number color to `#C4F135` (lime).
- Trip cards: update to dark card style (`#111318` bg, `#1F2429` border). The `tripCode` (invite code) should use `SpaceMono_400Regular` font for the monospace display.
- Replace `👥` and `📸` emoji in `tripMetaItem` with `Ionicons "people-outline"` and `Ionicons "images-outline"`.
- Empty state: replace `📁` emoji with `Ionicons "folder-open-outline"` at size 48, color `#2D3338`.
- Error state: replace `⚠️` with `Ionicons "warning-outline"` at size 40, color `#F43F5E`.
- Add `ShimmerSweep` skeleton cards (2–3 placeholder rows) while `loading === true`, instead of the plain "Loading trips..." text.

---

### 7.7 NotificationsScreen (`src/app/(tabs)/notifications.tsx`)

- Background: `#080B0F`. Currently hardcodes `colors.bgBase` which is still `#F7F6FA`.
- Header: remove the `borderBottomWidth` divider — on a dark theme, a hard divider line looks heavy. Use `paddingBottom: 8` and let visual separation come from the list starting below.
- Unread card: change `backgroundColor: colors.bgCardElevated` to `#1A1E25` — slightly brighter than default card to signal "new". Keep the `border: 1px solid rgba(196,241,53,0.25)` (lime tint) to reinforce unread status.
- Unread dot: replace `backgroundColor: colors.amber` with `#C4F135` (lime). Keep the dot as-is, it's clean.
- Empty state: replace `📭` emoji with `Ionicons "mail-open-outline"` at size 52, color `#2D3338`. "You're all caught up!" stays — it's good copy.

---

### 7.8 SettingsScreen (`src/app/(tabs)/settings.tsx`)

- Profile card: `#111318` background, lime-tinted avatar (`backgroundColor: rgba(196,241,53,0.12)`, border `#C4F135 + 30` alpha). Initials text: `#C4F135`.
- Section title labels: keep the `uppercase + letterSpacing` treatment — it's correct for settings taxonomy. Update color to `#525860` (textMuted).
- Setting rows: dark card background (`#111318`), row dividers `#1F2429`. The `rowChevron` "›" can stay as a text character or be replaced with `Ionicons "chevron-forward" size={16}`.
- Duplicate "Account" section title (bug — there are two `<Text>Account</Text>` section headers). Rename the second one to "Danger Zone" and style it with `color: #F43F5E`.
- "Sign Out" row: the `dangerText` style is correct. Add `Ionicons "log-out-outline"` icon on the left of that row.
- Version row: value "1.0.0" — fine. Below it, consider adding a `buildNumber` from `expo-constants`.

---

### 7.9 CreateTripScreen (`src/app/create-trip.tsx`)

- Replace `📷` + `←` text with `Ionicons "arrow-back" size={24}` back button and `Ionicons "camera"` in the logo badge.
- Info block icons (currently `⚡`, `🔔`, `🤖` emoji): replace with:
  - ⚡ → `Ionicons "flash" size={18} color={colors.lime}`
  - 🔔 → `Ionicons "notifications" size={18} color={colors.lime}`
  - 🤖 → `Ionicons "scan" size={18} color={colors.lime}` (closest to AI face-scan)
  - Info icon wraps: `backgroundColor: rgba(196,241,53,0.10)`, border `rgba(196,241,53,0.20)`, `borderRadius: 10`
- Replace `🏷️` InputField icon with `Ionicons "pricetag-outline"`.
- Trip name input: `autoFocus={true}` — already set, good.
- The "Create Trip & Get QR Code" CTA: This is the key moment — add a Haptics.notificationAsync(SUCCESS) on successful creation (not on button press, but after the router.replace fires).

---

### 7.10 ActiveTripScreen (`src/app/active-trip.tsx`)

- Apply the new `LivePill` design (Section 6.6) with the outer expanding ring pulse.
- QR Card: apply `shadows.lg` + `border: 1px solid rgba(255,255,255,0.07)` + `borderRadius: radius.xl (28)`. The QR code itself renders on a white background tile (already present in `qrWrapper`) — keep this, it's correct. The white square tile: `padding: 16, borderRadius: 14`.
- Invite code display: migrate from `fontFamily: 'monospace'` to `fontFamily: 'SpaceMono_400Regular'`. Increase letter-spacing from `6` to `8`. Color: `#C4F135` (lime) instead of `#F0F2F5` — the invite code is the focal point, lime makes it pop.
- Invite code label "INVITE CODE": increase `letterSpacing` to 3, color `#525860` (textMuted).
- StatCards: apply the new design from Section 6.5. Replace `👥` / `📸` emoji with Ionicons icons.
- Upload progress: replace the text "Uploading X / Y..." with a visual progress bar underneath the button (thin, 4px high, `backgroundColor: rgba(196,241,53,0.15)`, progress fill `backgroundColor: #C4F135`).
- Error box: replace `⚠️` text with `Ionicons "warning" size={14} color={colors.error}`.
- "End Trip" button: add `Ionicons "stop-circle-outline"` icon left of text. The destructive red button is correct — do not soften it.

---

## 8. Critical Issues to Fix in Current Code

### 8.1 Wrong App Content — Fitness App Leftovers

**File:** `frontend2/src/app/(tabs)/index.tsx`

The HomeScreen contains data and UI copied verbatim from a fitness tracking app:

| Issue | Location | Fix |
|-------|----------|-----|
| `const workouts = [{ title: 'Start a\nTrip', kcal: 'Create', time: 'In seconds' }]` | line 5-8 | Delete entire array. kcal/time are fitness metrics. |
| `const plans = [{ title: 'Private gallery', progress: 45, level: 'Secure' }]` | line 10-16 | Delete entire array. "progress: 45" makes no sense for FastSend features. |
| `"Popular Workouts"` section title | line 52 | Delete section. |
| `"Today Plan"` section title | line 63 | Delete section. |
| `styles.workoutCard`, `workoutImage`, `workoutShade`, `play`, `playText` | StyleSheet | Delete all workout-related styles. |
| `styles.planCard`, `planImage`, `planBody`, `progress`, `progressFill` | StyleSheet | Delete all plan-related styles. |
| `filteredWorkouts`, `filteredPlans`, `query`, `normalizedQuery` | component state | Remove search state. The search bar has no useful data to search. |
| Horizontal scroll of "workout" cards | render | Delete. Replace with the new HomeScreen layout from Section 7.5. |

**File:** `frontend2/src/app/onboarding.tsx`

| Issue | Line | Fix |
|-------|------|-----|
| `"Wherever You Are\nHealth Is Number One"` | title Text | Replace with FastSend copy (see Section 7.2) |
| `"There is no instant way to a healthy life"` | subtitle Text | Replace |
| White background `backgroundColor: '#FFFFFF'` | container style | Change to `#080B0F` |
| `rgba(255,255,255,0.92)` fade overlay | fadeOverlay style | Change to `rgba(8,11,15,0.92)` |

---

### 8.2 Complete Emoji-to-Icon Replacement Map

Every emoji in the codebase must be replaced with the corresponding Ionicons icon. Here is the full inventory:

| Emoji | File | Style/Prop context | Replace with |
|-------|------|--------------------|--------------|
| `📷` | `index.tsx` (SplashScreen) | `<Text style={styles.icon}>` | `<Ionicons name="camera" size={42} color={colors.lime} />` |
| `📷` | `login.tsx` | `styles.logoIcon` | `<Ionicons name="camera" size={32} color={colors.lime} />` |
| `📷` | `register.tsx` | `styles.logoIcon` | `<Ionicons name="camera" size={32} color={colors.lime} />` |
| `📷` | `create-trip.tsx` | `styles.logoIcon` in logoBadge | `<Ionicons name="camera" size={20} color={colors.lime} />` |
| `⚠️` | `login.tsx` | `errorBannerIcon` | `<Ionicons name="warning" size={16} color={colors.error} />` |
| `⚠️` | `register.tsx` | `errorBannerIcon` | `<Ionicons name="warning" size={16} color={colors.error} />` |
| `⚠️` | `active-trip.tsx` | `errorBoxTitle` text prefix | `<Ionicons name="warning" size={14} color={colors.error} />` |
| `⚠️` | `trips.tsx` | `errorIcon` | `<Ionicons name="warning-outline" size={40} color={colors.error} />` |
| `✉️` | `login.tsx` | `InputField icon` prop | `"mail-outline"` (Ionicons name string, passed to InputField) |
| `✉️` | `register.tsx` | `InputField icon` prop | `"mail-outline"` |
| `🔒` | `login.tsx` | `InputField icon` prop (×2) | `"lock-closed-outline"` |
| `🔒` | `register.tsx` | `InputField icon` prop (×2) | `"lock-closed-outline"` |
| `👤` | `register.tsx` | `InputField icon` prop | `"person-outline"` |
| `🏷️` | `create-trip.tsx` | `InputField icon` prop | `"pricetag-outline"` |
| `⚡` | `create-trip.tsx` | infoRow icon | `<Ionicons name="flash" size={18} color={colors.lime} />` |
| `🔔` | `create-trip.tsx` | infoRow icon | `<Ionicons name="notifications" size={18} color={colors.lime} />` |
| `🤖` | `create-trip.tsx` | infoRow icon | `<Ionicons name="scan" size={18} color={colors.lime} />` |
| `👥` | `active-trip.tsx` | `StatCard icon` prop | `<Ionicons name="people" size={20} color={colors.lime} />` |
| `📸` | `active-trip.tsx` | `StatCard icon` prop | `<Ionicons name="images" size={20} color={colors.lime} />` |
| `👥` | `trips.tsx` | `tripMetaItem` inline text | `<Ionicons name="people-outline" size={13} color={colors.textSecondary} />` |
| `📸` | `trips.tsx` | `tripMetaItem` inline text | `<Ionicons name="images-outline" size={13} color={colors.textSecondary} />` |
| `📁` | `trips.tsx` | `emptyIcon` | `<Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />` |
| `📭` | `notifications.tsx` | `emptyEmoji` | `<Ionicons name="mail-open-outline" size={52} color={colors.textMuted} />` |
| `🏠` | `(tabs)/_layout.tsx` | `TabIcon emoji` prop | Replace with Ionicons tab system (see Section 5) |
| `📁` | `(tabs)/_layout.tsx` | `TabIcon emoji` prop | Same |
| `🔔` | `(tabs)/_layout.tsx` | `TabIcon emoji` prop | Same |
| `⚙️` | `(tabs)/_layout.tsx` | `TabIcon emoji` prop | Same |
| `←` | `create-trip.tsx` | `backIcon` text | `<Ionicons name="arrow-back" size={24} color={colors.textSecondary} />` |
| `⌕` | `(tabs)/index.tsx` | search icon text | Delete search bar entirely (Section 7.5) |
| `🔥` | `(tabs)/index.tsx` | "Good Morning 🔥" | Remove emoji from string |

**Note on `InputField`:** The `icon` prop currently accepts an emoji string and renders it as `<Text>`. This must be refactored to accept either a string icon name or a `ReactNode`. Recommended approach: change the prop to `iconName?: keyof typeof Ionicons.glyphMap` and render `<Ionicons name={iconName} size={18} color={focused ? colors.lime : colors.textMuted} />` inside the field.

---

### 8.3 Theme Token Inversion (Colors)

The current `colors.ts` is internally inconsistent — it uses dark-sounding names for light values:
- `bgElevated: '#192126'` — this is the darkest thing in the file yet it's used as an input field background (correct for old light theme, wrong for dark)
- `bg: '#F7F6FA'` — labeled as the main bg but it's off-white
- Comments say "dark theme" at the top but all backgrounds are light

The entire `colors.ts` must be replaced with the new token values from Section 1. No legacy alias names should survive. The engineer should do a global find-replace pass after updating the token file.

---

### 8.4 InputField Background Bug

In `InputField.tsx`, the wrapper background is `colors.bgElevated` which currently maps to `#192126` (near-black — correct for dark theme). After the theme token inversion in Section 8.3, `bgElevated` will map to `#1A1E25` — this is still correct. No change needed to the component, only to the theme file.

However, the `input` Text color is `colors.textPrimary`. After inversion, `textPrimary` becomes `#F0F2F5` — which is correct on a dark input background. The fix is automatic once the theme tokens are updated.

---

### 8.5 Font Stack — System Font Usage

All typography currently uses `fontFamily: 'System'` or no fontFamily (system default). After loading Inter fonts in `_layout.tsx`, every `StyleSheet` that uses hardcoded `fontWeight: '800'` will also need `fontFamily: 'Inter_800ExtraBold'` since system font weight rendering varies on Android.

In `_layout.tsx`, add the font loader:
```typescript
import { useFonts, Inter_400Regular, Inter_500Medium,
  Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    Inter_700Bold, Inter_800ExtraBold, SpaceMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  // ... rest of layout
}
```

---

### 8.6 Miscellaneous Bugs and Issues

| Bug | File | Fix |
|-----|------|-----|
| `StatusBar style="dark"` | `_layout.tsx` | Change to `style="light"` — dark theme needs white status bar icons |
| Duplicate "Account" section header | `settings.tsx` | Rename second one to "Danger Zone", style with `color: colors.error` |
| `bgBase` and `bgCardElevated` tokens in `colors.ts` | `colors.ts`, `notifications.tsx` | These are backwards-compat aliases. After theme rewrite, remove aliases and use canonical token names |
| `errorDot: { color: colors.error }` text "●" in InputField | `InputField.tsx` | Replace `<Text style={styles.errorDot}>●</Text>` with `<Ionicons name="alert-circle" size={12} color={colors.error} />` |
| `styles.backIcon: { fontSize: 24 }` renders "←" as a Unicode arrow | `create-trip.tsx` | Replace with Ionicons back arrow |
| `chevron "›"` in SettingRow | `settings.tsx` | Replace with `<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />` |
| QR code `color={colors.bg}` — currently renders QR in off-white | `active-trip.tsx` | Change to `color="#000000"` — QR modules must be pure black on white for scanner reliability |
| `fontFamily: 'monospace'` in `codeValue` and `tripCode` | `active-trip.tsx`, `trips.tsx` | Replace with `fontFamily: 'SpaceMono_400Regular'` |
| No `@expo/vector-icons` import anywhere | All files | Add Ionicons import to each file that uses icons |
| Tab bar `backgroundColor: colors.bgElevated` = `#192126` | `(tabs)/_layout.tsx` | After theme token update this auto-corrects to `#1A1E25` — verify visually |

---

## Implementation Priority Order

For Agent 2, tackle in this sequence:

1. **Install fonts** (`@expo-google-fonts/inter`, `@expo-google-fonts/space-mono`) and update `_layout.tsx`
2. **Update `colors.ts`** with the new dark palette from Section 1
3. **Update `typography.ts`** with Inter font families and new scale from Section 2
4. **Update `spacing.ts` / `radius`** with new radius tokens from Section 3
5. **Migrate PrimaryButton** to Reanimated + LinearGradient + Haptics
6. **Migrate InputField** to Ionicons + Reanimated
7. **Update ScreenShell** with glow variant
8. **Update Tab Bar** in `(tabs)/_layout.tsx` — Ionicons, new styles
9. **Fix HomeScreen** — delete fitness content, build FastSend-appropriate layout
10. **Fix OnboardingScreen** — copy and dark theme
11. **Migrate remaining screens** — LoginScreen, RegisterScreen, CreateTrip, ActiveTrip, Trips, Notifications, Settings (in that order)
12. **Migrate all Animated API calls** to Reanimated across all screens
13. **Change StatusBar** to `style="light"`
14. **QA pass** on emoji replacement completeness

---

*FastSend UI Specification v2.0 — prepared for implementation handoff*

---
version: alpha
name: Nayara Energy
description: A clean, corporate light theme with teal accents, generous spacing, and bold editorial headlines.
colors:
  primary: "#14C7A3"
  secondary: "#6D6E71"
  tertiary: "#1F8FB8"
  neutral: "#FFFFFF"
  surface: "#FFFFFF"
  on-surface: "#6D6E71"
  border: "#E5E7EB"
  muted: "#F5F7FA"
  shadow: "#CCCCCC"
  overlay: "#0B1F2A"
typography:
  headline-display:
    fontFamily: Lato
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: 0.42em
  headline-lg:
    fontFamily: Lato
    fontSize: 34px
    fontWeight: 600
    lineHeight: 46px
    letterSpacing: 0.12em
  headline-md:
    fontFamily: Lato
    fontSize: 30px
    fontWeight: 600
    lineHeight: 36px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Lato
    fontSize: 26px
    fontWeight: 600
    lineHeight: 31px
    letterSpacing: 0em
  body-lg:
    fontFamily: Lato
    fontSize: 22px
    fontWeight: 400
    lineHeight: 33px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Lato
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Lato
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Lato
    fontSize: 21px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0em
  label-md:
    fontFamily: Lato
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Lato
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.04em
  nav-lg:
    fontFamily: Lato
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0em
  nav-sm:
    fontFamily: Lato
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: 0em
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 20px
  xl: 28px
  full: 9999px
spacing:
  xs: 14px
  sm: 22px
  md: 50px
  lg: 66px
  xl: 94px
  gutter: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.lg}"
    padding: "23px 34px"
    height: "68px"
    width: "232px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    padding: "23px 34px"
    height: "68px"
    width: "232px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: "14px 16px"
---
# Nayara Energy

## Overview

Nayara Energy presents as a polished, corporate, and infrastructure-focused brand with a bright light theme and restrained teal accenting. The overall tone is professional and dependable rather than playful, with large hero imagery and strong messaging that feel built for broad public trust. Spacing is generous and the UI reads as spacious, airy, and editorial, with clear hierarchy and minimal chrome.

## Colors

- **Primary (#14C7A3):** A vivid teal used for key calls to action and brand emphasis. It provides the site’s most distinctive energy and anchors the interface against the white background.
- **Secondary (#6D6E71):** A neutral graphite-gray used for navigation, body copy, and less prominent interface elements. It keeps the experience calm and highly readable.
- **Tertiary (#1F8FB8):** A cooler blue-teal support tone that can be used for secondary accents, gradients, and visual transitions without competing with the primary brand color.
- **Neutral / Surface (#FFFFFF):** Clean white is the dominant canvas for the layout, giving the site a bright, open, and corporate feel.
- **Border (#E5E7EB):** A subtle cool gray used for soft dividers and card outlines. It supports structure without creating visual heaviness.
- **Muted (#F5F7FA):** A pale background tone for low-emphasis panels or alternate sections when needed.
- **Shadow (#CCCCCC):** A light neutral shadow tone that appears very soft and understated; the UI relies more on contrast and borders than on dramatic depth.
- **Overlay (#0B1F2A):** A deep blue-black overlay suitable for hero image treatment and contrast layers over photography.

## Typography

The system is built around Lato, a geometric sans-serif that feels modern, highly legible, and businesslike. Headings are strong and deliberate, with weights centered around 600; the largest display treatment uses very wide letter spacing for a premium, cinematic effect in hero banners. Body text remains readable and calm at 400 weight, while labels and buttons shift to heavier weights for clarity and actionability.

Uppercase and spaced-out text are used for section banners and brand-forward statements, creating a formal, architectural rhythm. Navigation uses a slightly heavier, larger sans-serif style for strong top-level wayfinding. In UI copy, avoid decorative typography; the brand relies on disciplined spacing, weight, and scale rather than expressive type tricks.

## Layout & Spacing

The layout follows a full-width, content-forward structure with large image-led sections rather than a narrow centered container. Navigation is horizontally distributed with clear separation between utility links and primary site sections. Spacing tokens lean large, producing generous breathing room between sections and reinforcing the brand’s stable, premium feel.

Use the spacing scale as a clear rhythm: 14px and 22px for internal gaps, 50px and 66px for section breathing room, and 94px for major vertical transitions. Cards and content blocks should feel open, with consistent padding rather than dense nested layouts. Section headers and hero blocks should remain spacious and centered when used over imagery.

## Elevation & Depth

Depth is intentionally restrained. The interface depends on image overlays, white surfaces, and subtle borders more than on shadows or layered elevation. Where separation is needed, prefer a thin border and contrast against the white surface instead of a heavy drop shadow.

Hero images often use darkened overlays to preserve text legibility. Cards can use the light border token to define boundaries, but should not appear floating or materially elevated. The overall effect is flat, crisp, and corporate.

## Shapes

The shape language is soft but controlled. Most elements use modest rounding, with cards at 8px and primary buttons at a more pronounced 20px radius. Secondary buttons feel slightly more utilitarian with a smaller radius, while links and utility items remain square and minimal.

This creates a contrast between approachable CTAs and strict, information-first navigation. Avoid pill-heavy UI or overly playful curves; the brand’s geometry should remain clean and dependable.

## Components

Buttons are the most expressive component in the system. Use `button-primary` for the main CTA: teal fill, generous horizontal padding, 68px height, and a strong label style. Primary buttons should feel prominent but not loud, with the text remaining in the neutral gray rather than white. Use `button-secondary` for lower-priority actions with a transparent fill and gray outline, and `button-link` for inline actions or text-based navigation.

Cards should be simple white containers with a 1px border, 8px radius, and 16px padding. They should not rely on shadow for emphasis. Inputs should follow the same restrained language: white surface, soft border, modest rounding, and clear typography. Use the same neutral text color throughout form controls to preserve consistency.

Navigation links are large, calm, and typographically emphasized rather than decorated. Hero content can sit over darkened photography with centered alignment and high contrast. For chips, tooltips, checkboxes, radios, and similar controls, keep the same principle: minimal ornament, clear outline, and strong readability. If a state needs emphasis, prefer color shift or border contrast over motion-heavy effects.

## Do's and Don'ts

- Do keep layouts spacious, with generous vertical rhythm and clear separation between major sections.
- Do use Lato consistently across headings, body copy, navigation, and controls.
- Do emphasize primary actions with the teal `button-primary` treatment.
- Do use subtle borders and color contrast to separate surfaces instead of heavy shadows.
- Don't introduce playful gradients, neon accents, or high-saturation colors outside the established teal-blue range.
- Don't compress sections tightly; the brand depends on breathing room and large-scale imagery.
- Don't use overly rounded pills for everything; reserve stronger rounding for primary calls to action.
- Don't make body copy too dark or dense; the softer gray tone is part of the brand’s calm corporate feel.
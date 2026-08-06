# ADR 0003 — Material UI is the sole production component system

- Status: Accepted
- Date: 2026-08-05

## Context

RepQuest already uses Material UI. Workout.cool uses a different component/style ecosystem.

## Decision

Keep Material UI and implement a custom max&gym theme. Do not add Tailwind, shadcn/ui, Radix UI, DaisyUI, or another design system solely to adopt donor UI.

## Consequence

Fewer dependencies, smaller cognitive load, consistent accessibility and theming, and lower styling-conflict risk.

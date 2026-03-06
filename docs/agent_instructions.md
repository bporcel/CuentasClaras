# Cuentas Claras - Strategic Agent Instructions

Welcome, Fellow Agent. When modifying or extending `Cuentas Claras`, strictly adhere to the following rules:

## Design Philosophy
1. **Aesthetics over generic UIs**: We use a premium fintech design language (Revolut/Wise style) with glassmorphism, precise padding, and responsive micro-animations. Avoid default un-styled government-like looks.
2. **Plain Language**: All government/financial terms must be explained using the `Tooltip` component to ensure citizen accessibility (e.g., explaining "Contrato Menor" or "BOE").
3. **Responsive & Accessible**: Maintain WCAG 2.1 standards. Always include `aria-label` for icons without text and ensure readable color contrasts.

## Coding Standards
1. **Next.js App Router**: Client components must have `"use client";` at the top. Server components should handle heavy data fetching and pass standard props down to client components.
2. **Styling**: Use standard Tailwind CSS classes. Use `clsx` and `tailwind-merge` when creating reusable components that accept `className` props.
3. **Data Flows**: The current data layer is mocked in `src/lib/api.ts` and `src/lib/mock-data.ts`. Modify the base `SpendingData` types if adding new features that require more dimensional data.
4. **No Placeholder Texts**: If data is missing or functionality is stubbed, render an actionable UI element or an elegant blank state. Avoid simple `TODO` texts in the UI.

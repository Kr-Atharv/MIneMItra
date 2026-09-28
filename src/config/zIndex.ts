/**
 * Step 8 — one shared z-index scale for the whole app.
 *
 * Root cause this fixes: GISMonitoring.tsx used raw Leaflet-style values
 * (z-[400]/z-[500]/z-[600]) for its own floating legend/control panels,
 * while every modal in the app (AIAnalysisModal, RoleSwitchModal,
 * SSOModal, CMRReferenceModal, etc.) uses z-50 and the sidebar
 * (Navigation.tsx) uses z-30. Because 400/500/600 > 50, the map's panels
 * rendered above any modal and above global navigation.
 *
 * Going forward, every new stacking-context value in the app should
 * reference a named constant here instead of introducing a new arbitrary
 * z-[N] class, so this class of bug can't recur.
 *
 * Usage: Tailwind's JIT can only pick up class names that appear as
 * literal text in source, so a value imported from this file can't be
 * interpolated into a `z-[...]` className at runtime. Apply these via
 * inline style instead: style={{ zIndex: Z_INDEX.mapOverlay }}.
 */
export const Z_INDEX = {
  base: 0,
  sidebar: 30,
  mapOverlay: 35,
  dropdown: 40,
  modal: 50,
  toast: 60
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;

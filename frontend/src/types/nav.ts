export interface NavItem {
  label: string;
  path: string;
  icon: string;
  /** Extra path prefixes that should also count as "active" for this item
   * (e.g. the "Application" tab stays highlighted across every /onboarding/* step). */
  match?: string[];
}

import { ReactNode } from "react";

// Navigation item interface for sidebar
export interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  requiresAuth?: boolean;
  permission?: string;
} 
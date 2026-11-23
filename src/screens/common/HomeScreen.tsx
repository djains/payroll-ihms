import React from 'react';
import { UnifiedDashboardScreen } from './UnifiedDashboardScreen';

/**
 * Legacy HomeScreen replaced with UnifiedDashboardScreen.
 * Ensures the authentic enterprise dashboard with real live punch, working hours timer,
 * and attendance controls is always displayed across all user roles.
 */
export const HomeScreen: React.FC = () => {
  return <UnifiedDashboardScreen />;
};

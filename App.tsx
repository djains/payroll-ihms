import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OfflineBanner } from './src/components/common/OfflineBanner';
import { AppToast } from './src/components/common/AppToast';
import { LiveShiftTracker } from './src/components/common/LiveShiftTracker';
import { UpdatePromptModal } from './src/components/common/UpdatePromptModal';
import { PermissionPromptModal } from './src/components/common/PermissionPromptModal';
import { checkForInAppUpdate } from './src/services/inAppUpdate.service';

export default function App() {
  useEffect(() => {
    checkForInAppUpdate();
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <LiveShiftTracker />
      <OfflineBanner />
      <AppToast />
      <UpdatePromptModal />
      <PermissionPromptModal />
    </SafeAreaProvider>
  );
}

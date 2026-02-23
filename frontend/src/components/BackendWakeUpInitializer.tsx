'use client';

import { useEffect } from 'react';
import { initializeBackendWakeUp } from '../lib/backendWakeUp';

export default function BackendWakeUpInitializer() {
  useEffect(() => {
    // Initialize wake-up system when app loads
    initializeBackendWakeUp();
  }, []);

  return null; // This component doesn't render anything
}

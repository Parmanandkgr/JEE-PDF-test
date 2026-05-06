'use client';

import { useEffect, useState } from 'react';

interface PWAStatus {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
}

export function usePWA(): PWAStatus {
  const [status, setStatus] = useState<PWAStatus>({
    isOnline: true,
    isInstalled: false,
    canInstall: false,
  });

  useEffect(() => {
    // Check initial online status
    setStatus(prev => ({ ...prev, isOnline: navigator.onLine }));

    // Listen for online/offline events
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if app is installed
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
        setStatus(prev => ({ ...prev, isInstalled: apps.length > 0 }));
      });
    }

    // Check if install prompt is available
    const handleBeforeInstall = () => {
      setStatus(prev => ({ ...prev, canInstall: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  return status;
}

export function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => {
          console.log('Service Worker registered successfully:', reg);
          
          // Check for updates periodically
          setInterval(() => {
            reg.update();
          }, 60000); // Check every minute
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function showNotification(title: string, options?: NotificationOptions) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      options,
    });
  } else if ('Notification' in window) {
    new Notification(title, options);
  }
}

export function scheduleSyncTestResults() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => {
      (reg as any).sync.register('sync-test-results');
    });
  }
}

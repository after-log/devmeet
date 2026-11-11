import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'devmeet.installDismissedAt';
const DAY = 24 * 60 * 60 * 1000;

export const isIosDevice = (agent: string, platform: string, touchPoints: number) =>
  /iPad|iPhone|iPod/.test(agent) || (platform === 'MacIntel' && touchPoints > 1);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const usePwaInstall = () => {
  const [installed, setInstalled] = useState(isStandalone);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissedAt, setDismissedAt] = useState(() => {
    try {
      const timestamp = Number(localStorage.getItem(DISMISS_KEY));
      return timestamp > 0 && Date.now() - timestamp < DAY ? timestamp : 0;
    } catch {
      return 0;
    }
  });
  const ios = isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);

  useEffect(() => {
    if (!dismissedAt) return;
    const timer = window.setTimeout(
      () => setDismissedAt(0),
      Math.max(0, dismissedAt + DAY - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [dismissedAt]);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const mode = window.matchMedia('(display-mode: standalone)');
    const onModeChanged = () => setInstalled(isStandalone());
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    mode.addEventListener('change', onModeChanged);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mode.removeEventListener('change', onModeChanged);
    };
  }, []);

  const dismiss = () => {
    const timestamp = Date.now();
    setDismissedAt(timestamp);
    try {
      localStorage.setItem(DISMISS_KEY, String(timestamp));
    } catch {
      // Dismissal still works for this visit when storage is unavailable.
    }
  };

  const install = async () => {
    if (!prompt) return false;
    // An install event can only be used once, even when the user cancels.
    setPrompt(null);
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    else dismiss();
    return outcome === 'accepted';
  };

  return {
    installed,
    ios,
    canPrompt: prompt !== null,
    showBanner: !installed && !dismissedAt && (ios || prompt !== null),
    dismiss,
    install,
  };
};

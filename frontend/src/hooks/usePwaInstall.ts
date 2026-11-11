import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'devmeet.installDismissedAt';
const WEEK = 7 * 24 * 60 * 60 * 1000;

export const isIosDevice = (agent: string, platform: string, touchPoints: number) =>
  /iPad|iPhone|iPod/.test(agent) || (platform === 'MacIntel' && touchPoints > 1);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const usePwaInstall = () => {
  const [installed, setInstalled] = useState(isStandalone);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const timestamp = Number(localStorage.getItem(DISMISS_KEY));
      return timestamp > 0 && Date.now() - timestamp < WEEK;
    } catch {
      return false;
    }
  });
  const ios = isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);

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
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
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
    showBanner: !installed && !dismissed && (ios || prompt !== null),
    dismiss,
    install,
  };
};

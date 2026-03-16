import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWeeklyCleanReminder(): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;
    await cancelCleanReminder();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to clean your gallery! 🧹',
        body: 'You have old screenshots and forwards. Tap to free up space.',
        data: { type: 'weekly_clean' },
      },
      trigger: {
        weekday: 1,
        hour: 10,
        minute: 0,
        repeats: true,
      },
    });
    return id;
  } catch (e) {
    console.warn('Schedule error:', e);
    return null;
  }
}

export async function cancelCleanReminder(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if ((n.content.data as any)?.type === 'weekly_clean') {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {}
}

export async function hasCleanReminder(): Promise<boolean> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some(n => (n.content.data as any)?.type === 'weekly_clean');
  } catch { return false; }
}

import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

export default function AppTabs() {
  const isDark = useColorScheme() === 'dark';

  return (
    <NativeTabs
      // iOS: frosted glass tab bar (works on all iOS versions)
      blurEffect="systemMaterial"
      // Selected tab tint (icon + label)
      tintColor="#3B82F6"
      // Icon color: visible default, blue when selected
      iconColor={{
        default: isDark ? '#94A3B8' : '#64748B',
        selected: '#3B82F6',
      }}
      // Label style: always visible, bolder when selected
      labelStyle={{
        default: { color: isDark ? '#94A3B8' : '#64748B', fontSize: 10, fontWeight: '500' },
        selected: { color: '#3B82F6', fontSize: 10, fontWeight: '700' },
      }}
      // Android: subtle pill indicator + ripple
      indicatorColor="#3B82F620"
      rippleColor="#3B82F640"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'checkmark.circle', selected: 'checkmark.circle.fill' }}
          md={{ default: 'check_circle', selected: 'check_circle' }}
        />
        <NativeTabs.Trigger.Label>Habits</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tasks">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'list.bullet', selected: 'list.bullet.clipboard.fill' }}
          md={{ default: 'list', selected: 'list' }}
        />
        <NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md={{ default: 'bar_chart', selected: 'bar_chart' }}
        />
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="location">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'location', selected: 'location.fill' }}
          md={{ default: 'location_on', selected: 'location_on' }}
        />
        <NativeTabs.Trigger.Label>Tracker</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

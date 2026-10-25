import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { LocationEntry } from '@/types';
import { MapPin, Navigation, Gauge, Mountain, Radio, Wifi, WifiOff } from 'lucide-react-native';

// ─── helpers ────────────────────────────────────────────────────────────────

function mpsToKmh(mps: number | null): string {
  if (mps === null || mps < 0) return '—';
  return (mps * 3.6).toFixed(1);
}

function formatAltitude(m: number | null): string {
  if (m === null) return '—';
  return `${m.toFixed(1)} m`;
}

function formatAccuracy(m: number | null): string {
  if (m === null) return '—';
  return `±${m.toFixed(0)} m`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatCoord(val: number, type: 'lat' | 'lon'): string {
  const abs = Math.abs(val).toFixed(6);
  const dir = type === 'lat' ? (val >= 0 ? 'N' : 'S') : val >= 0 ? 'E' : 'W';
  return `${abs}° ${dir}`;
}

// ─── permission gate ─────────────────────────────────────────────────────────

function PermissionScreen({ onRequest }: { onRequest: () => void }) {
  return (
    <View style={pg.container}>
      <View style={pg.iconWrap}>
        <MapPin size={48} color="#3B82F6" />
      </View>
      <Text style={pg.title}>Live Location Tracker</Text>
      <Text style={pg.body}>
        This screen shows your real-time GPS coordinates, speed, altitude and logs every
        location update while you move.
      </Text>
      <Text style={pg.note}>
        📍 Location is only used while this screen is open and is never stored remotely.
      </Text>
      <TouchableOpacity style={pg.btn} onPress={onRequest} activeOpacity={0.85}>
        <Text style={pg.btnText}>Allow Location Access</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={pg.settingsBtn}
        onPress={() => Linking.openSettings()}
        activeOpacity={0.7}
      >
        <Text style={pg.settingsBtnText}>Open Settings instead</Text>
      </TouchableOpacity>
    </View>
  );
}

const pg = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  note: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  btn: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsBtn: {
    paddingVertical: 10,
  },
  settingsBtnText: {
    color: '#64748B',
    fontSize: 14,
  },
});

// ─── stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color: string;
}) {
  return (
    <View style={[tile.wrap, { borderColor: color + '40' }]}>
      <View style={[tile.iconBox, { backgroundColor: color + '20' }]}>{icon}</View>
      <Text style={tile.label}>{label}</Text>
      <View style={tile.valueRow}>
        <Text style={[tile.value, { color }]}>{value}</Text>
        {unit ? <Text style={tile.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const tile = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minWidth: '44%',
    alignItems: 'flex-start',
    gap: 4,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  unit: {
    fontSize: 12,
    color: '#64748B',
  },
});

// ─── main screen ─────────────────────────────────────────────────────────────

type PermStatus = 'unknown' | 'asking' | 'denied' | 'granted';

export default function LocationScreen() {
  const [permStatus, setPermStatus] = useState<PermStatus>('unknown');
  const [tracking, setTracking] = useState(false);
  const [current, setCurrent] = useState<LocationEntry | null>(null);
  const [log, setLog] = useState<LocationEntry[]>([]);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const insets = useSafeAreaInsets();
  const insets = useSafeAreaInsets();

  // Check existing permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermStatus('granted');
      } else if (status === 'denied') {
        setPermStatus('denied');
      } else {
        setPermStatus('unknown');
      }
    })();
    return () => {
      subRef.current?.remove();
    };
  }, []);

  const requestPermission = useCallback(async () => {
    setPermStatus('asking');
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermStatus(status === 'granted' ? 'granted' : 'denied');
  }, []);

  const startTracking = useCallback(async () => {
    if (subRef.current) return;
    setTracking(true);
    setLog([]);

    subRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 0,
      },
      (loc) => {
        const entry: LocationEntry = {
          id: Math.random().toString(36).substr(2, 9),
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          altitude: loc.coords.altitude,
          speed: loc.coords.speed,
          accuracy: loc.coords.accuracy,
          timestamp: loc.timestamp,
        };
        setCurrent(entry);
        setLog((prev) => [entry, ...prev].slice(0, 50));
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    subRef.current?.remove();
    subRef.current = null;
    setTracking(false);
  }, []);

  // ── permission not yet granted ────────────────────────────────────────────
  if (permStatus === 'unknown' || permStatus === 'asking' || permStatus === 'denied') {
    return (
      <PermissionScreen
        onRequest={
          permStatus === 'denied'
            ? () => Linking.openSettings()
            : requestPermission
        }
      />
    );
  }

  // ── tracker UI ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={s.heading}>Live Tracker</Text>
          <View style={s.statusRow}>
            {tracking ? (
              <Wifi size={12} color="#10B981" />
            ) : (
              <WifiOff size={12} color="#64748B" />
            )}
            <Text style={[s.statusText, { color: tracking ? '#10B981' : '#64748B' }]}>
              {tracking ? 'Tracking active' : 'Stopped'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[s.trackBtn, tracking ? s.trackBtnStop : s.trackBtnStart]}
          onPress={tracking ? stopTracking : startTracking}
          activeOpacity={0.85}
        >
          <Radio size={15} color="#FFFFFF" />
          <Text style={s.trackBtnText}>{tracking ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Coordinate display */}
        <View style={s.coordCard}>
          <View style={s.coordRow}>
            <Navigation size={14} color="#3B82F6" />
            <Text style={s.coordLabel}>Latitude</Text>
            <Text style={s.coordValue}>
              {current ? formatCoord(current.latitude, 'lat') : '—'}
            </Text>
          </View>
          <View style={s.coordDivider} />
          <View style={s.coordRow}>
            <Navigation size={14} color="#8B5CF6" style={{ transform: [{ rotate: '90deg' }] }} />
            <Text style={s.coordLabel}>Longitude</Text>
            <Text style={s.coordValue}>
              {current ? formatCoord(current.longitude, 'lon') : '—'}
            </Text>
          </View>
        </View>

        {/* Stat tiles */}
        <View style={s.tileGrid}>
          <StatTile
            icon={<Gauge size={16} color="#F59E0B" />}
            label="Speed"
            value={mpsToKmh(current?.speed ?? null)}
            unit="km/h"
            color="#F59E0B"
          />
          <StatTile
            icon={<Mountain size={16} color="#10B981" />}
            label="Altitude"
            value={current ? `${current.altitude?.toFixed(0) ?? '—'}` : '—'}
            unit="m"
            color="#10B981"
          />
          <StatTile
            icon={<MapPin size={16} color="#3B82F6" />}
            label="Accuracy"
            value={current ? `${current.accuracy?.toFixed(0) ?? '—'}` : '—'}
            unit="m"
            color="#3B82F6"
          />
          <StatTile
            icon={<Radio size={16} color="#EC4899" />}
            label="Updates"
            value={String(log.length)}
            unit="pts"
            color="#EC4899"
          />
        </View>

        {/* Update log */}
        {log.length > 0 && (
          <View style={s.logSection}>
            <Text style={s.logTitle}>Update Log</Text>
            {log.map((entry) => (
              <View key={entry.id} style={s.logRow}>
                <View style={s.logDot} />
                <View style={s.logInfo}>
                  <Text style={s.logCoords}>
                    {entry.latitude.toFixed(5)}, {entry.longitude.toFixed(5)}
                  </Text>
                  <Text style={s.logMeta}>
                    {mpsToKmh(entry.speed)} km/h · {formatAltitude(entry.altitude)} · {formatAccuracy(entry.accuracy)}
                  </Text>
                </View>
                <Text style={s.logTime}>{formatTimestamp(entry.timestamp)}</Text>
              </View>
            ))}
          </View>
        )}

        {!tracking && log.length === 0 && (
          <View style={s.idle}>
            <MapPin size={40} color="#1E3A5F" />
            <Text style={s.idleText}>Tap Start to begin tracking</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  trackBtnStart: {
    backgroundColor: '#10B981',
  },
  trackBtnStop: {
    backgroundColor: '#EF4444',
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    padding: 16,
    paddingBottom: 48,
  },
  // Coordinate card
  coordCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  coordLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    width: 80,
  },
  coordValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  coordDivider: {
    height: 1,
    backgroundColor: '#0F172A',
    marginHorizontal: -4,
  },
  // Tiles
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  // Log
  logSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
    gap: 10,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 5,
  },
  logInfo: {
    flex: 1,
  },
  logCoords: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    fontVariant: ['tabular-nums'],
  },
  logMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logTime: {
    fontSize: 11,
    color: '#475569',
    fontVariant: ['tabular-nums'],
  },
  // Idle
  idle: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 14,
  },
  idleText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
});

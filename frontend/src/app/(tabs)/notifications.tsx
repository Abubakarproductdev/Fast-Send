import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '../../config/api';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { ScreenShell } from '../../components/ScreenShell';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface Notification { id: string; trip_id: string | null; title: string; message: string; is_read: boolean; created_at: string; }

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const { organizerId } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const fetchNotifications = async () => { try { const query = organizerId ? `?organizer_id=${encodeURIComponent(organizerId)}` : ''; const res = await fetch(`${API_BASE_URL}/api/v1/notifications${query}`); if (res.ok) setNotifications(await res.json()); } catch (e) { console.warn('Failed to fetch notifications', e); } finally { setLoading(false); setRefreshing(false); } };
  useFocusEffect(useCallback(() => { fetchNotifications(); }, [organizerId]));
  const markAsRead = async (id: string) => { setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n)); try { await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, { method: 'PATCH' }); } catch (e) {} };
  const renderItem = ({ item }: { item: Notification }) => <TouchableOpacity style={[styles.card, !item.is_read && styles.cardUnread]} onPress={() => !item.is_read && markAsRead(item.id)} activeOpacity={0.82}><View style={styles.cardHeader}><View style={styles.titleRow}><View style={[styles.icon, !item.is_read && styles.iconUnread]}><Ionicons name={item.is_read ? 'checkmark-outline' : 'sparkles-outline'} size={17} color={item.is_read ? colors.textMuted : colors.primaryDark} /></View><Text style={[styles.cardTitle, !item.is_read && styles.titleUnread]}>{item.title}</Text></View><Text style={styles.timeText}>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text></View><Text style={styles.message}>{item.message}</Text></TouchableOpacity>;
  return <ScreenShell><View style={styles.header}><Text style={styles.eyebrow}>KEEPING YOU IN THE LOOP</Text><Text style={styles.title}>Inbox</Text></View>{notifications.length === 0 && !loading ? <View style={styles.emptyState}><View style={styles.emptyIcon}><Ionicons name="notifications-outline" size={29} color={colors.sageDark} /></View><Text style={styles.emptyTitle}>All caught up</Text><Text style={styles.emptyText}>When your photos finish processing, we’ll let you know here.</Text></View> : <FlatList data={notifications} keyExtractor={item => item.id} renderItem={renderItem} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor={colors.primary} />} />}</ScreenShell>;
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  header: { paddingTop: 8, marginBottom: 26 }, eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 8 }, title: { color: colors.textPrimary, fontSize: 34, fontWeight: '800', letterSpacing: -0.9 }, list: { paddingBottom: 116, gap: 13 }, card: { backgroundColor: colors.paper, borderRadius: radius.lg, padding: 17, borderWidth: 1, borderColor: colors.border }, cardUnread: { borderColor: colors.primary, backgroundColor: colors.primaryGlow }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }, icon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.bgElevated, justifyContent: 'center', alignItems: 'center' }, iconUnread: { backgroundColor: colors.bgElevated }, cardTitle: { color: colors.textSecondary, fontSize: 15, fontWeight: '700', flex: 1 }, titleUnread: { color: colors.textPrimary, fontWeight: '800' }, timeText: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginLeft: 8 }, message: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, paddingLeft: 44 }, emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100, paddingHorizontal: 35 }, emptyIcon: { width: 72, height: 72, borderRadius: 26, backgroundColor: colors.sage, justifyContent: 'center', alignItems: 'center', marginBottom: 17 }, emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 7 }, emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});

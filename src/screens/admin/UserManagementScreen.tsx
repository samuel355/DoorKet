// src/screens/UserManagementScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  useTheme,
  Searchbar,
  Chip,
  Avatar,
  Portal,
  Modal,
  Button,
  Divider,
  IconButton,
  Card,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import type { User as AppUser } from "@/types";
import supabase from "@/services/supabase"; // ← change if your export differs
import { ProfileService } from "@/services/profileService";

/* ---------- color utils (for soft tints) ---------- */
type RGB = { r: number; g: number; b: number };
function parseHex(hex: string): RGB | null {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) return { r: parseInt(h[0]+h[0],16), g: parseInt(h[1]+h[1],16), b: parseInt(h[2]+h[2],16) };
  if (h.length >= 6) {
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    if ([r,g,b].every(Number.isFinite)) return { r,g,b };
  }
  return null;
}
function parseRgbFunc(input: string): RGB | null {
  const m = input.replace(/\s+/g,"").match(/^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,[\d.]+)?\)$/i);
  if (!m) return null;
  const [r,g,b] = [m[1],m[2],m[3]].map(n => Math.min(255, parseInt(n,10)));
  return { r,g,b };
}
function toRGB(color: string, fallback = "#FF9800"): RGB {
  if (typeof color === "string") {
    if (color.startsWith("#")) { const px = parseHex(color); if (px) return px; }
    if (color.toLowerCase().startsWith("rgb")) { const pr = parseRgbFunc(color); if (pr) return pr; }
  }
  return parseHex(fallback)!;
}
function rgba(color: string, alpha = 1): string {
  const { r,g,b } = toRGB(color);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* ---------- constants ---------- */
const PAGE_SIZE = 20;
const STATUS = { good: "#16A34A", warn: "#F59E0B", danger: "#DC2626" };

const useDebounced = (value: string, delay = 350) => {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return v;
};

/* ---------- subtle, nice shadows ---------- */
const shadowSm = Platform.select({
  ios: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 2 },
});
const shadowMd = Platform.select({
  ios: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 3 },
});

const UserManagementScreen: React.FC = () => {
  const theme = useTheme();
  const PRIMARY = theme?.colors?.primary ?? "#FF9800";

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);

  const [role, setRole] = useState<"all" | "student" | "runner" | "admin">("all");
  const [verified, setVerified] = useState<"all" | "yes" | "no">("all");
  const [active, setActive] = useState<"all" | "yes" | "no">("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [selected, setSelected] = useState<AppUser | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPage = useCallback(
    async (pageIndex: number) => {
      let q = supabase
        .from("users")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      const term = debouncedQuery.trim();
      if (term.length > 0) {
        q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
      }
      if (role !== "all") q = q.eq("user_type", role);
      if (verified !== "all") q = q.eq("is_verified", verified === "yes");
      if (active !== "all") q = q.eq("is_active", active === "yes");

      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await q.range(from, to);
      if (error) throw error;
      return { rows: (data as AppUser[]) ?? [], count: count ?? 0 };
    },
    [debouncedQuery, role, verified, active]
  );

  const loadFirst = useCallback(async () => {
    setLoading(true);
    try {
      const { rows, count } = await fetchPage(0);
      setUsers(rows);
      setHasMore(rows.length < (count ?? 0));
      setPage(0);
    } catch (e) {
      console.error("Load users failed:", e);
      setUsers([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirst();
    setRefreshing(false);
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (loading || refreshing || !hasMore) return;
    const next = page + 1;
    try {
      const { rows, count } = await fetchPage(next);
      setUsers((prev) => [...prev, ...rows]);
      setHasMore((next + 1) * PAGE_SIZE < (count ?? 0));
      setPage(next);
    } catch (e) {
      console.error("Pagination error:", e);
      setHasMore(false);
    }
  }, [page, loading, refreshing, hasMore, fetchPage]);

  useEffect(() => { loadFirst(); }, [debouncedQuery, role, verified, active, loadFirst]);

  const toggleVerified = async (u: AppUser) => {
    setSaving(true);
    try {
      const { error } = await ProfileService.updateUserProfile(u.id, { is_verified: !u.is_verified } as any);
      if (error) throw new Error(error);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_verified: !u.is_verified } : x)));
      setSelected((s) => (s ? { ...s, is_verified: !s.is_verified } : s));
    } catch (e) { console.error("verify toggle failed:", e); } finally { setSaving(false); }
  };

  const toggleActive = async (u: AppUser) => {
    setSaving(true);
    try {
      const { error } = await ProfileService.updateUserProfile(u.id, { is_active: !u.is_active } as any);
      if (error) throw new Error(error);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: !u.is_active } : x)));
      setSelected((s) => (s ? { ...s, is_active: !s.is_active } : s));
    } catch (e) { console.error("active toggle failed:", e); } finally { setSaving(false); }
  };

  const changeRole = async (u: AppUser, newRole: "student" | "runner" | "admin") => {
    setSaving(true);
    try {
      const { error } = await ProfileService.updateUserProfile(u.id, { user_type: newRole } as any);
      if (error) throw new Error(error);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, user_type: newRole } : x)));
      setSelected((s) => (s ? { ...s, user_type: newRole } : s));
    } catch (e) { console.error("role change failed:", e); } finally { setSaving(false); }
  };

  /* ---------- header ---------- */
  const Header = () => (
    <View style={styles.headerWrap}>
      <View style={[styles.headerRow, shadowMd]}>
        <View style={[styles.iconContainer, { backgroundColor: rgba(PRIMARY, 0.12) }]}>
          <Ionicons name="people" size={20} color={PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtitle}>Manage students, runners, and admins</Text>
        </View>
        <IconButton
          icon="refresh"
          onPress={onRefresh}
          size={20}
          style={styles.refreshBtn}
          iconColor={PRIMARY}
          accessibilityLabel="Refresh"
        />
      </View>

      <View style={[styles.card, shadowSm]}>
        <Searchbar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, email, phone"
          style={styles.search}
          inputStyle={{ fontSize: 14 }}
          iconColor={rgba(PRIMARY, 0.8)}
        />

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Filters</Text>

        <View style={styles.chipsRow}>
          {(["all", "student", "runner", "admin"] as const).map((r) => (
            <Chip
              key={r}
              selected={role === r}
              onPress={() => setRole(r)}
              style={[styles.chip, role === r && { backgroundColor: rgba(PRIMARY, 0.12) }]}
              textStyle={{ color: role === r ? PRIMARY : "#0F172A" }}
              showSelectedCheck
            >
              {r === "all" ? "All Roles" : r[0].toUpperCase() + r.slice(1)}
            </Chip>
          ))}
        </View>

        <View style={styles.chipsRow}>
          {(["all", "yes", "no"] as const).map((v) => (
            <Chip
              key={`ver_${v}`}
              selected={verified === v}
              onPress={() => setVerified(v)}
              style={[styles.chip, verified === v && { backgroundColor: rgba(PRIMARY, 0.12) }]}
              textStyle={{ color: verified === v ? PRIMARY : "#0F172A" }}
              showSelectedCheck
            >
              {v === "all" ? "All Verif." : v === "yes" ? "Verified" : "Unverified"}
            </Chip>
          ))}
        </View>

        <View style={styles.chipsRow}>
          {(["all", "yes", "no"] as const).map((v) => (
            <Chip
              key={`act_${v}`}
              selected={active === v}
              onPress={() => setActive(v)}
              style={[styles.chip, active === v && { backgroundColor: rgba(PRIMARY, 0.12) }]}
              textStyle={{ color: active === v ? PRIMARY : "#0F172A" }}
              showSelectedCheck
            >
              {v === "all" ? "All Status" : v === "yes" ? "Active" : "Inactive"}
            </Chip>
          ))}
        </View>
      </View>
    </View>
  );

  /* ---------- empty state ---------- */
  const Empty = () => (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: rgba(PRIMARY, 0.12) }]}>
        <Ionicons name="people-outline" size={24} color={PRIMARY} />
      </View>
      <Text style={styles.emptyTitle}>No users found</Text>
      <Text style={styles.emptySub}>Try adjusting filters or search terms.</Text>
    </View>
  );

  /* ---------- row ---------- */
  const renderItem = ({ item }: { item: AppUser }) => {
    const initials = (item.full_name || item.email || "U").slice(0, 1).toUpperCase();
    return (
      <Card style={[styles.rowCard, shadowSm]}>
        <Pressable
          onPress={() => setSelected(item)}
          android_ripple={{ color: rgba(PRIMARY, 0.08), borderless: false }}
          style={styles.rowPress}
        >
          <View style={styles.rowFlat}>
            <Avatar.Text
              size={40}
              label={initials}
              style={{ backgroundColor: rgba(PRIMARY, 0.15) }}
              color={PRIMARY}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowName}>{item.full_name || "Unknown User"}</Text>
              <Text style={styles.rowSub}>{item.email}</Text>
              <View style={{ flexDirection: "row", marginTop: 6 }}>
                <Badge label={item.user_type ?? "unknown"} color={PRIMARY} bg={rgba(PRIMARY, 0.12)} />
                <Badge
                  label={item.is_verified ? "Verified" : "Unverified"}
                  color={item.is_verified ? STATUS.good : STATUS.warn}
                  bg={rgba(item.is_verified ? STATUS.good : STATUS.warn, 0.12)}
                />
                <Badge
                  label={item.is_active ? "Active" : "Inactive"}
                  color={item.is_active ? STATUS.good : STATUS.danger}
                  bg={rgba(item.is_active ? STATUS.good : STATUS.danger, 0.12)}
                />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>
        </Pressable>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {loading && users.length === 0 ? (
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={Header}
          ListEmptyComponent={Empty}
          onEndReachedThreshold={0.3}
          onEndReached={loadMore}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={PRIMARY} />
              </View>
            ) : null
          }
        />
      )}

      {/* Details modal */}
      <Portal>
        <Modal visible={!!selected} onDismiss={() => setSelected(null)} contentContainerStyle={[styles.modalFlat, shadowMd]}>
          {selected && (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Avatar.Text
                  size={44}
                  label={(selected.full_name || selected.email || "U").slice(0, 1).toUpperCase()}
                  style={{ backgroundColor: rgba(PRIMARY, 0.15) }}
                  color={PRIMARY}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.modalName}>{selected.full_name || "Unknown User"}</Text>
                  <Text style={styles.modalSub}>{selected.email}</Text>
                </View>
                <IconButton icon="close" onPress={() => setSelected(null)} />
              </View>

              <Divider style={styles.divider} />

              <View style={{ marginTop: 12 }}>
                <Text style={styles.modalLabel}>Role</Text>
                <View style={styles.chipsRow}>
                  {(["student", "runner", "admin"] as const).map((r) => (
                    <Chip
                      key={r}
                      selected={selected.user_type === r}
                      onPress={() => changeRole(selected, r)}
                      style={[styles.chip, selected.user_type === r && { backgroundColor: rgba(PRIMARY, 0.12) }]}
                      textStyle={{ color: selected.user_type === r ? PRIMARY : "#0F172A" }}
                      showSelectedCheck
                      disabled={saving}
                    >
                      {r[0].toUpperCase() + r.slice(1)}
                    </Chip>
                  ))}
                </View>

                <View style={[styles.modalActionRow, { marginTop: 8 }]}>
                  <Button
                    mode={selected.is_verified ? "outlined" : "contained"}
                    onPress={() => toggleVerified(selected)}
                    buttonColor={selected.is_verified ? undefined : PRIMARY}
                    textColor={selected.is_verified ? PRIMARY : "#fff"}
                    disabled={saving}
                    style={{ flex: 1, marginRight: 8 }}
                    icon={selected.is_verified ? "check-decagram" : "check"}
                  >
                    {selected.is_verified ? "Unverify" : "Verify"}
                  </Button>
                  <Button
                    mode={selected.is_active ? "outlined" : "contained"}
                    onPress={() => toggleActive(selected)}
                    buttonColor={selected.is_active ? undefined : PRIMARY}
                    textColor={selected.is_active ? PRIMARY : "#fff"}
                    disabled={saving}
                    style={{ flex: 1, marginLeft: 8 }}
                    icon={selected.is_active ? "pause-circle" : "play-circle"}
                  >
                    {selected.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </View>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

/* ---------- small components ---------- */
const Badge: React.FC<{ label: string; color: string; bg: string }> = ({ label, color, bg }) => (
  <View style={[styles.badge, { backgroundColor: bg }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7FB" },
  container: { flex: 1, backgroundColor: "#F7F7FB" },
  center: { justifyContent: "center", alignItems: "center" },

  listContent: { padding: 16, paddingBottom: 28 },

  headerWrap: { marginBottom: 12 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
  },
  iconContainer: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  refreshBtn: {
    marginLeft: "auto",
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  card: {
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  search: { borderRadius: 12, elevation: 0 },
  divider: { height: 1, backgroundColor: "#EEF2F7", marginVertical: 12 },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: { marginRight: 8, marginBottom: 8 },

  rowCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
  },
  rowPress: { borderRadius: 14, overflow: "hidden" },
  rowFlat: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  rowName: { fontSize: 15, color: "#0F172A", fontWeight: "700" },
  rowSub: { fontSize: 12, color: "#64748B", marginTop: 2 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  footerLoading: { paddingVertical: 16 },

  emptyWrap: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: {
    width: 54, height: 54, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  emptySub: { fontSize: 13, color: "#64748B", marginTop: 4 },

  modalFlat: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  modalName: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  modalSub: { fontSize: 12, color: "#64748B" },
  modalLabel: { fontSize: 12, color: "#64748B", marginTop: 4, marginBottom: 6 },
  modalActionRow: { flexDirection: "row", alignItems: "center" },
});

export default UserManagementScreen;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  FlatList,
  RefreshControl,
  Pressable,
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
  Snackbar,
  TextInput,
  Switch,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { CategoryAdmin } from "@/services/adminService";

type UICategory = {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  sort_order?: number | null;
  created_at?: string | null;
};

type RGB = { r: number; g: number; b: number };
const parseHex = (hex: string): RGB | null => {
  const h = hex.replace("#", "").trim();
  if (h.length === 3)
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  if (h.length >= 6) {
    const r = parseInt(h.slice(0, 2), 16),
      g = parseInt(h.slice(2, 4), 16),
      b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].every(Number.isFinite)) return { r, g, b };
  }
  return null;
};
const toRGB = (c: string, fb = "#FF9800") => parseHex(c) ?? parseHex(fb)!;
const rgba = (c: string, a = 1) => {
  const { r, g, b } = toRGB(c);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
};

const useDebounced = (value: string, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
};

// ultra-light shadows
const shadowCard = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
  },
  android: { elevation: 1.5 },
});
const shadowHeader = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  android: { elevation: 1 },
});

type Filter = "all" | "active" | "inactive";

const CategoryManagementScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const theme = useTheme();
  const PRIMARY = theme?.colors?.primary ?? "#FF9800";

  const [query, setQuery] = useState("");
  const q = useDebounced(query);
  const [filter, setFilter] = useState<Filter>("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<UICategory[]>([]);
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UICategory | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await CategoryAdmin.list({ includeInactive: true });
      if (res.error) throw new Error(res.error);
      const rows = (res.data as any[] as UICategory[]) ?? [];
      rows.sort((a, b) => {
        const sa = a.sort_order ?? 0,
          sb = b.sort_order ?? 0;
        if (sa !== sb) return sa - sb;
        const ta = new Date(a.created_at ?? 0).getTime();
        const tb = new Date(b.created_at ?? 0).getTime();
        return tb - ta;
      });
      setItems(rows);
    } catch (e) {
      console.error("Category load failed:", e);
      setItems([]);
      setSnack({ visible: true, text: "Failed to load categories" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((c) => {
      if (filter === "active" && !c.is_active) return false;
      if (filter === "inactive" && c.is_active) return false;
      if (s.length > 0) {
        const hay = `${c.name} ${c.description ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [items, filter, q]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDesc("");
    setActive(true);
    setModalOpen(true);
  };

  const openEdit = (c: UICategory) => {
    setEditing(c);
    setName(c.name);
    setDesc(c.description ?? "");
    setActive(!!c.is_active);
    setModalOpen(true);
  };

  const saveCategory = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setSnack({ visible: true, text: "Name is required" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { data, error } = await CategoryAdmin.update(editing.id, {
          name: trimmed,
          description: desc || null,
          is_active: active,
        } as any);
        if (error) throw new Error(error);
        const updated = data as any as UICategory;
        setItems((prev) =>
          prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x))
        );
        setSnack({ visible: true, text: "Category updated" });
      } else {
        const maxSort = items.reduce(
          (m, x) => Math.max(m, x.sort_order ?? 0),
          0
        );
        const { data, error } = await CategoryAdmin.create({
          name: trimmed,
          description: desc || null,
          is_active: active,
          sort_order: maxSort + 1,
        } as any);
        if (error) throw new Error(error);
        setItems((prev) =>
          [...prev, data as any as UICategory].sort(
            (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          )
        );
        setSnack({ visible: true, text: "Category created" });
      }
      setModalOpen(false);
    } catch (e) {
      console.error("Save category failed:", e);
      setSnack({ visible: true, text: "Failed to save category" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: UICategory) => {
    const next = !c.is_active;
    setItems((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, is_active: next } : x))
    );
    try {
      const { error } = await CategoryAdmin.toggleActive(c.id, next);
      if (error) throw new Error(error);
      setSnack({
        visible: true,
        text: next ? "Category activated" : "Category deactivated",
      });
    } catch (e) {
      setItems((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, is_active: !next } : x))
      );
      setSnack({ visible: true, text: "Failed to update status" });
    }
  };

  const move = async (globalIndex: number, dir: -1 | 1) => {
    const arr = items.slice();
    const j = globalIndex + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[globalIndex], arr[j]] = [arr[j], arr[globalIndex]];
    setItems(arr);
    try {
      const ids = arr.map((x) => x.id);
      const { error } = await CategoryAdmin.reorder(ids);
      if (error) throw new Error(error);
    } catch (e) {
      setSnack({ visible: true, text: "Failed to reorder. Refreshing…" });
      await load();
    }
  };

  const moveFromFiltered = (filteredIndex: number, dir: -1 | 1) => {
    if (q.trim()) {
      setSnack({ visible: true, text: "Clear search before reordering" });
      return;
    }
    const id = filtered[filteredIndex]?.id;
    if (!id) return;
    const globalIndex = items.findIndex((x) => x.id === id);
    if (globalIndex < 0) return;
    move(globalIndex, dir);
  };

  const goToItems = (c: UICategory, openNew = false) => {
    navigation?.navigate("ItemManagement", {
      categoryId: c.id,
      categoryName: c.name,
      openNew,
    });
  };

  const Header = () => (
    <View style={styles.headerWrap}>
      <View style={[styles.headerRow, shadowHeader]}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: rgba(PRIMARY, 0.12) },
          ]}
        >
          <Ionicons name="albums" size={20} color={PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Category Management</Text>
          <Text style={styles.subtitle}>Organize product categories</Text>
        </View>
        <Button
          mode="contained"
          onPress={openCreate}
          style={styles.addBtn}
          buttonColor={PRIMARY}
          textColor="#fff"
          icon="plus"
        >
          New
        </Button>
      </View>

      <View style={[styles.card, shadowCard]}>
        <Searchbar
          value={query}
          onChangeText={setQuery}
          placeholder="Search categories"
          style={styles.search}
          inputStyle={{ fontSize: 14 }}
        />
        <Divider style={styles.divider} />
        <Text style={styles.sectionTitle}>Filter</Text>
        <View style={styles.chipsRow}>
          {(["all", "active", "inactive"] as const).map((f) => (
            <Chip
              key={f}
              selected={filter === f}
              onPress={() => setFilter(f)}
              style={[
                styles.chip,
                filter === f && { backgroundColor: rgba(PRIMARY, 0.12) },
              ]}
              textStyle={{ color: filter === f ? PRIMARY : "#0F172A" }}
              showSelectedCheck
            >
              {f[0].toUpperCase() + f.slice(1)}
            </Chip>
          ))}
        </View>
      </View>
    </View>
  );

  const Empty = () => (
    <View style={styles.emptyWrap}>
      <View
        style={[styles.emptyIcon, { backgroundColor: rgba(PRIMARY, 0.12) }]}
      >
        <Ionicons name="albums-outline" size={24} color={PRIMARY} />
      </View>
      <Text style={styles.emptyTitle}>No categories</Text>
      <Text style={styles.emptySub}>Try creating a new category.</Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: UICategory; index: number }) => (
    <Card style={[styles.rowCard, shadowCard]}>
      <Pressable onPress={() => openEdit(item)} style={styles.rowPress}>
        <View style={styles.rowFlat}>
          <Avatar.Icon
            size={42}
            icon="shape"
            style={{ backgroundColor: rgba(PRIMARY, 0.15) }}
            color={PRIMARY}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.rowName}>{item.name}</Text>
            {!!item.description && (
              <Text style={styles.rowSub} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <View
              style={{
                flexDirection: "row",
                marginTop: 6,
                alignItems: "center",
              }}
            >
              <StatusPill
                label={item.is_active ? "Active" : "Inactive"}
                color={item.is_active ? "#16A34A" : "#EF4444"}
              />
            </View>
          </View>

          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <IconButton
              icon="chevron-up"
              onPress={() => moveFromFiltered(index, -1)}
              disabled={!!q.trim() || index === 0}
            />
            <IconButton
              icon="chevron-down"
              onPress={() => moveFromFiltered(index, +1)}
              disabled={!!q.trim() || index === filtered.length - 1}
            />
          </View>

          {/* NEW: quick actions */}
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <IconButton
              icon="format-list-bulleted"
              onPress={() => goToItems(item, false)}
              accessibilityLabel="View items in category"
            />
            <IconButton
              icon="plus"
              onPress={() => goToItems(item, true)}
              accessibilityLabel="Add item to this category"
            />
          </View>

          <IconButton
            icon={item.is_active ? "check-circle" : "close-circle"}
            iconColor={item.is_active ? "#16A34A" : "#EF4444"}
            onPress={() => toggleActive(item)}
          />
        </View>
      </Pressable>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left","right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {loading && items.length === 0 ? (
        <View style={[styles.container, styles.center]}>
          <Text>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={Header}
          ListEmptyComponent={Empty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <Portal>
        <Modal
          visible={modalOpen}
          onDismiss={() => setModalOpen(false)}
          contentContainerStyle={[styles.modal, shadowCard]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: rgba(PRIMARY, 0.12), marginRight: 10 },
              ]}
            >
              <Ionicons name="albums" size={18} color={PRIMARY} />
            </View>
            <Text style={styles.modalTitle}>
              {editing ? "Edit Category" : "New Category"}
            </Text>
          </View>
          <Divider style={styles.divider} />

          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            style={{ marginTop: 8 }}
            mode="outlined"
          />
          <TextInput
            label="Description"
            value={desc}
            onChangeText={setDesc}
            style={{ marginTop: 10 }}
            mode="outlined"
            multiline
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 14,
            }}
          >
            <Switch value={active} onValueChange={setActive} />
            <Text style={{ marginLeft: 10 }}>
              {active ? "Active" : "Inactive"}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setModalOpen(false)}
              style={{ marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={saveCategory}
              loading={saving}
              disabled={saving}
              buttonColor={PRIMARY}
              textColor="#fff"
            >
              {editing ? "Save" : "Create"}
            </Button>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, text: "" })}
        duration={2200}
      >
        {snack.text}
      </Snackbar>
    </SafeAreaView>
  );
};

const StatusPill: React.FC<{ label: string; color: string }> = ({
  label,
  color,
}) => (
  <View style={[styles.pill, { backgroundColor: rgba(color, 0.15) }]}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={[styles.pillText, { color }]}>{label}</Text>
  </View>
);

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
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },

  addBtn: { borderRadius: 10 },

  card: {
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  search: { borderRadius: 12, elevation: 0 },
  divider: { height: 1, backgroundColor: "#EEF2F7", marginVertical: 12 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap" },
  chip: { marginRight: 8, marginBottom: 8 },

  rowCard: { backgroundColor: "#fff", borderRadius: 14, marginBottom: 12 },
  rowPress: { borderRadius: 14, overflow: "hidden" },
  rowFlat: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  rowName: { fontSize: 15, color: "#0F172A", fontWeight: "700" },
  rowSub: { fontSize: 12, color: "#64748B", marginTop: 2 },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { fontSize: 11, fontWeight: "700" },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },

  emptyWrap: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  emptySub: { fontSize: 13, color: "#64748B" },

  modal: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
});

export default CategoryManagementScreen;

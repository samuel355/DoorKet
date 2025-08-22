import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  FlatList,
  RefreshControl,
  Pressable,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  useTheme,
  Searchbar,
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
  Menu,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { CategoryAdmin, ItemAdmin } from "@/services/adminService";

type UICategory = { id: string; name: string; is_active: boolean };
type UIItem = {
  id: string;
  name: string;
  description?: string | null;
  base_price?: number | null;
  is_available: boolean;
  category_id: string;
  category?: { id: string; name: string } | null;
  created_at?: string | null;
  image_url?: string | null;
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

const shadowCard = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
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

const useDebounced = (value: string, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
};

const ItemManagementScreen: React.FC<{
  navigation?: any;
  route?: { params?: { categoryId?: string } };
}> = ({ route }) => {
  const theme = useTheme();
  const PRIMARY = theme?.colors?.primary ?? "#FF9800";

  const initialCategoryId = route?.params?.categoryId;
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [categoryId, setCategoryId] = useState<string | "all">(
    initialCategoryId ?? "all",
  );

  const [query, setQuery] = useState("");
  const q = useDebounced(query);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<UIItem[]>([]);
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UIItem | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState<string>("");
  const [available, setAvailable] = useState(true);
  const [itemCategoryId, setItemCategoryId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    const res = await CategoryAdmin.list({ includeInactive: true });
    if (!res.error) {
      const rows = (res.data as any[] as UICategory[]).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      setCategories(rows);
      if (initialCategoryId && rows.find((c) => c.id === initialCategoryId)) {
        setCategoryId(initialCategoryId);
      }
    }
  }, [initialCategoryId]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ItemAdmin.list({
        category_id: categoryId === "all" ? undefined : categoryId,
        onlyAvailable: onlyAvailable || undefined,
        search: q.trim() || undefined,
      });
      if (res.error) throw new Error(res.error);
      const rows = (res.data as any[] as UIItem[]) ?? [];
      rows.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      );
      setItems(rows);
    } catch (e) {
      console.error("Item load failed:", e);
      setItems([]);
      setSnack({ visible: true, text: "Failed to load items" });
    } finally {
      setLoading(false);
    }
  }, [categoryId, onlyAvailable, q]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), loadItems()]);
    setRefreshing(false);
  }, [loadCategories, loadItems]);

  const filtered = useMemo(() => items, [items]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDesc("");
    setPrice("");
    setAvailable(true);
    setItemCategoryId(
      categoryId === "all" ? (categories[0]?.id ?? "") : categoryId,
    );
    setImageUri("");
    setModalOpen(true);
  };

  const openEdit = (it: UIItem) => {
    setEditing(it);
    setName(it.name ?? "");
    setDesc(it.description ?? "");
    setPrice(
      typeof it.base_price === "number" && !isNaN(it.base_price)
        ? String(it.base_price)
        : "",
    );
    setAvailable(!!it.is_available);
    setItemCategoryId(it.category_id);
    setImageUri(it.image_url || "");
    setModalOpen(true);
  };

  const saveItem = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setSnack({ visible: true, text: "Name is required" });
      return;
    }
    if (!itemCategoryId) {
      setSnack({ visible: true, text: "Pick a category" });
      return;
    }
    const num = Number(price);
    if (price.length > 0 && (isNaN(num) || num < 0)) {
      setSnack({ visible: true, text: "Invalid price" });
      return;
    }

    setSaving(true);
    try {
      let itemData = {
        name: trimmed,
        description: desc || null,
        base_price: price.length ? num : null,
        is_available: available,
        category_id: itemCategoryId,
      };

      if (editing) {
        const { data, error } = await ItemAdmin.update(
          editing.id,
          itemData as any,
        );
        if (error) throw new Error(error);
        const updated = data as any as UIItem;

        // Upload image if new image selected
        if (imageUri && imageUri !== editing.image_url) {
          setUploading(true);
          const fileName = `${Date.now()}.jpg`;
          const uploadResult = await ItemAdmin.uploadItemImage(
            editing.id,
            imageUri,
            fileName,
          );
          if (!uploadResult.error) {
            updated.image_url = uploadResult.data?.publicUrl;
          }
          setUploading(false);
        }

        setItems((prev) =>
          prev.map((x) => (x.id === editing.id ? { ...x, ...updated } : x)),
        );
        setSnack({ visible: true, text: "Item updated" });
      } else {
        const { data, error } = await ItemAdmin.create(itemData as any);
        if (error) throw new Error(error);
        const newItem = data as any as UIItem;

        // Upload image if selected
        if (imageUri) {
          setUploading(true);
          const fileName = `${Date.now()}.jpg`;
          const uploadResult = await ItemAdmin.uploadItemImage(
            newItem.id,
            imageUri,
            fileName,
          );
          if (!uploadResult.error) {
            newItem.image_url = uploadResult.data?.publicUrl;
          }
          setUploading(false);
        }

        setItems((prev) => [newItem, ...prev]);
        setSnack({ visible: true, text: "Item created" });
      }
      setModalOpen(false);
    } catch (e) {
      console.error("Save item failed:", e);
      setSnack({ visible: true, text: "Failed to save item" });
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (it: UIItem) => {
    const next = !it.is_available;
    setItems((prev) =>
      prev.map((x) => (x.id === it.id ? { ...x, is_available: next } : x)),
    );
    try {
      const { error } = await ItemAdmin.toggleAvailable(it.id, next);
      if (error) throw new Error(error);
      setSnack({
        visible: true,
        text: next ? "Item enabled" : "Item disabled",
      });
    } catch {
      setItems((prev) =>
        prev.map((x) => (x.id === it.id ? { ...x, is_available: !next } : x)),
      );
      setSnack({ visible: true, text: "Failed to update status" });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setSnack({ visible: true, text: "Permission required to choose image" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const CategoryPicker = () => (
    <Menu
      visible={menuOpen}
      onDismiss={() => setMenuOpen(false)}
      anchor={
        <Pressable
          onPress={() => setMenuOpen(true)}
          style={[styles.catAnchor, shadowCard]}
        >
          <Text style={styles.catAnchorText}>
            {categoryId === "all"
              ? "All Categories"
              : (categories.find((c) => c.id === categoryId)?.name ??
                "Category")}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#64748B" />
        </Pressable>
      }
      contentStyle={{ borderRadius: 12 }}
    >
      <Menu.Item
        onPress={() => {
          setCategoryId("all");
          setMenuOpen(false);
        }}
        title="All Categories"
      />
      <Divider />
      {categories.map((c) => (
        <Menu.Item
          key={c.id}
          onPress={() => {
            setCategoryId(c.id);
            setMenuOpen(false);
          }}
          title={c.name}
        />
      ))}
    </Menu>
  );

  const Header = () => (
    <View style={styles.headerWrap}>
      <View style={[styles.headerRow, shadowHeader]}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: rgba(PRIMARY, 0.12) },
          ]}
        >
          <Ionicons name="pricetags" size={20} color={PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Item Management</Text>
          <Text style={styles.subtitle}>Add and manage items by category</Text>
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
        <View style={styles.rowBetween}>
          <CategoryPicker />
          <View style={styles.availRow}>
            <Switch value={onlyAvailable} onValueChange={setOnlyAvailable} />
            <Text style={{ marginLeft: 8 }}>Only available</Text>
          </View>
        </View>

        <Searchbar
          value={query}
          onChangeText={setQuery}
          placeholder="Search items"
          style={styles.search}
          inputStyle={{ fontSize: 14 }}
        />
      </View>
    </View>
  );

  const Empty = () => (
    <View style={styles.emptyWrap}>
      <View
        style={[styles.emptyIcon, { backgroundColor: rgba(PRIMARY, 0.12) }]}
      >
        <Ionicons name="cube-outline" size={24} color={PRIMARY} />
      </View>
      <Text style={styles.emptyTitle}>No items</Text>
      <Text style={styles.emptySub}>
        Try another category or add a new item.
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: UIItem }) => (
    <Card style={[styles.rowCard, shadowCard]}>
      <Pressable onPress={() => openEdit(item)} style={styles.rowPress}>
        <View style={styles.rowFlat}>
          <Avatar.Icon
            size={42}
            icon="cube"
            style={{ backgroundColor: rgba(PRIMARY, 0.15) }}
            color={PRIMARY}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.rowName}>{item.name}</Text>
            <Text style={styles.rowSub} numberOfLines={1}>
              {(item.category?.name ||
                categories.find((c) => c.id === item.category_id)?.name ||
                "Category") +
                (typeof item.base_price === "number"
                  ? ` • GHS ${item.base_price.toFixed(2)}`
                  : "")}
            </Text>
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
                label={item.is_available ? "Available" : "Unavailable"}
                color={item.is_available ? "#16A34A" : "#EF4444"}
              />
            </View>
          </View>
          <IconButton
            icon={item.is_available ? "check-circle" : "close-circle"}
            iconColor={item.is_available ? "#16A34A" : "#EF4444"}
            onPress={() => toggleAvailability(item)}
          />
        </View>
      </Pressable>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
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
          dismissable={false}
          contentContainerStyle={[styles.modal, shadowCard]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
            >
              <View>
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
                    <Ionicons name="cube" size={18} color={PRIMARY} />
                  </View>
                  <Text style={styles.modalTitle}>
                    {editing ? "Edit Item" : "New Item"}
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
                <TextInput
                  label="Price (GHS)"
                  value={price}
                  onChangeText={setPrice}
                  style={{ marginTop: 10 }}
                  mode="outlined"
                  keyboardType="decimal-pad"
                />

                {/* Image picker */}
                <View style={{ marginTop: 12 }}>
                  <Text
                    style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}
                  >
                    Image
                  </Text>
                  <Pressable
                    onPress={pickImage}
                    style={[
                      {
                        height: 120,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                        borderStyle: "dashed",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#F8FAFC",
                        overflow: "hidden",
                      },
                      shadowCard,
                    ]}
                  >
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 7,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ alignItems: "center" }}>
                        <Ionicons name="camera" size={32} color="#94A3B8" />
                        <Text
                          style={{
                            color: "#64748B",
                            marginTop: 4,
                            fontSize: 12,
                          }}
                        >
                          Tap to add image
                        </Text>
                      </View>
                    )}
                  </Pressable>
                  {imageUri && (
                    <Button
                      mode="text"
                      onPress={() => setImageUri("")}
                      style={{ marginTop: 4 }}
                      textColor="#EF4444"
                    >
                      Remove Image
                    </Button>
                  )}
                </View>

                {/* Category selector inside modal */}
                <View style={{ marginTop: 12 }}>
                  <Text
                    style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}
                  >
                    Category
                  </Text>
                  <Menu
                    visible={menuOpen}
                    onDismiss={() => setMenuOpen(false)}
                    anchor={
                      <Pressable
                        onPress={() => setMenuOpen(true)}
                        style={[styles.catAnchor, shadowCard]}
                      >
                        <Text style={styles.catAnchorText}>
                          {categories.find((c) => c.id === itemCategoryId)
                            ?.name || "Select category"}
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={16}
                          color="#64748B"
                        />
                      </Pressable>
                    }
                    contentStyle={{ borderRadius: 12 }}
                  >
                    {categories.map((c) => (
                      <Menu.Item
                        key={c.id}
                        onPress={() => {
                          setItemCategoryId(c.id);
                          setMenuOpen(false);
                        }}
                        title={c.name}
                      />
                    ))}
                  </Menu>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 14,
                  }}
                >
                  <Switch value={available} onValueChange={setAvailable} />
                  <Text style={{ marginLeft: 10 }}>
                    {available ? "Available" : "Unavailable"}
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
                    onPress={() => {
                      Keyboard.dismiss();
                      saveItem();
                    }}
                    loading={saving || uploading}
                    disabled={saving || uploading}
                    buttonColor={PRIMARY}
                    textColor="#fff"
                  >
                    {uploading ? "Uploading..." : editing ? "Save" : "Create"}
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
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
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginLeft: 10 },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2, marginLeft: 10 },

  addBtn: { borderRadius: 10 },

  card: {
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  search: { borderRadius: 12, elevation: 0, marginTop: 12 },
  divider: { height: 1, backgroundColor: "#EEF2F7", marginVertical: 12 },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  availRow: { flexDirection: "row", alignItems: "center" },

  catAnchor: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 160,
  },
  catAnchorText: { fontSize: 13, color: "#0F172A", marginRight: 8 },

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

export default ItemManagementScreen;

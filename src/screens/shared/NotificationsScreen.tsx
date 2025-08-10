// src/screens/shared/NotificationsScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
import { View, FlatList, RefreshControl, StyleSheet } from "react-native";
import { Text, IconButton, List, useTheme } from "react-native-paper";
import { supabase } from "@/services/supabase";
import NotificationService from "@/services/notificationService";

const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const PRIMARY = theme?.colors?.primary ?? "#FF9800";

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // load user once
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) setUserId(data.user.id);
    });
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    const { data } = await NotificationService.getUserNotifications(userId);
    setItems(data ?? []);
    setRefreshing(false);
  }, [userId]);

  // initial + realtime
  useEffect(() => {
    if (!userId) return;
    load();
    NotificationService.subscribeToUserNotifications(userId, (row) => {
      setItems((prev) => [row, ...prev]); // prepend new
    });
    return () => NotificationService.unsubscribe(`notifications_${userId}`);
  }, [userId, load]);

  const markAll = async () => {
    if (!userId) return;
    await NotificationService.markAllNotificationsAsRead(userId);
    await load();
  };

  const renderItem = ({ item }: { item: any }) => (
    <List.Item
      title={item.title}
      description={item.message}
      onPress={async () => {
        if (!item.is_read) {
          await NotificationService.markNotificationAsRead(item.id);
          setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, is_read: true } : x)));
        }
        // Optionally route on tap:
        // if (item.type === "order_update" && item.data?.orderId) navigation.navigate("OrderDetails", { id: item.data.orderId })
      }}
      left={(props) => (
        <List.Icon
          {...props}
          color={item.is_read ? "#94A3B8" : PRIMARY}
          icon={
            item.type === "payment" ? "cash" :
            item.type === "order_update" ? "cart" : "bell"
          }
        />
      )}
      right={() => (
        <Text style={{ color: "#64748B", fontSize: 12 }}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      )}
      titleNumberOfLines={2}
      descriptionNumberOfLines={3}
      style={[styles.row, item.is_read ? styles.read : styles.unread]}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={{ fontWeight: "800" }}>
          Notifications
        </Text>
        <IconButton icon="check-all" onPress={markAll} iconColor={PRIMARY} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7FB", padding: 16 },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 8,
  },
  row: {
    borderWidth: 1, borderColor: "#EEF2F7",
    borderRadius: 12, backgroundColor: "#fff", marginBottom: 10,
  },
  unread: { borderColor: "#FFEDD5" },
  read: {},
  empty: { textAlign: "center", color: "#64748B", marginTop: 24 },
});

export default NotificationsScreen;

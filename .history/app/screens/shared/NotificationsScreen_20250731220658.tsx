import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Badge,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Loading, EmptyState, ErrorState } from "../../components/common";
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from "../../constants";
import { useAuth } from "@/store/authStore";
import { NotificationType } from "@/types";
import { SupabaseService } from "@/services/supabase";

interface NotificationsScreenProps {
  navigation: any;
}

interface NotificationGroup {
  title: string;
  data: Notification[];
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    NotificationType | "all"
  >("all");
  const [unreadCount, setUnreadCount] = useState(0);

  // Filter options
  const filterOptions = [
    { id: "all", label: "All", icon: "list" },
    { id: "order_update", label: "Orders", icon: "receipt" },
    { id: "payment", label: "Payments", icon: "card" },
    { id: "general", label: "General", icon: "information-circle" },
    { id: "promotion", label: "Promotions", icon: "gift" },
  ];

  // Load notifications
  const loadNotifications = useCallback(
    async (showRefreshing = false) => {
      if (!user) return;

      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const { data, error } = await SupabaseService.getUserNotifications(
          user.id,
        );

        if (error) {
          throw new Error(error);
        }

        setNotifications(data || []);

        // Count unread notifications
        const unread = (data || []).filter(
          (notification) => !notification.is_read,
        ).length;
        setUnreadCount(unread);
      } catch (err: any) {
        console.error("Error loading notifications:", err);
        setError(err.message || "Failed to load notifications");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (selectedFilter === "all") return true;
    return notification.type === selectedFilter;
  });

  // Group notifications by date
  const groupedNotifications = (): NotificationGroup[] => {
    const groups: { [key: string]: Notification[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredNotifications.forEach((notification) => {
      const notificationDate = new Date(notification.created_at);
      let groupKey = "";

      if (notificationDate.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (notificationDate.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else {
        groupKey = notificationDate.toLocaleDateString();
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return Object.entries(groups).map(([title, data]) => ({
      title,
      data: data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    }));
  };

  // Handle notification press
  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read if unread
      if (!notification.is_read) {
        await SupabaseService.markNotificationAsRead(notification.id);

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Handle navigation based on notification type and data
      if (notification.data?.orderId) {
        navigation.navigate("OrderTracking", {
          orderId: notification.data.orderId,
        });
      } else if (
        notification.type === "payment" &&
        notification.data?.paymentId
      ) {
        // Navigate to payment details if available
        console.log("Navigate to payment:", notification.data.paymentId);
      }
    } catch (error) {
      console.error("Error handling notification press:", error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      setLoading(true);

      const { error } = await SupabaseService.markAllNotificationsAsRead(
        user.id,
      );

      if (error) {
        throw new Error(error);
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true })),
      );
      setUnreadCount(0);

      Alert.alert("Success", "All notifications marked as read");
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to mark notifications as read",
      );
    } finally {
      setLoading(false);
    }
  };

  // Get notification icon and color
  const getNotificationIcon = (
    type: NotificationType,
  ): { name: string; color: string } => {
    switch (type) {
      case "order_update":
        return { name: "receipt", color: COLORS.PRIMARY };
      case "payment":
        return { name: "card", color: COLORS.SUCCESS };
      case "promotion":
        return { name: "gift", color: COLORS.WARNING };
      case "general":
      default:
        return { name: "information-circle", color: COLORS.INFO };
    }
  };

  // Format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Effects
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  // Render filter chip
  const renderFilterChip = ({
    item: filter,
  }: {
    item: (typeof filterOptions)[0];
  }) => (
    <Chip
      key={filter.id}
      selected={selectedFilter === filter.id}
      onPress={() => setSelectedFilter(filter.id as any)}
      icon={filter.icon}
      style={[
        styles.filterChip,
        selectedFilter === filter.id && styles.selectedFilterChip,
      ]}
      textStyle={[
        styles.filterChipText,
        selectedFilter === filter.id && styles.selectedFilterChipText,
      ]}
    >
      {filter.label}
    </Chip>
  );

  // Render notification item
  const renderNotification = ({ item }: { item: Notification }) => {
    const iconInfo = getNotificationIcon(item.type);

    return (
      <TouchableOpacity onPress={() => handleNotificationPress(item)}>
        <Card
          style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
        >
          <Card.Content style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationIcon}>
                <Ionicons
                  name={iconInfo.name as any}
                  size={24}
                  color={iconInfo.color}
                />
              </View>
              <View style={styles.notificationInfo}>
                <Text
                  style={[
                    styles.notificationTitle,
                    !item.is_read && styles.unreadTitle,
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={styles.notificationTime}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
              {!item.is_read && <Badge style={styles.unreadBadge} />}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={3}>
              {item.message}
            </Text>
            {item.type === "order_update" && item.data?.orderId && (
              <View style={styles.notificationAction}>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => handleNotificationPress(item)}
                  style={styles.actionButton}
                >
                  View Order
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render section header
  const renderSectionHeader = ({ section }: { section: NotificationGroup }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  // Loading state
  if (loading && !refreshing) {
    return <Loading text="Loading notifications..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Failed to Load Notifications"
        subtitle={error}
        onActionPress={() => loadNotifications()}
      />
    );
  }

  const groupedData = groupedNotifications();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Badge style={styles.headerBadge} size={20}>
              {unreadCount}
            </Badge>
          )}
        </View>
        {unreadCount > 0 && (
          <Button
            mode="text"
            onPress={handleMarkAllAsRead}
            loading={loading}
            disabled={loading}
          >
            Mark all read
          </Button>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filterOptions}
          renderItem={renderFilterChip}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Notifications List */}
      {groupedData.length === 0 ? (
        <EmptyState
          title="No Notifications"
          subtitle={
            selectedFilter === "all"
              ? "You don't have any notifications yet"
              : `No ${filterOptions.find((f) => f.id === selectedFilter)?.label.toLowerCase()} notifications`
          }
          icon="notifications-outline"
          actionText={selectedFilter !== "all" ? "Show All" : undefined}
          onActionPress={
            selectedFilter !== "all"
              ? () => setSelectedFilter("all")
              : undefined
          }
        />
      ) : (
        <FlatList
          data={groupedData}
          renderItem={({ item: section }) => (
            <View>
              {renderSectionHeader({ section })}
              {section.data.map((notification, index) => (
                <View key={notification.id} style={styles.notificationItem}>
                  {renderNotification({ item: notification })}
                </View>
              ))}
            </View>
          )}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              colors={[COLORS.PRIMARY]}
              tintColor={COLORS.PRIMARY}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginRight: SPACING.SM,
  },
  headerBadge: {
    backgroundColor: COLORS.ERROR,
    color: COLORS.WHITE,
  },
  filtersContainer: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  filtersContent: {
    paddingHorizontal: SPACING.LG,
  },
  filterChip: {
    marginRight: SPACING.SM,
    backgroundColor: COLORS.GRAY_100,
    borderColor: COLORS.BORDER,
  },
  selectedFilterChip: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
  },
  filterChipText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONTS.SIZE.SM,
  },
  selectedFilterChipText: {
    color: COLORS.PRIMARY,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  listContent: {
    padding: SPACING.LG,
    flexGrow: 1,
  },
  sectionHeader: {
    paddingVertical: SPACING.MD,
    marginTop: SPACING.SM,
  },
  sectionHeaderText: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  notificationItem: {
    marginBottom: SPACING.MD,
  },
  notificationCard: {
    borderRadius: BORDER_RADIUS.LG,
    elevation: 1,
    backgroundColor: COLORS.WHITE,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  notificationContent: {
    padding: SPACING.MD,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.SM,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.MD,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  unreadTitle: {
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  notificationTime: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.PRIMARY,
    marginLeft: SPACING.SM,
    marginTop: SPACING.XS,
  },
  notificationMessage: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: FONTS.LINE_HEIGHT.NORMAL * FONTS.SIZE.SM,
    marginLeft: 52, // Align with title
  },
  notificationAction: {
    marginTop: SPACING.MD,
    alignItems: "flex-start",
    marginLeft: 52, // Align with title
  },
  actionButton: {
    minWidth: 100,
  },
});

export default NotificationsScreen;

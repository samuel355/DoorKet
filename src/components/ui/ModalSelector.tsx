import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Text,
} from "react-native";
import { Portal, Modal, Card, Searchbar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { height } = Dimensions.get("window");

interface ModalSelectorProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  items: {
    label: string;
    value: string;
    icon?: keyof typeof Ionicons.glyphMap;
  }[];
  onSelect: (item: { label: string; value: string }) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  gradient?: string[];
  selectedValue?: string;
}

const ModalSelector: React.FC<ModalSelectorProps> = ({
  visible,
  onDismiss,
  title,
  items,
  onSelect,
  searchable = false,
  searchPlaceholder = "Search...",
  gradient = ["#667eea", "#764ba2"],
  selectedValue,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredItems = React.useMemo(() => {
    if (!searchable || !searchQuery) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [items, searchQuery, searchable]);

  const handleSelect = (item: { label: string; value: string }) => {
    onSelect(item);
    setSearchQuery("");
    onDismiss();
  };

  const handleDismiss = () => {
    setSearchQuery("");
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={gradient as [string, string, ...string[]]}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.header}>
                <Text style={styles.modalTitle}>{title}</Text>
                <TouchableOpacity
                  onPress={handleDismiss}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <Card.Content style={styles.cardContent}>
            {/* Search Bar */}
            {searchable && (
              <View style={styles.searchContainer}>
                <Searchbar
                  placeholder={searchPlaceholder}
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={styles.searchBar}
                  inputStyle={styles.searchInput}
                  iconColor={gradient[0]}
                  theme={{
                    colors: {
                      primary: gradient[0],
                    },
                  }}
                />
              </View>
            )}

            {/* Items List */}
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {filteredItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#94a3b8" />
                  <Text style={styles.emptyText}>No items found</Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your search
                  </Text>
                </View>
              ) : (
                filteredItems.map((item, index) => {
                  const isSelected = selectedValue === item.value;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSelect(item)}
                      style={[
                        styles.itemContainer,
                        isSelected && styles.selectedItem,
                      ]}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <LinearGradient
                          colors={[`${gradient[0]}15`, `${gradient[1]}15`]}
                          style={styles.selectedGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                      )}

                      <View style={styles.itemContent}>
                        {item.icon && (
                          <View
                            style={[
                              styles.iconContainer,
                              isSelected && {
                                backgroundColor: `${gradient[0]}20`,
                              },
                            ]}
                          >
                            <Ionicons
                              name={item.icon}
                              size={20}
                              color={isSelected ? gradient[0] : "#64748b"}
                            />
                          </View>
                        )}

                        <Text
                          style={[
                            styles.itemText,
                            isSelected && {
                              color: gradient[0],
                              fontWeight: "600",
                            },
                          ]}
                        >
                          {item.label}
                        </Text>

                        {isSelected && (
                          <View style={styles.checkContainer}>
                            <LinearGradient
                              colors={gradient as [string, string, ...string[]]}
                              style={styles.checkGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                            >
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#ffffff"
                              />
                            </LinearGradient>
                          </View>
                        )}
                      </View>

                      <View
                        style={[
                          styles.itemBorder,
                          isSelected && { backgroundColor: gradient[0] },
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: "center",
    margin: 20,
    maxHeight: height * 0.8,
  },
  modalCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  headerContainer: {
    overflow: "hidden",
  },
  headerGradient: {
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  cardContent: {
    paddingTop: 16,
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    elevation: 2,
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 16,
  },
  scrollView: {
    maxHeight: height * 0.5,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  itemContainer: {
    position: "relative",
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
  },
  selectedItem: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: "relative",
    zIndex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: "#1e293b",
    flex: 1,
    fontWeight: "500",
  },
  checkContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  checkGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemBorder: {
    position: "absolute",
    left: 0,
    bottom: 0,
    right: 0,
    height: 2,
    backgroundColor: "transparent",
  },
});

export default ModalSelector;

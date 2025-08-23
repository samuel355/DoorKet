import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  IconButton,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useCartActions } from "@/store/cartStore";
import { formatCurrency } from "@/src/utils";
import { ColorPalette } from "@/src/theme/colors";
import { spacing, borderRadius } from "@/src/theme/styling";

interface CustomItemDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
  prefilledName?: string;
  prefilledBudget?: number;
  prefilledNotes?: string;
}

const CustomItemDialog: React.FC<CustomItemDialogProps> = ({
  visible,
  onDismiss,
  onSuccess,
  prefilledName = "",
  prefilledBudget = 0,
  prefilledNotes = "",
}) => {
  const [itemName, setItemName] = useState(prefilledName);
  const [budget, setBudget] = useState(prefilledBudget.toString());
  const [notes, setNotes] = useState(prefilledNotes);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    budget?: string;
  }>({});

  const { addCustomItem } = useCartActions();

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (visible) {
      setItemName(prefilledName);
      setBudget(prefilledBudget > 0 ? prefilledBudget.toString() : "");
      setNotes(prefilledNotes);
      setErrors({});
    }
  }, [visible, prefilledName, prefilledBudget, prefilledNotes]);

  const validateForm = useCallback((): boolean => {
    const newErrors: { name?: string; budget?: string } = {};

    // Validate name
    if (!itemName.trim()) {
      newErrors.name = "Item name is required";
    } else if (itemName.trim().length < 3) {
      newErrors.name = "Item name must be at least 3 characters";
    }

    // Validate budget
    const budgetValue = parseFloat(budget);
    if (!budget.trim()) {
      newErrors.budget = "Budget is required";
    } else if (isNaN(budgetValue)) {
      newErrors.budget = "Please enter a valid amount";
    } else if (budgetValue <= 0) {
      newErrors.budget = "Budget must be greater than 0";
    } else if (budgetValue > 1000) {
      newErrors.budget = "Budget cannot exceed GH₵1000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [itemName, budget]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const budgetValue = parseFloat(budget);
      const success = await addCustomItem(
        itemName.trim(),
        budgetValue,
        notes.trim()
      );

      if (success) {
        Alert.alert(
          "Success!",
          `"${itemName}" has been added to your cart`,
          [{ text: "OK" }]
        );
        onSuccess?.();
        onDismiss();
      } else {
        Alert.alert(
          "Error",
          "Failed to add item to cart. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error adding custom item:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [itemName, budget, notes, addCustomItem, onSuccess, onDismiss, validateForm]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onDismiss();
  }, [isLoading, onDismiss]);

  const budgetValue = parseFloat(budget) || 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <Surface style={styles.dialog} elevation={8}>
              {/* Header */}
              <View style={styles.header}>
                <LinearGradient
                  colors={[ColorPalette.primary[600], ColorPalette.primary[700]]}
                  style={styles.headerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.headerContent}>
                    <View style={styles.titleContainer}>
                      <Ionicons
                        name="create-outline"
                        size={24}
                        color={ColorPalette.pure.white}
                      />
                      <Text style={styles.headerTitle}>Add Custom Item</Text>
                    </View>
                    <IconButton
                      icon="close"
                      size={24}
                      iconColor={ColorPalette.pure.white}
                      onPress={handleClose}
                      disabled={isLoading}
                    />
                  </View>
                </LinearGradient>
              </View>

              {/* Form */}
              <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Item Name */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Item Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={itemName}
                    onChangeText={setItemName}
                    placeholder="e.g., Notebook, Snacks, etc."
                    mode="outlined"
                    error={!!errors.name}
                    disabled={isLoading}
                    maxLength={100}
                    outlineColor={ColorPalette.neutral[300]}
                    activeOutlineColor={ColorPalette.primary[600]}
                  />
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>

                {/* Budget */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Budget *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={budget}
                    onChangeText={setBudget}
                    placeholder="0.00"
                    mode="outlined"
                    error={!!errors.budget}
                    disabled={isLoading}
                    keyboardType="decimal-pad"
                    left={<TextInput.Affix text="GH₵" />}
                    outlineColor={ColorPalette.neutral[300]}
                    activeOutlineColor={ColorPalette.primary[600]}
                  />
                  {errors.budget && (
                    <Text style={styles.errorText}>{errors.budget}</Text>
                  )}
                  {budgetValue > 0 && (
                    <Text style={styles.budgetPreview}>
                      Total: {formatCurrency(budgetValue)}
                    </Text>
                  )}
                </View>

                {/* Notes */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Any specific requirements or details..."
                    mode="outlined"
                    disabled={isLoading}
                    multiline
                    numberOfLines={3}
                    maxLength={300}
                    outlineColor={ColorPalette.neutral[300]}
                    activeOutlineColor={ColorPalette.primary[600]}
                  />
                  <Text style={styles.characterCount}>
                    {notes.length}/300 characters
                  </Text>
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={ColorPalette.primary[600]}
                  />
                  <Text style={styles.infoText}>
                    Custom items allow you to request items that aren't in our catalog.
                    Your runner will purchase the item within your specified budget.
                  </Text>
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={handleClose}
                  disabled={isLoading}
                  style={styles.cancelButton}
                  labelStyle={styles.cancelButtonText}
                >
                  Cancel
                </Button>

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    (!itemName.trim() || !budget.trim() || isLoading) &&
                      styles.addButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!itemName.trim() || !budget.trim() || isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      !itemName.trim() || !budget.trim() || isLoading
                        ? [ColorPalette.neutral[300], ColorPalette.neutral[400]]
                        : [ColorPalette.primary[600], ColorPalette.primary[700]]
                    }
                    style={styles.addButtonGradient}
                  >
                    <Ionicons
                      name={isLoading ? "hourglass-outline" : "basket-outline"}
                      size={18}
                      color={ColorPalette.pure.white}
                    />
                    <Text style={styles.addButtonText}>
                      {isLoading ? "Adding..." : "Add to Cart"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Surface>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: borderRadius.xl,
    backgroundColor: ColorPalette.pure.white,
    overflow: "hidden",
  },
  header: {
    overflow: "hidden",
  },
  headerGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: ColorPalette.pure.white,
    marginLeft: spacing.sm,
  },
  form: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorPalette.neutral[800],
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: ColorPalette.pure.white,
  },
  notesInput: {
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    color: ColorPalette.error[600],
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  budgetPreview: {
    fontSize: 12,
    color: ColorPalette.primary[600],
    fontWeight: "600",
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  characterCount: {
    fontSize: 11,
    color: ColorPalette.neutral[500],
    textAlign: "right",
    marginTop: spacing.xs,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: ColorPalette.primary[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: ColorPalette.primary[600],
  },
  infoText: {
    fontSize: 12,
    color: ColorPalette.neutral[700],
    lineHeight: 18,
    marginLeft: spacing.sm,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ColorPalette.neutral[200],
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderColor: ColorPalette.neutral[300],
  },
  cancelButtonText: {
    color: ColorPalette.neutral[600],
    fontWeight: "600",
  },
  addButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: ColorPalette.pure.white,
    marginLeft: spacing.sm,
  },
});

export default CustomItemDialog;

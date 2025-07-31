import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  TextInput,
  Text,
  Card,
  RadioButton,
  Divider,
  Surface,
  useTheme,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";



type PaymentScreenNavigationProp = StackNavigationProp<
  StudentStackParamList,
  "Payment"
>;
type PaymentScreenRouteProp = RouteProp<StudentStackParamList, "Payment">;

interface PaymentScreenProps {
  navigation: PaymentScreenNavigationProp;
  route: PaymentScreenRouteProp;
}

interface PaymentForm {
  paymentMethod: PaymentMethod;
  phoneNumber?: string;
}

interface PaymentStep {
  step: "select" | "processing" | "success" | "failed";
  message?: string;
  transactionId?: string;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { orderId, amount } = route.params;
  const { user, profile } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>({
    step: "select",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("momo");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaymentForm>({
    defaultValues: {
      paymentMethod: "momo",
      phoneNumber: profile?.phone || "",
    },
  });

  const watchedMethod = watch("paymentMethod");

  useEffect(() => {
    loadOrderDetails();
    setSelectedMethod(watchedMethod);
  }, [orderId, watchedMethod]);

  const loadOrderDetails = async () => {
    try {
      const { data, error } = await OrderService.getOrderById(orderId);
      if (error) {
        Alert.alert("Error", "Failed to load order details");
        navigation.goBack();
        return;
      }
      setOrder(data);
    } catch (error) {
      console.error("Error loading order:", error);
      Alert.alert("Error", "Something went wrong");
      navigation.goBack();
    }
  };

  const processPayment = async (data: PaymentForm) => {
    if (!order || !user || !profile) {
      Alert.alert("Error", "Missing required information");
      return;
    }

    setIsLoading(true);
    setPaymentStep({ step: "processing", message: "Initiating payment..." });

    try {
      const customerData = {
        name: profile.full_name,
        phone: data.phoneNumber || profile.phone,
      };

      const result = await PaymentService.processOrderPayment(
        order,
        data.paymentMethod,
        customerData,
      );

      if (result.success) {
        if (data.paymentMethod === "cash") {
          // For cash payments, update order status and navigate
          await updateOrderPaymentStatus("pending");
          setPaymentStep({
            step: "success",
            message: "Order confirmed! Pay cash on delivery.",
          });
        } else if (data.paymentMethod === "card" && result.checkoutUrl) {
          // Open card payment URL
          setPaymentStep({
            step: "processing",
            message: "Opening card payment...",
          });
          await Linking.openURL(result.checkoutUrl);
          // Start monitoring payment status
          monitorPaymentStatus(result.transactionId!);
        } else if (data.paymentMethod === "momo") {
          // Monitor MoMo payment status
          setPaymentStep({
            step: "processing",
            message: "Please complete payment on your phone...",
          });
          monitorPaymentStatus(result.transactionId!);
        }
      } else {
        setPaymentStep({
          step: "failed",
          message: result.message || "Payment failed",
        });
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentStep({
        step: "failed",
        message: error.message || "Payment processing failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const monitorPaymentStatus = async (transactionId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const checkStatus = async (): Promise<void> => {
      try {
        const status = await PaymentService.checkPaymentStatus(transactionId);

        if (status.status === "successful") {
          await updateOrderPaymentStatus("paid");
          setPaymentStep({
            step: "success",
            message: "Payment successful!",
            transactionId,
          });
        } else if (status.status === "failed") {
          setPaymentStep({
            step: "failed",
            message: status.message || "Payment failed",
          });
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 10000); // Check again in 10 seconds
        } else {
          setPaymentStep({
            step: "failed",
            message: "Payment timeout. Please contact support.",
          });
        }
      } catch (error) {
        console.error("Status check error:", error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 10000);
        } else {
          setPaymentStep({
            step: "failed",
            message: "Unable to verify payment status",
          });
        }
      }
    };

    // Start checking
    setTimeout(checkStatus, 5000); // Initial 5-second delay
  };

  const updateOrderPaymentStatus = async (
    status: "pending" | "paid" | "failed",
  ) => {
    try {
      await OrderService.updateOrderStatus(
        orderId,
        order?.status || "pending",
        {
          payment_status: status,
        },
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const handlePaymentSuccess = () => {
    navigation.replace("OrderTracking", { orderId });
  };

  const handleRetryPayment = () => {
    setPaymentStep({ step: "select" });
    setIsLoading(false);
  };

  const renderPaymentMethods = () => {
    const methods = PaymentService.getSupportedPaymentMethods();

    return (
      <Card style={styles.methodsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <RadioButton.Group
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            value={selectedMethod}
          >
            {methods.map((method) => {
              const methodInfo = PaymentService.getPaymentMethodInfo(method);
              if (!methodInfo.enabled) return null;

              return (
                <View key={method} style={styles.paymentMethod}>
                  <RadioButton.Item
                    label=""
                    value={method}
                    style={styles.radioItem}
                  />
                  <Ionicons
                    name={methodInfo.icon as any}
                    size={24}
                    color={theme.colors.primary}
                    style={styles.methodIcon}
                  />
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{methodInfo.name}</Text>
                    <Text style={styles.methodDescription}>
                      {methodInfo.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </RadioButton.Group>
        </Card.Content>
      </Card>
    );
  };

  const renderPhoneInput = () => {
    if (selectedMethod !== "momo") return null;

    return (
      <Card style={styles.inputCard}>
        <Card.Content>
          <Controller
            control={control}
            name="phoneNumber"
            rules={{
              required: "Phone number is required for Mobile Money",
              pattern: {
                value: /^(\+233|0)[0-9]{9}$/,
                message: "Please enter a valid Ghana phone number",
              },
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Mobile Money Number"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.phoneInput}
                error={!!errors.phoneNumber}
                left={<TextInput.Icon icon="phone" />}
                placeholder="+233 XX XXX XXXX"
              />
            )}
          />
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderOrderSummary = () => {
    if (!order) return null;

    const fees = PaymentService.calculatePaymentFees(
      order.total_amount,
      selectedMethod,
    );

    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text>Order #{order.order_number}</Text>
            <Text>
              {PaymentService.formatAmount(
                order.total_amount - order.delivery_fee - order.service_fee,
              )}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text>Delivery Fee</Text>
            <Text>{PaymentService.formatAmount(order.delivery_fee)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text>Service Fee</Text>
            <Text>{PaymentService.formatAmount(order.service_fee)}</Text>
          </View>

          {fees.fees > 0 && (
            <View style={styles.summaryRow}>
              <Text>Payment Fee</Text>
              <Text>{PaymentService.formatAmount(fees.fees)}</Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalText}>
              {PaymentService.formatAmount(fees.total)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderProcessingState = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.processingText}>{paymentStep.message}</Text>
      {selectedMethod === "momo" && (
        <Text style={styles.processingSubtext}>
          Check your phone for the payment prompt
        </Text>
      )}
    </View>
  );

  const renderSuccessState = () => (
    <View style={styles.successContainer}>
      <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
      <Text style={styles.successTitle}>Payment Successful!</Text>
      <Text style={styles.successMessage}>{paymentStep.message}</Text>
      {paymentStep.transactionId && (
        <Text style={styles.transactionId}>
          Transaction ID: {paymentStep.transactionId}
        </Text>
      )}
      <Button
        mode="contained"
        onPress={handlePaymentSuccess}
        style={styles.successButton}
      >
        Track Order
      </Button>
    </View>
  );

  const renderFailedState = () => (
    <View style={styles.failedContainer}>
      <Ionicons name="close-circle" size={80} color="#f44336" />
      <Text style={styles.failedTitle}>Payment Failed</Text>
      <Text style={styles.failedMessage}>{paymentStep.message}</Text>
      <View style={styles.failedButtons}>
        <Button
          mode="outlined"
          onPress={handleRetryPayment}
          style={styles.retryButton}
        >
          Try Again
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
    </View>
  );

  if (paymentStep.step === "processing") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {renderProcessingState()}
      </SafeAreaView>
    );
  }

  if (paymentStep.step === "success") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {renderSuccessState()}
      </SafeAreaView>
    );
  }

  if (paymentStep.step === "failed") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        {renderFailedState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderOrderSummary()}
        {renderPaymentMethods()}
        {renderPhoneInput()}

        <Surface style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit(processPayment)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.payButton}
            contentStyle={styles.payButtonContent}
          >
            {selectedMethod === "cash"
              ? "Confirm Order"
              : `Pay ${PaymentService.formatAmount(
                  PaymentService.calculatePaymentFees(amount, selectedMethod)
                    .total,
                )}`}
          </Button>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  methodsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  inputCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333333",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  totalRow: {
    paddingTop: 12,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  divider: {
    marginVertical: 8,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioItem: {
    marginRight: 0,
    paddingLeft: 0,
  },
  methodIcon: {
    marginHorizontal: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  methodDescription: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  phoneInput: {
    backgroundColor: "transparent",
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
  },
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#ffffff",
    elevation: 8,
  },
  payButton: {
    borderRadius: 12,
  },
  payButtonContent: {
    paddingVertical: 8,
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  processingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
    marginTop: 24,
  },
  processingSubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
  transactionId: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 16,
    fontFamily: "monospace",
  },
  successButton: {
    marginTop: 32,
    borderRadius: 12,
    minWidth: 200,
  },
  failedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  failedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f44336",
    marginTop: 16,
    textAlign: "center",
  },
  failedMessage: {
    fontSize: 16,
    color: "#333333",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
  failedButtons: {
    flexDirection: "row",
    marginTop: 32,
  },
  retryButton: {
    marginRight: 16,
    borderRadius: 12,
  },
  cancelButton: {
    borderRadius: 12,
  },
});

export default PaymentScreen;

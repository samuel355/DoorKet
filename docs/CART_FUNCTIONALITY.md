# DoorKet Cart Functionality Documentation

## Overview

The DoorKet cart system provides a comprehensive shopping cart experience for students, allowing them to add items, manage quantities, customize orders, and proceed to checkout. The system is built with React Native and uses Zustand for state management with AsyncStorage persistence.

## Architecture

### Core Components

#### 1. Cart Store (`/store/cartStore.ts`)
- **Purpose**: Centralized cart state management using Zustand
- **Features**:
  - Persistent cart data with AsyncStorage
  - Real-time cart calculations
  - Error handling and loading states
  - Cart validation and business logic

#### 2. Cart Hook (`/src/hooks/useCart.ts`)
- **Purpose**: Legacy cart hook (can be replaced by cart store)
- **Status**: Maintained for backward compatibility

#### 3. Cart Components (`/src/components/cart/`)
- **CartItemCard**: Display individual cart items with quantity controls
- **CartSummary**: Show order totals and checkout button
- **AddToCartButton**: Floating action button for adding items
- **CartBadge**: Navigation badge showing item count
- **EmptyCart**: Empty state with call-to-action
- **CustomItemDialog**: Modal for adding custom items
- **QuickAddItem**: Inline item addition with quantity selector

## Cart Store API

### State Properties

```typescript
interface CartState {
  cart: Cart;                    // Current cart data
  isLoading: boolean;           // Loading state
  isUpdating: boolean;          // Update operations state
  isClearing: boolean;          // Clear operation state
  error: string | null;         // Error messages
}
```

### Actions

#### Add Item
```typescript
addItem(item: Item | CartItem, quantity?: number, notes?: string): Promise<boolean>
```
- Adds item to cart or increases quantity if already present
- Validates quantity and cart limits
- Recalculates totals automatically

#### Remove Item
```typescript
removeItem(itemId: string): Promise<boolean>
```
- Removes item completely from cart
- Recalculates totals automatically

#### Update Quantity
```typescript
updateQuantity(itemId: string, quantity: number): Promise<boolean>
```
- Updates item quantity (removes if quantity is 0)
- Validates quantity constraints

#### Clear Cart
```typescript
clearCart(): Promise<boolean>
```
- Removes all items from cart
- Preserves delivery address and special instructions

#### Add Custom Item
```typescript
addCustomItem(name: string, budget: number, notes?: string): Promise<boolean>
```
- Adds custom item with specified budget
- Validates name and budget constraints

### Utility Functions

#### Get Item Quantity
```typescript
getItemQuantity(itemId: string): number
```
- Returns current quantity of specific item in cart

#### Check Item in Cart
```typescript
isItemInCart(itemId: string): boolean
```
- Checks if item exists in cart

#### Get Total Items
```typescript
getTotalItems(): number
```
- Returns total quantity of all items

#### Can Checkout
```typescript
canCheckout(): boolean
```
- Validates if cart meets checkout requirements

## Component Usage Guide

### CartItemCard

```tsx
import { CartItemCard } from '@/src/components/cart';

<CartItemCard
  item={cartItem}
  onQuantityChange={(itemId, quantity) => updateQuantity(itemId, quantity)}
  onRemove={(itemId) => removeItem(itemId)}
  onPress={(item) => navigateToDetails(item)}
  showRemoveButton={true}
  showQuantityControls={true}
  compact={false}
/>
```

**Props:**
- `item`: CartItem object
- `onQuantityChange`: Quantity change handler
- `onRemove`: Remove item handler  
- `onPress`: Item press handler (optional)
- `showRemoveButton`: Show/hide remove button
- `showQuantityControls`: Show/hide quantity controls
- `compact`: Use compact layout

### CartSummary

```tsx
import { CartSummary } from '@/src/components/cart';

<CartSummary
  cart={cart}
  onCheckout={handleCheckout}
  showCheckoutButton={true}
  showDeliveryInfo={true}
  canCheckout={canCheckout}
  checkoutButtonText="Proceed to Checkout"
  loading={false}
  compact={false}
/>
```

**Props:**
- `cart`: Cart object
- `onCheckout`: Checkout handler
- `showCheckoutButton`: Show/hide checkout button
- `showDeliveryInfo`: Show/hide delivery information
- `canCheckout`: Enable/disable checkout
- `checkoutButtonText`: Custom button text
- `loading`: Loading state
- `compact`: Use compact layout

### AddToCartButton

```tsx
import { AddToCartButton } from '@/src/components/cart';

<AddToCartButton
  item={item}
  quantity={1}
  notes=""
  onAdded={handleItemAdded}
  onPress={handleCustomOptions}
  showQuantity={true}
  showPrice={true}
  disabled={false}
  loading={false}
/>
```

**Props:**
- `item`: Item object to add
- `quantity`: Quantity to add
- `notes`: Additional notes
- `onAdded`: Success callback
- `onPress`: Custom press handler (overrides add functionality)
- `showQuantity`: Show quantity badge
- `showPrice`: Show price
- `disabled`: Disable button
- `loading`: Show loading state

### CartBadge

```tsx
import { CartBadge } from '@/src/components/cart';

<CartBadge
  onPress={navigateToCart}
  size="medium"
  showZero={false}
  color={ColorPalette.neutral[700]}
  badgeColor={ColorPalette.error[500]}
  textColor={ColorPalette.pure.white}
  animated={true}
/>
```

**Props:**
- `onPress`: Press handler
- `size`: Badge size ('small', 'medium', 'large')
- `showZero`: Show badge when count is 0
- `color`: Icon color
- `badgeColor`: Badge background color
- `textColor`: Badge text color
- `animated`: Enable animations

### EmptyCart

```tsx
import { EmptyCart } from '@/src/components/cart';

<EmptyCart
  onStartShopping={navigateToHome}
  onBrowseCategories={navigateToCategories}
  title="Your cart is empty"
  message="Start shopping to find great items!"
  showAnimation={true}
  showActions={true}
/>
```

**Props:**
- `onStartShopping`: Start shopping handler
- `onBrowseCategories`: Browse categories handler
- `title`: Custom title
- `message`: Custom message
- `showAnimation`: Show animated illustration
- `showActions`: Show action buttons

### CustomItemDialog

```tsx
import { CustomItemDialog } from '@/src/components/cart';

<CustomItemDialog
  visible={dialogVisible}
  onDismiss={handleDismiss}
  onSuccess={handleSuccess}
  prefilledName=""
  prefilledBudget={0}
  prefilledNotes=""
/>
```

**Props:**
- `visible`: Dialog visibility
- `onDismiss`: Dismiss handler
- `onSuccess`: Success handler
- `prefilledName`: Prefill item name
- `prefilledBudget`: Prefill budget
- `prefilledNotes`: Prefill notes

## Implementation Examples

### Basic Cart Screen

```tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { useCartStore, useCartActions } from '@/store/cartStore';
import { CartItemCard, CartSummary, EmptyCart } from '@/src/components/cart';

const CartScreen = ({ navigation }) => {
  const cart = useCartStore(state => state.cart);
  const isLoading = useCartStore(state => state.isLoading);
  const { removeItem, updateQuantity } = useCartActions();

  const handleCheckout = () => {
    navigation.navigate('Checkout');
  };

  if (isLoading) {
    return <Loading />;
  }

  if (cart.items.length === 0) {
    return (
      <EmptyCart
        onStartShopping={() => navigation.navigate('Home')}
        onBrowseCategories={() => navigation.navigate('Categories')}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        {cart.items.map(item => (
          <CartItemCard
            key={item.id}
            item={item}
            onQuantityChange={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </ScrollView>
      
      <CartSummary
        cart={cart}
        onCheckout={handleCheckout}
      />
    </View>
  );
};
```

### Navigation with Cart Badge

```tsx
import React from 'react';
import { CartBadge } from '@/src/components/cart';

const TabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <CartBadge
              color={color}
              size={size === 24 ? 'medium' : 'small'}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
```

### Item List with Quick Add

```tsx
import React from 'react';
import { FlatList } from 'react-native';
import { QuickAddItem } from '@/src/components/cart';

const ItemListScreen = ({ items, navigation }) => {
  const handleItemPress = (item) => {
    navigation.navigate('ItemDetails', { itemId: item.id });
  };

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <QuickAddItem
          item={item}
          onPress={handleItemPress}
          showImage={true}
          compact={false}
        />
      )}
    />
  );
};
```

## Cart Business Logic

### Pricing Calculations

The cart automatically calculates:
- **Subtotal**: Sum of all item totals
- **Service Fee**: Percentage-based fee (configurable)
- **Delivery Fee**: Fixed delivery charge
- **Total**: Subtotal + Service Fee + Delivery Fee

### Validation Rules

1. **Item Quantity**: Must be between 1 and 99
2. **Cart Limit**: Maximum 50 items per cart
3. **Custom Item Budget**: Must be between GH₵0.01 and GH₵1000
4. **Checkout Requirements**:
   - Cart must not be empty
   - Total must meet minimum order amount
   - Delivery address must be provided

### Data Persistence

- Cart data is automatically saved to AsyncStorage
- Data persists across app sessions
- Cart is restored on app launch
- Totals are recalculated on load to ensure accuracy

## Error Handling

### Common Errors

1. **Network Errors**: Handled with retry logic
2. **Validation Errors**: User-friendly error messages
3. **Storage Errors**: Graceful fallback to empty cart
4. **Item Availability**: Real-time availability checking

### Error Recovery

- Automatic retry for network operations
- Local state recovery from storage
- User-friendly error notifications
- Graceful degradation when features unavailable

## Performance Optimizations

### State Management
- Selective subscriptions to prevent unnecessary re-renders
- Memoized calculations for expensive operations
- Debounced storage operations

### Component Optimizations
- React.memo for pure components
- useCallback for stable function references
- Optimized FlatList rendering for large carts

### Storage Optimizations
- Compressed cart data storage
- Background storage operations
- Storage cleanup on cart clear

## Testing Guidelines

### Unit Tests
- Cart store actions and state changes
- Business logic validation
- Component prop handling

### Integration Tests
- Cart flow from add to checkout
- Persistence across app sessions
- Error scenarios and recovery

### E2E Tests
- Complete shopping flow
- Cross-screen cart consistency
- Payment integration

## Migration Guide

### From Legacy Cart Hook

1. Replace `useCart()` imports with cart store hooks:
   ```tsx
   // Old
   const { cart, addItem } = useCart();
   
   // New
   const cart = useCartStore(state => state.cart);
   const { addItem } = useCartActions();
   ```

2. Update component imports:
   ```tsx
   // Old
   import { CartScreen } from '@/screens/student';
   
   // New
   import { CartItemCard, CartSummary } from '@/components/cart';
   ```

3. Replace custom cart components with new standardized components

## Future Enhancements

### Planned Features
- Cart sharing between users
- Saved carts and wishlists
- Cart expiration and cleanup
- Advanced cart analytics
- Multi-currency support

### Performance Improvements
- Background cart synchronization
- Optimistic UI updates
- Advanced caching strategies
- Real-time cart updates

## Support and Troubleshooting

### Common Issues

1. **Cart not persisting**: Check AsyncStorage permissions
2. **Items not adding**: Verify item availability and cart limits
3. **Checkout disabled**: Ensure all validation requirements are met
4. **Performance issues**: Check for unnecessary re-renders

### Debug Tools

- Cart store development tools
- AsyncStorage inspection
- Network request monitoring
- Performance profiling

For additional support, refer to the main DoorKet documentation or contact the development team.
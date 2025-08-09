import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  ThemeSettings,
} from '../components/common';
import {
  useTheme,
  useTypography,
  useShadows,
  spacing,
  borderRadius,
  layout,
} from '../theme';

const ThemeShowcaseScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const typography = useTypography();
  const shadows = useShadows();

  const handleButtonPress = (variant: string) => {
    Alert.alert('Button Pressed', `You pressed the ${variant} button!`);
  };

  const handleCardPress = (cardType: string) => {
    Alert.alert('Card Pressed', `You pressed the ${cardType} card!`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.h2, { color: theme.text.primary }]}>
            Theme Showcase
          </Text>
          <Text style={[typography.body, { color: theme.text.secondary, marginTop: spacing.sm }]}>
            Experience the new design system with {isDark ? 'dark' : 'light'} theme
          </Text>
        </View>

        {/* Theme Settings Card */}
        <Card
          title="Theme Settings"
          subtitle="Switch between light and dark themes"
          variant="elevated"
          padding="none"
          style={{ marginBottom: spacing.lg }}
        >
          <ThemeSettings showTitle={false} />
        </Card>

        {/* Button Showcase */}
        <Card
          title="Button Variants"
          subtitle="Different button styles and sizes"
          variant="elevated"
          style={{ marginBottom: spacing.lg }}
        >
          <View style={styles.buttonSection}>
            <Text style={[typography.labelLarge, { color: theme.text.primary, marginBottom: spacing.md }]}>
              Primary Buttons
            </Text>
            <View style={styles.buttonRow}>
              <Button
                title="Small"
                size="small"
                variant="primary"
                style={styles.buttonSpacing}
                onPress={() => handleButtonPress('primary small')}
              />
              <Button
                title="Medium"
                size="medium"
                variant="primary"
                style={styles.buttonSpacing}
                onPress={() => handleButtonPress('primary medium')}
              />
              <Button
                title="Large"
                size="large"
                variant="primary"
                onPress={() => handleButtonPress('primary large')}
              />
            </View>

            <Text style={[typography.labelLarge, { color: theme.text.primary, marginBottom: spacing.md, marginTop: spacing.lg }]}>
              Button Variants
            </Text>
            <View style={styles.buttonColumn}>
              <Button
                title="Secondary"
                variant="secondary"
                fullWidth
                style={styles.buttonSpacing}
                onPress={() => handleButtonPress('secondary')}
              />
              <Button
                title="Accent"
                variant="accent"
                fullWidth
                style={styles.buttonSpacing}
                onPress={() => handleButtonPress('accent')}
              />
              <Button
                title="Outlined"
                variant="outline"
                fullWidth
                style={styles.buttonSpacing}
                onPress={() => handleButtonPress('outlined')}
              />
              <Button
                title="Text Button"
                variant="text"
                fullWidth
                style={styles.buttonSpacing}
                onPress={() => handleButtonPress('text')}
              />
            </View>

            <Text style={[typography.labelLarge, { color: theme.text.primary, marginBottom: spacing.md, marginTop: spacing.lg }]}>
              Status Buttons
            </Text>
            <View style={styles.buttonRow}>
              <Button
                title="Success"
                variant="success"
                style={styles.buttonSpacing}
                onPress={() => handleButtonPress('success')}
              />
              <Button
                title="Danger"
                variant="danger"
                onPress={() => handleButtonPress('danger')}
              />
            </View>

            <Text style={[typography.labelLarge, { color: theme.text.primary, marginBottom: spacing.md, marginTop: spacing.lg }]}>
              With Icons
            </Text>
            <View style={styles.buttonColumn}>
              <Button
                title="Add to Cart"
                variant="primary"
                icon="basket"
                iconPosition="left"
                fullWidth
                style={styles.buttonSpacing}
                onPress={() => handleButtonPress('add to cart')}
              />
              <Button
                title="Share"
                variant="outline"
                icon="share"
                iconPosition="right"
                fullWidth
                onPress={() => handleButtonPress('share')}
              />
            </View>
          </View>
        </Card>

        {/* Card Showcase */}
        <Card
          title="Card Variants"
          subtitle="Different card styles and elevations"
          variant="elevated"
          style={{ marginBottom: spacing.lg }}
        >
          <View style={styles.cardSection}>
            <Text style={[typography.labelLarge, { color: theme.text.primary, marginBottom: spacing.md }]}>
              Card Types
            </Text>

            <Card
              title="Elevated Card"
              subtitle="Card with shadow elevation"
              variant="elevated"
              elevation="medium"
              style={styles.showcaseCard}
              onPress={() => handleCardPress('elevated')}
              rightIcon="chevron-forward"
            >
              <Text style={[typography.body, { color: theme.text.secondary }]}>
                This is an elevated card with medium shadow.
              </Text>
            </Card>

            <Card
              title="Outlined Card"
              subtitle="Card with border outline"
              variant="outlined"
              style={styles.showcaseCard}
              onPress={() => handleCardPress('outlined')}
              rightIcon="chevron-forward"
            >
              <Text style={[typography.body, { color: theme.text.secondary }]}>
                This is an outlined card with border.
              </Text>
            </Card>

            <Card
              title="Filled Card"
              subtitle="Card with filled background"
              variant="filled"
              style={styles.showcaseCard}
              onPress={() => handleCardPress('filled')}
              rightIcon="chevron-forward"
            >
              <Text style={[typography.body, { color: theme.text.secondary }]}>
                This is a filled card with background color.
              </Text>
            </Card>

            <Card
              title="Flat Card"
              subtitle="Card with no elevation"
              variant="flat"
              style={styles.showcaseCard}
              onPress={() => handleCardPress('flat')}
              rightIcon="chevron-forward"
            >
              <Text style={[typography.body, { color: theme.text.secondary }]}>
                This is a flat card with no elevation.
              </Text>
            </Card>
          </View>
        </Card>

        {/* Typography Showcase */}
        <Card
          title="Typography System"
          subtitle="Text styles and hierarchy"
          variant="elevated"
          style={{ marginBottom: spacing.lg }}
        >
          <View style={styles.typographySection}>
            <Text style={[typography.display, { color: theme.text.primary }]}>
              Display Text
            </Text>
            <Text style={[typography.h1, { color: theme.text.primary }]}>
              Heading 1
            </Text>
            <Text style={[typography.h2, { color: theme.text.primary }]}>
              Heading 2
            </Text>
            <Text style={[typography.h3, { color: theme.text.primary }]}>
              Heading 3
            </Text>
            <Text style={[typography.bodyLarge, { color: theme.text.primary }]}>
              Large body text for important content
            </Text>
            <Text style={[typography.body, { color: theme.text.primary }]}>
              Regular body text for general content
            </Text>
            <Text style={[typography.bodySmall, { color: theme.text.secondary }]}>
              Small body text for secondary information
            </Text>
            <Text style={[typography.labelLarge, { color: theme.text.primary }]}>
              Large Label
            </Text>
            <Text style={[typography.label, { color: theme.text.primary }]}>
              Regular Label
            </Text>
            <Text style={[typography.labelSmall, { color: theme.text.secondary }]}>
              Small Label
            </Text>
            <Text style={[typography.caption, { color: theme.text.tertiary }]}>
              Caption text for hints and metadata
            </Text>
            <Text style={[typography.overline, { color: theme.text.secondary }]}>
              Overline Text
            </Text>
          </View>
        </Card>

        {/* Color Showcase */}
        <Card
          title="Color System"
          subtitle="Theme colors and variants"
          variant="elevated"
          style={{ marginBottom: spacing.lg }}
        >
          <View style={styles.colorSection}>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.primary.main }]} />
              <Text style={[typography.label, { color: theme.text.primary }]}>Primary</Text>
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.secondary.main }]} />
              <Text style={[typography.label, { color: theme.text.primary }]}>Secondary</Text>
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.accent.main }]} />
              <Text style={[typography.label, { color: theme.text.primary }]}>Accent</Text>
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.success.main }]} />
              <Text style={[typography.label, { color: theme.text.primary }]}>Success</Text>
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.warning.main }]} />
              <Text style={[typography.label, { color: theme.text.primary }]}>Warning</Text>
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.error.main }]} />
              <Text style={[typography.label, { color: theme.text.primary }]}>Error</Text>
            </View>
            <View style={styles.colorRow}>
              <View style={[styles.colorSwatch, { backgroundColor: theme.info.main }]} />
              <Text style={[typography.label, { color: theme.text.primary }]}>Info</Text>
            </View>
          </View>
        </Card>

        {/* Shadow Showcase */}
        <Card
          title="Shadow System"
          subtitle="Different elevation levels"
          variant="elevated"
          style={{ marginBottom: spacing.lg }}
        >
          <View style={styles.shadowSection}>
            <View style={[styles.shadowBox, shadows.xs, { backgroundColor: theme.surface.primary }]}>
              <Text style={[typography.label, { color: theme.text.primary }]}>Extra Small</Text>
            </View>
            <View style={[styles.shadowBox, shadows.sm, { backgroundColor: theme.surface.primary }]}>
              <Text style={[typography.label, { color: theme.text.primary }]}>Small</Text>
            </View>
            <View style={[styles.shadowBox, shadows.md, { backgroundColor: theme.surface.primary }]}>
              <Text style={[typography.label, { color: theme.text.primary }]}>Medium</Text>
            </View>
            <View style={[styles.shadowBox, shadows.lg, { backgroundColor: theme.surface.primary }]}>
              <Text style={[typography.label, { color: theme.text.primary }]}>Large</Text>
            </View>
            <View style={[styles.shadowBox, shadows.xl, { backgroundColor: theme.surface.primary }]}>
              <Text style={[typography.label, { color: theme.text.primary }]}>Extra Large</Text>
            </View>
          </View>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[typography.caption, { color: theme.text.tertiary, textAlign: 'center' }]}>
            ChopCart Design System v2.0
          </Text>
          <Text style={[typography.caption, { color: theme.text.tertiary, textAlign: 'center', marginTop: spacing.xs }]}>
            Modern • Accessible • Beautiful
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  buttonSection: {
    marginTop: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  buttonColumn: {
    marginBottom: spacing.md,
  },
  buttonSpacing: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardSection: {
    marginTop: spacing.md,
  },
  showcaseCard: {
    marginBottom: spacing.md,
  },
  typographySection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  colorSection: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  shadowSection: {
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  shadowBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...layout.flex.center,
    height: 60,
  },
  footer: {
    marginTop: spacing.xxxxl,
    paddingTop: spacing.lg,
  },
});

export default ThemeShowcaseScreen;

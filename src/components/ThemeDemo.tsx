import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Button,
  Card,
  ThemeSettings,
} from './common';
import {
  useTheme,
  useTypography,
  useShadows,
  spacing,
  borderRadius,
} from '../theme';

const ThemeDemo: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const typography = useTypography();
  const shadows = useShadows();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.primary }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.text.primary }]}>
          Theme Demo
        </Text>
        <Text style={[typography.body, { color: theme.text.secondary }]}>
          Testing the new {isDark ? 'dark' : 'light'} theme system
        </Text>
      </View>

      {/* Quick Theme Toggle */}
      <Card
        title="Quick Theme Toggle"
        variant="elevated"
        style={{ marginBottom: spacing.lg }}
      >
        <Button
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
          variant="primary"
          icon={isDark ? 'sunny' : 'moon'}
          onPress={toggleTheme}
          fullWidth
        />
      </Card>

      {/* Button Variants */}
      <Card
        title="Button Variants"
        variant="elevated"
        style={{ marginBottom: spacing.lg }}
      >
        <View style={styles.buttonGrid}>
          <Button title="Primary" variant="primary" style={styles.button} />
          <Button title="Secondary" variant="secondary" style={styles.button} />
          <Button title="Accent" variant="accent" style={styles.button} />
          <Button title="Outline" variant="outline" style={styles.button} />
          <Button title="Success" variant="success" style={styles.button} />
          <Button title="Danger" variant="danger" style={styles.button} />
        </View>
      </Card>

      {/* Card Variants */}
      <View style={styles.cardGrid}>
        <Card
          title="Elevated Card"
          subtitle="With shadow"
          variant="elevated"
          style={styles.gridCard}
        >
          <Text style={[typography.body, { color: theme.text.secondary }]}>
            This card has elevation and shadow.
          </Text>
        </Card>

        <Card
          title="Outlined Card"
          subtitle="With border"
          variant="outlined"
          style={styles.gridCard}
        >
          <Text style={[typography.body, { color: theme.text.secondary }]}>
            This card has a border outline.
          </Text>
        </Card>

        <Card
          title="Filled Card"
          subtitle="With background"
          variant="filled"
          style={styles.gridCard}
        >
          <Text style={[typography.body, { color: theme.text.secondary }]}>
            This card has a filled background.
          </Text>
        </Card>

        <Card
          title="Flat Card"
          subtitle="No elevation"
          variant="flat"
          style={styles.gridCard}
        >
          <Text style={[typography.body, { color: theme.text.secondary }]}>
            This card is flat with no shadows.
          </Text>
        </Card>
      </View>

      {/* Typography Demo */}
      <Card
        title="Typography"
        variant="elevated"
        style={{ marginBottom: spacing.lg }}
      >
        <View style={styles.typographyDemo}>
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
          <Text style={[typography.label, { color: theme.text.primary }]}>
            Label Text
          </Text>
          <Text style={[typography.caption, { color: theme.text.tertiary }]}>
            Caption text for metadata and hints
          </Text>
        </View>
      </Card>

      {/* Color Swatches */}
      <Card
        title="Color Palette"
        variant="elevated"
        style={{ marginBottom: spacing.lg }}
      >
        <View style={styles.colorGrid}>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.primary.main }]} />
            <Text style={[typography.labelSmall, { color: theme.text.primary }]}>Primary</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.secondary.main }]} />
            <Text style={[typography.labelSmall, { color: theme.text.primary }]}>Secondary</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.accent.main }]} />
            <Text style={[typography.labelSmall, { color: theme.text.primary }]}>Accent</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.success.main }]} />
            <Text style={[typography.labelSmall, { color: theme.text.primary }]}>Success</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.warning.main }]} />
            <Text style={[typography.labelSmall, { color: theme.text.primary }]}>Warning</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: theme.error.main }]} />
            <Text style={[typography.labelSmall, { color: theme.text.primary }]}>Error</Text>
          </View>
        </View>
      </Card>

      {/* Theme Settings */}
      <Card
        title="Theme Settings"
        variant="elevated"
        padding="none"
      >
        <ThemeSettings showTitle={false} />
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[typography.caption, { color: theme.text.tertiary, textAlign: 'center' }]}>
          ChopCart Theme System v2.0
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    minWidth: '45%',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  gridCard: {
    flex: 1,
    minWidth: '45%',
  },
  typographyDemo: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  colorItem: {
    alignItems: 'center',
    minWidth: '30%',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
});

export default ThemeDemo;

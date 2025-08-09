import React from 'react';
import { Linking, Platform, Pressable } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';

type Props = React.ComponentProps<typeof Pressable> & { href: string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      onPress={async (event) => {
        try {
          if (Platform.OS !== 'web') {
            event?.preventDefault?.();
            await openBrowserAsync(href);
          } else {
            await Linking.openURL(href);
          }
        } catch (e) {
          console.warn('Failed to open link:', e);
        }
      }}
    />
  );
}

// src/navigation/navigationRef.ts
import { createNavigationContainerRef, ParamListBase } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef<ParamListBase>();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // cast to avoid the "never" signature
    (navigationRef.navigate as unknown as (routeName: string, params?: object) => void)(
      name,
      params,
    );
  }
}

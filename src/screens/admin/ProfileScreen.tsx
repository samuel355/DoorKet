import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  TextInput,
  Button,
  Switch,
  Snackbar,
  useTheme,
  Avatar,
  ActivityIndicator,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import supabase, { Database } from "@/services/supabase";
import { ProfileService } from "@/services/profileService";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 2 },
});

const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const theme = useTheme();
  const PRIMARY = theme?.colors?.primary ?? "#FF9800";

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({
    visible: false,
    text: "",
  });

  // Auth + profile state
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const [profile, setProfile] = useState<UserRow | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // password section
  const [showPwd, setShowPwd] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // ------- load current user + profile -------
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw error ?? new Error("No auth user");

        const uid = data.user.id;
        setUserId(uid);
        setUserEmail(data.user.email ?? "");

        const { data: p, error: pErr } = await ProfileService.getUserProfile(
          uid
        );
        if (pErr) throw new Error(pErr);

        setProfile(p as UserRow | null);
        setFullName((p?.full_name as string) ?? "");
        setPhone((p?.phone as string) ?? "");
        setAvatarUrl((p?.avatar_url as string) ?? null);
      } catch (e) {
        console.error(e);
        setSnack({ visible: true, text: "Failed to load profile" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ------- avatar upload via your StorageService -------
  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setSnack({ visible: true, text: "Permission required to choose image" });
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (!uri || !userId) return;

    try {
      setSaving(true);
      const fileName =
        `avatar_${userId}_${Date.now()}.` +
        (uri.split(".").pop() || "jpg");

      const { data, error } = await ProfileService.uploadProfileImage(
        userId,
        uri,
        fileName
      );
      if (error) throw new Error(error);

      // Be defensive about return shape from StorageService
      const url =
        (data as any)?.publicUrl ??
        (data as any)?.public_url ??
        (data as any)?.url ??
        null;

      if (!url) {
        // If only a path was returned, try to resolve to public URL via Storage rules
        // Tip: Prefer your StorageService to return a public URL; otherwise add a resolver there.
        throw new Error("Upload succeeded but no public URL returned");
      }

      // Persist avatar_url in users table
      const update: UserUpdate = { profile_image_url: url, updated_at: new Date().toISOString() as any };
      const { error: uErr } = await ProfileService.updateUserProfile(
        userId,
        update
      );
      if (uErr) throw new Error(uErr);

      setAvatarUrl(url);
      setSnack({ visible: true, text: "Avatar updated" });
    } catch (e: any) {
      console.error(e);
      setSnack({
        visible: true,
        text: e?.message || "Avatar upload failed",
      });
    } finally {
      setSaving(false);
    }
  };

  // ------- save profile fields -------
  const saveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const update: UserUpdate = {
        full_name: fullName.trim() ?? null,
        phone: phone.trim() ?? null,
        updated_at: new Date().toISOString() as any,
      };
      const { error } = await ProfileService.updateUserProfile(userId, update);
      if (error) throw new Error(error);
      setSnack({ visible: true, text: "Profile saved" });
    } catch (e: any) {
      console.error(e);
      setSnack({ visible: true, text: e?.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  // ------- update auth email (optional: mirror to users table if you store it there) -------
  const saveEmail = async () => {
    if (!userEmail || !userEmail.includes("@")) {
      setSnack({ visible: true, text: "Enter a valid email" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: userEmail.trim(),
      });
      if (error) throw error;

      // If your `users` table has an `email` column and you want it synced, uncomment:
      // await ProfileService.updateUserProfile(userId, { email: userEmail.trim(), updated_at: new Date().toISOString() } as any);

      setSnack({
        visible: true,
        text: "Email updated. Check your inbox to confirm.",
      });
    } catch (e: any) {
      console.error(e);
      setSnack({ visible: true, text: e?.message || "Email update failed" });
    } finally {
      setSaving(false);
    }
  };

  // ------- change password -------
  const changePassword = async () => {
    if (newPwd.length < 8) {
      setSnack({ visible: true, text: "Password must be at least 8 chars" });
      return;
    }
    if (newPwd !== confirmPwd) {
      setSnack({ visible: true, text: "Passwords do not match" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setNewPwd("");
      setConfirmPwd("");
      setShowPwd(false);
      setSnack({ visible: true, text: "Password changed" });
    } catch (e: any) {
      console.error(e);
      setSnack({
        visible: true,
        text: e?.message || "Password change failed",
      });
    } finally {
      setSaving(false);
    }
  };

  // ------- logout -------
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // adjust to your actual auth/root navigator
      navigation?.reset?.({ index: 0, routes: [{ name: "Auth" }] });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={[styles.center, { flex: 1 }]}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.header, shadow]}>
          <View style={[styles.iconCircle, { backgroundColor: "#FF980015" }]}>
            <Ionicons name="person-circle-outline" size={28} color={PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>Admin account settings</Text>
          </View>
          <Button mode="outlined" icon="logout" onPress={logout}>
            Logout
          </Button>
        </View>

        {/* Identity + avatar */}
        <Card style={[styles.card, shadow]}>
          <Card.Title title="Identity" subtitle="Name, contact & avatar" />
          <Card.Content>
            <View style={styles.avatarRow}>
              {avatarUrl ? (
                <Avatar.Image size={72} source={{ uri: avatarUrl }} />
              ) : (
                <Avatar.Icon size={72} icon="account" />
              )}
              <View style={{ marginLeft: 12 }}>
                <Button
                  mode="contained-tonal"
                  onPress={pickAvatar}
                  icon="camera"
                  loading={saving}
                  disabled={saving}
                >
                  Change avatar
                </Button>
                {!!avatarUrl && (
                  <Text
                    style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}
                    numberOfLines={1}
                  >
                    {avatarUrl}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.row}>
              <TextInput
                label="Full name"
                mode="outlined"
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.row}>
              <TextInput
                label="Phone"
                mode="outlined"
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Button
              mode="contained"
              onPress={saveProfile}
              loading={saving}
              disabled={saving}
              icon="content-save"
            >
              Save profile
            </Button>
          </Card.Content>
        </Card>

        {/* Email */}
        <Card style={[styles.card, shadow]}>
          <Card.Title title="Email" subtitle="Used for sign-in and alerts" />
          <Card.Content>
            <View style={styles.row}>
              <TextInput
                label="Email"
                mode="outlined"
                style={styles.input}
                value={userEmail}
                onChangeText={setUserEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <Text style={styles.helpText}>
              Changing email may require confirmation in your inbox.
            </Text>
            <Button
              mode="contained-tonal"
              onPress={saveEmail}
              loading={saving}
              disabled={saving}
              icon="email-edit-outline"
            >
              Update email
            </Button>
          </Card.Content>
        </Card>

        {/* Password */}
        <Card style={[styles.card, shadow]}>
          <Card.Title title="Password" subtitle="Keep your account secure" />
          <Card.Content>
            <View style={[styles.rowBetween, { marginBottom: 8 }]}>
              <Text style={styles.label}>Change password</Text>
              <Switch value={showPwd} onValueChange={setShowPwd} />
            </View>
            {showPwd && (
              <>
                <View style={styles.row}>
                  <TextInput
                    label="New password"
                    mode="outlined"
                    style={styles.input}
                    value={newPwd}
                    onChangeText={setNewPwd}
                    secureTextEntry
                  />
                </View>
                <View style={styles.row}>
                  <TextInput
                    label="Confirm password"
                    mode="outlined"
                    style={styles.input}
                    value={confirmPwd}
                    onChangeText={setConfirmPwd}
                    secureTextEntry
                  />
                </View>
                <Button
                  mode="contained"
                  onPress={changePassword}
                  loading={saving}
                  disabled={saving}
                  icon="lock-reset"
                >
                  Update password
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        <View style={{ height: 28 }} />
      </ScrollView>

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack({ visible: false, text: "" })}
        duration={2200}
      >
        {snack.text}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7FB" },
  content: { padding: 16, paddingBottom: 28 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B" },
  card: { backgroundColor: "#fff", borderRadius: 16, marginTop: 12 },
  row: { paddingHorizontal: 0, paddingVertical: 8 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: { width: "100%" },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  helpText: { fontSize: 12, color: "#64748B", marginBottom: 10, marginTop: 2 },
  center: { justifyContent: "center", alignItems: "center" },
});

export default ProfileScreen;

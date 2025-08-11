import React, { useEffect, useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, StatusBar, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text, Card, Switch, Button, TextInput, Snackbar, useTheme, Menu, IconButton,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import {
  SettingsAdmin, NotificationAdmin, SecurityAdmin,
  type AdminSettings, type NotificationPrefs, type SecuritySettings,
  clearAllAdminLocalCaches,
} from "@/services/settingsService";

const shadow = Platform.select({ ios: { shadowColor:"#000", shadowOpacity:0.06, shadowRadius:8, shadowOffset:{width:0,height:4}}, android:{ elevation:2 } });

const Row = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.row}>{children}</View>
);
const L = ({ children }: { children: React.ReactNode }) => <Text style={styles.label}>{children}</Text>;

const AdminSettingsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const theme = useTheme();
  const PRIMARY = theme?.colors?.primary ?? "#FF9800";

  const [s, setS] = useState<AdminSettings | null>(null);
  const [n, setN] = useState<NotificationPrefs | null>(null);
  const [sec, setSec] = useState<SecuritySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{visible:boolean; text:string}>({visible:false,text:""});

  const [curMenu, setCurMenu] = useState(false);
  const [regMenu, setRegMenu] = useState(false);

  useEffect(() => {
    (async () => {
      const [sa, na, se] = await Promise.all([
        SettingsAdmin.getAll(),
        NotificationAdmin.get(),
        SecurityAdmin.get(),
      ]);
      setS(sa); setN(na); setSec(se);
    })();
  }, []);

  const disabled = useMemo(() => !s || !n || !sec || saving, [s,n,sec,saving]);

  const update = async (patch: Partial<AdminSettings>) => {
    if (!s) return;
    const merged = { ...s, ...patch };
    setS(merged);
    await SettingsAdmin.update(patch);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      // If you later hit Supabase here, do the network saves now.
      setSnack({ visible: true, text: "Settings saved" });
    } catch {
      setSnack({ visible: true, text: "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = async () => {
    const [sa, na, se] = await Promise.all([
      SettingsAdmin.reset(),
      NotificationAdmin.reset(),
      SecurityAdmin.reset(),
    ]);
    setS(sa); setN(na); setSec(se);
    setSnack({ visible: true, text: "Restored to defaults" });
  };

  if (!s || !n || !sec) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={[styles.center, { flex:1 }]}><Text>Loading…</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left","right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.header, shadow]}>
          <View style={[styles.iconCircle, { backgroundColor: "#FF980015" }]}>
            <Ionicons name="settings" size={28} color={PRIMARY} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={styles.title}>Admin Settings</Text>
            <Text style={styles.subtitle}>Control app behavior, policies, and alerts</Text>
          </View>
          <Button mode="contained" icon="content-save" onPress={onSave} loading={saving} disabled={saving}>
            Save
          </Button>
        </View>

        {/* Organization / App */}
        <Card style={[styles.card, shadow]}>
          <Card.Title title="Organization & App" subtitle="Name, currency, region, maintenance" left={(p)=><Ionicons {...p} name="business" size={22} />} />
          <Card.Content>
            <Row>
              <L>Organization name</L>
              <TextInput
                mode="outlined"
                value={s.organizationName}
                onChangeText={(v)=>update({ organizationName: v })}
                style={styles.input}
              />
            </Row>

            <Row>
              <L>Currency</L>
              <Menu
                visible={curMenu}
                onDismiss={()=>setCurMenu(false)}
                anchor={
                  <Button mode="outlined" onPress={()=>setCurMenu(true)} icon="chevron-down">
                    {s.currency}
                  </Button>
                }
              >
                {(["GHS","USD","NGN","KES"] as const).map(c => (
                  <Menu.Item key={c} title={c} onPress={()=>{ update({ currency: c }); setCurMenu(false); }} />
                ))}
              </Menu>
            </Row>

            <Row>
              <L>Region</L>
              <Menu
                visible={regMenu}
                onDismiss={()=>setRegMenu(false)}
                anchor={
                  <Button mode="outlined" onPress={()=>setRegMenu(true)} icon="chevron-down">
                    {s.region}
                  </Button>
                }
              >
                {(["GH","NG","KE","TZ","LR"] as const).map(r => (
                  <Menu.Item key={r} title={r} onPress={()=>{ update({ region: r }); setRegMenu(false); }} />
                ))}
              </Menu>
            </Row>

            <Row>
              <L>Maintenance mode</L>
              <Switch value={s.maintenanceMode} onValueChange={(v)=>update({ maintenanceMode: v })} />
            </Row>

            <Row>
              <L>Low-stock threshold</L>
              <TextInput
                mode="outlined"
                keyboardType="number-pad"
                value={String(s.lowStockThreshold ?? 0)}
                onChangeText={(v)=>update({ lowStockThreshold: Math.max(0, Number(v) || 0) })}
                style={[styles.input, { maxWidth: 120 }]}
              />
            </Row>
          </Card.Content>
        </Card>

        {/* Policies */}
        <Card style={[styles.card, shadow]}>
          <Card.Title title="Policies" subtitle="Operational rules" left={(p)=><Ionicons {...p} name="shield-checkmark" size={22} />} />
          <Card.Content>
            <Row><L>Auto-approve students</L><Switch value={s.autoApproveStudents} onValueChange={(v)=>update({ autoApproveStudents: v })} /></Row>
            <Row><L>Require runner verification</L><Switch value={s.requireRunnerVerification} onValueChange={(v)=>update({ requireRunnerVerification: v })} /></Row>
            <Row><L>Enable cash on delivery</L><Switch value={s.enableCashOnDelivery} onValueChange={(v)=>update({ enableCashOnDelivery: v })} /></Row>
            <Row><L>Allow price edits by admins</L><Switch value={s.allowPriceEdits} onValueChange={(v)=>update({ allowPriceEdits: v })} /></Row>
          </Card.Content>
        </Card>

        {/* Notifications summary + link */}
        <Card style={[styles.card, shadow]}>
          <Card.Title title="Notifications" subtitle="Channels & events" left={(p)=><Ionicons {...p} name="notifications" size={22} />} />
          <Card.Content>
            <Row><L>Push / Email / SMS</L>
              <View style={{ flexDirection:"row", gap:8 }}>
                <IconButton icon={n.pushEnabled ? "check-circle" : "close-circle"} iconColor={n.pushEnabled ? "#16A34A" : "#EF4444"} />
                <IconButton icon={n.emailEnabled ? "check-circle" : "close-circle"} iconColor={n.emailEnabled ? "#16A34A" : "#EF4444"} />
                <IconButton icon={n.smsEnabled ? "check-circle" : "close-circle"} iconColor={n.smsEnabled ? "#16A34A" : "#EF4444"} />
              </View>
            </Row>
            <Button
              mode="outlined"
              icon="chevron-right"
              onPress={()=>navigation?.navigate?.("Notifications")}
              style={{ alignSelf:"flex-start", marginTop: 8 }}
            >
              Configure notifications
            </Button>
          </Card.Content>
        </Card>

        {/* Security summary */}
        <Card style={[styles.card, shadow]}>
          <Card.Title title="Security" subtitle="Device & session controls" left={(p)=><Ionicons {...p} name="lock-closed" size={22} />} />
          <Card.Content>
            <Row><L>Biometric app lock</L><Switch value={sec.biometricLock} onValueChange={async (v)=>{ setSec(await SecurityAdmin.update({ biometricLock: v })); }} /></Row>
            <Row><L>Re-auth for sensitive actions</L><Switch value={sec.reauthForSensitive} onValueChange={async (v)=>{ setSec(await SecurityAdmin.update({ reauthForSensitive: v })); }} /></Row>
          </Card.Content>
        </Card>

        {/* Advanced */}
        <Card style={[styles.card, shadow]}>
          <Card.Title title="Advanced" subtitle="Cache & defaults" left={(p)=><Ionicons {...p} name="construct" size={22} />} />
          <Card.Content>
            <Row>
              <Button mode="contained-tonal" onPress={restoreDefaults} icon="backup-restore" disabled={disabled}>
                Restore defaults
              </Button>
              <View style={{ width: 10 }} />
              <Button
                mode="contained-tonal"
                onPress={async ()=>{
                  await clearAllAdminLocalCaches();
                  setSnack({ visible: true, text: "Local caches cleared" });
                }}
                icon="broom"
              >
                Clear local cache
              </Button>
            </Row>
          </Card.Content>
        </Card>

        <View style={{ height: 28 }} />
      </ScrollView>

      <Snackbar visible={snack.visible} onDismiss={()=>setSnack({visible:false, text:""})} duration={2200}>
        {snack.text}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7FB" },
  content: { padding: 16, paddingBottom: 28 },
  header: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    padding: 12, borderRadius: 16, marginBottom: 12,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 10 },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B" },
  card: { backgroundColor: "#fff", borderRadius: 16, marginTop: 12 },
  row: { paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 14, color: "#0F172A", fontWeight: "700" },
  input: { flex: 1, marginLeft: 12 },
  center: { justifyContent: "center", alignItems: "center" },
});

export default AdminSettingsScreen;

import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Switch, Divider, Button, TextInput, Snackbar, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { NotificationAdmin, type NotificationPrefs } from "@/services/settingsService";

const Row = ({ children }: { children: React.ReactNode }) => <View style={styles.row}>{children}</View>;
const L = ({ children }: { children: React.ReactNode }) => <Text style={styles.label}>{children}</Text>;

const NotificationsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const theme = useTheme();
  const PRIMARY = theme?.colors?.primary ?? "#FF9800";
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [snack, setSnack] = useState<{visible:boolean; text:string}>({visible:false,text:""});
  const [start, setStart] = useState("22:00");
  const [end, setEnd] = useState("06:30");

  useEffect(() => { (async () => {
    const p = await NotificationAdmin.get();
    setPrefs(p);
    if (p.quietHours) { setStart(p.quietHours.start); setEnd(p.quietHours.end); }
  })(); }, []);

  if (!prefs) {
    return (
      <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={[styles.center, { flex:1 }]}><Text>Loading…</Text></View>
      </SafeAreaView>
    );
  }

  const update = async (patch: Partial<NotificationPrefs>) => {
    const next = await NotificationAdmin.update(patch);
    setPrefs(next);
  };

  const saveQuietHours = async () => {
    await update({ quietHours: { start, end } });
    setSnack({ visible: true, text: "Quiet hours updated" });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left","right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: "#FF980015" }]}>
            <Ionicons name="notifications" size={28} color={PRIMARY} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Channels and event alerts</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <Card.Title title="Channels" />
          <Card.Content>
            <Row><L>Push notifications</L><Switch value={prefs.pushEnabled} onValueChange={(v)=>update({ pushEnabled: v })} /></Row>
            <Row><L>Email</L><Switch value={prefs.emailEnabled} onValueChange={(v)=>update({ emailEnabled: v })} /></Row>
            <Row><L>SMS</L><Switch value={prefs.smsEnabled} onValueChange={(v)=>update({ smsEnabled: v })} /></Row>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Events" />
          <Card.Content>
            <Row><L>Order events</L><Switch value={prefs.orderEvents} onValueChange={(v)=>update({ orderEvents: v })} /></Row>
            <Row><L>Stock alerts</L><Switch value={prefs.stockAlerts} onValueChange={(v)=>update({ stockAlerts: v })} /></Row>
            <Row><L>System announcements</L><Switch value={prefs.systemAnnouncements} onValueChange={(v)=>update({ systemAnnouncements: v })} /></Row>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Quiet hours" subtitle="Silence non-critical alerts during these times" />
          <Card.Content>
            <Row>
              <TextInput mode="outlined" label="Start (HH:MM)" style={{ flex:1, marginRight: 8 }} value={start} onChangeText={setStart} />
              <TextInput mode="outlined" label="End (HH:MM)" style={{ flex:1, marginLeft: 8 }} value={end} onChangeText={setEnd} />
            </Row>
            <Button mode="contained" onPress={saveQuietHours} style={{ marginTop: 10 }} icon="content-save">Save quiet hours</Button>
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
  safe: { flex:1, backgroundColor:"#F7F7FB" },
  content: { padding: 16, paddingBottom: 28 },
  header: { flexDirection:"row", alignItems:"center", backgroundColor:"#fff", padding:12, borderRadius:16, marginBottom:12 },
  iconCircle: { width:44, height:44, borderRadius:12, alignItems:"center", justifyContent:"center", marginRight:10 },
  title: { fontSize:20, fontWeight:"800", color:"#0F172A" },
  subtitle: { fontSize:13, color:"#64748B" },
  card: { backgroundColor:"#fff", borderRadius:16, marginTop:12 },
  row: { paddingHorizontal:14, paddingVertical:10, flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  label: { fontSize:14, color:"#0F172A", fontWeight:"700" },
  center: { justifyContent:"center", alignItems:"center" },
});

export default NotificationsScreen;

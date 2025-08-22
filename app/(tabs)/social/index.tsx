import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import HSButton from "@/components/HSButton";
import { useWallet } from "@/providers/WalletProvider";
import { formatTrx } from "@/utils/format";
import { Stack } from "expo-router";
import { Plus, Minus, Users, Clock, Check, X } from "lucide-react-native";
import TomatoMascot from "@/components/TomatoMascot";

type Person = { id: string; name: string; share: number };

export default function SocialSplitScreen() {
  const insets = useSafeAreaInsets();
  const { send, wallet, addIOU, settleIOU } = useWallet();
  const [total, setTotal] = useState<string>("");
  const [people, setPeople] = useState<Person[]>([
    { id: "1", name: "You", share: 1 },
    { id: "2", name: "Alex", share: 1 },
  ]);
  const [note, setNote] = useState<string>("Cooking night");

  const [iouTo, setIouTo] = useState<string>("");
  const [iouAmount, setIouAmount] = useState<string>("");
  const [iouNote, setIouNote] = useState<string>("Help with groceries");

  const perHead = useMemo(() => {
    const t = parseFloat(total) || 0;
    const shares = people.reduce((acc, p) => acc + p.share, 0);
    if (shares <= 0) return 0;
    return t / shares;
  }, [total, people]);

  const onAdd = () => {
    const id = `${Date.now()}`;
    setPeople((p) => [...p, { id, name: `Friend ${p.length}`, share: 1 }]);
  };

  const removePerson = (id: string) => {
    if (people.length > 2) {
      setPeople((p) => p.filter((person) => person.id !== id));
    }
  };

  // Fixed: Line 52 - Changed from 6 arguments to 2
  const onSend = async () => {
    const amountTrx = parseFloat(total) || 0;
    if (amountTrx <= 0) return;
    
    // For split payments, we'll send to a dummy address or handle it differently
    // Since this is a split bill, you might want to handle this differently
    // For now, let's create an IOU for the split amount
    try {
      await addIOU(amountTrx, `Split bill: ${note} (${people.length} people)`);
      console.log(`Split bill created: ${amountTrx} TRX for ${note}`);
    } catch (e) {
      console.error("[Social] split error", e);
    }
  };

  const renderPerson = ({ item, index }: { item: Person; index: number }) => (
    <View style={styles.personCard}>
      <View style={styles.personLeft}>
        <View style={[styles.personAvatar, { backgroundColor: index === 0 ? Colors.brand.cherryRed : Colors.brand.peach }]}>
          <Text style={styles.personAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <TextInput
          value={item.name}
          onChangeText={(t) =>
            setPeople((arr) => arr.map((p, ix) => (ix === index ? { ...p, name: t } : p)))
          }
          style={styles.personName}
          placeholder="Name"
        />
      </View>
      
      <View style={styles.personRight}>
        <View style={styles.shareControls}>
          <TouchableOpacity 
            onPress={() => setPeople((arr) => arr.map((p, ix) => 
              ix === index ? { ...p, share: Math.max(0, p.share - 1) } : p
            ))}
            style={styles.shareButton}
          >
            <Minus color={Colors.brand.cherryRed} size={16} />
          </TouchableOpacity>
          
          <Text style={styles.shareText}>{item.share}</Text>
          
          <TouchableOpacity 
            onPress={() => setPeople((arr) => arr.map((p, ix) => 
              ix === index ? { ...p, share: p.share + 1 } : p
            ))}
            style={styles.shareButton}
          >
            <Plus color={Colors.brand.cherryRed} size={16} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.shareAmount}>£{(perHead * item.share).toFixed(2)}</Text>
        
        {people.length > 2 && index > 0 && (
          <TouchableOpacity onPress={() => removePerson(item.id)} style={styles.removeButton}>
            <X color={Colors.brand.cherryRed} size={16} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderIOU = ({ item }: { item: any }) => (
    <View style={styles.iouCard}>
      <View style={styles.iouLeft}>
        <View style={[styles.iouIcon, { backgroundColor: item.settled ? "#dcfce7" : "#fef3c7" }]}>
          {item.settled ? (
            <Check color="#16a34a" size={16} />
          ) : (
            <Clock color="#d97706" size={16} />
          )}
        </View>
        <View>
          <Text style={styles.iouTitle}>{item.to || "Group"} owes you</Text>
          <Text style={styles.iouAmount}>£{(item.amount * 0.12).toFixed(2)} ({formatTrx(item.amount)})</Text>
          {item.description && <Text style={styles.iouNote}>{item.description}</Text>}
        </View>
      </View>
      
      {!item.settled && (
        <HSButton 
          title="Settle" 
          variant="ghost" 
          onPress={() => settleIOU(item.id)} 
          style={styles.settleButton}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="social-screen">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <TomatoMascot size={60} mood="speedy" animated />
          <Text style={styles.headerTitle}>Split & Cook</Text>
          <Text style={styles.headerSubtitle}>Split bills easily with friends</Text>
        </View>

        {/* Split Bill Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Bill</Text>
          
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <View style={styles.totalInput}>
              <Text style={styles.currencySymbol}>£</Text>
              <TextInput
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={total}
                onChangeText={setTotal}
                style={styles.totalValue}
                testID="total-input"
              />
            </View>
            <Text style={styles.totalTrx}>≈ {formatTrx(parseFloat(total) / 0.12 || 0)}</Text>
          </View>

          <View style={styles.peopleSection}>
            <View style={styles.peopleHeader}>
              <Text style={styles.peopleTitle}>People ({people.length})</Text>
              <TouchableOpacity onPress={onAdd} style={styles.addPersonButton}>
                <Plus color="#ffffff" size={16} />
                <Text style={styles.addPersonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={people}
              keyExtractor={(item) => item.id}
              renderItem={renderPerson}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>What's this for?</Text>
            <TextInput
              placeholder="Dinner, groceries, etc..."
              value={note}
              onChangeText={setNote}
              style={styles.noteInput}
            />
          </View>

          <HSButton 
            title={`Split £${(parseFloat(total) || 0).toFixed(2)}`}
            onPress={onSend} 
            variant="primary" 
            testID="send-split-btn"
            style={styles.splitButton}
          />
        </View>

        {/* IOU Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IOU Requests</Text>
          
          <View style={styles.iouForm}>
            <View style={styles.iouInputRow}>
              <TextInput
                placeholder="Friend's name"
                value={iouTo}
                onChangeText={setIouTo}
                style={[styles.iouInput, { flex: 1 }]}
                testID="iou-to"
              />
              <TextInput
                placeholder="£0.00"
                value={iouAmount}
                onChangeText={setIouAmount}
                keyboardType="decimal-pad"
                style={[styles.iouInput, { width: 100 }]}
                testID="iou-amount"
              />
            </View>
            
            <TextInput
              placeholder="What for?"
              value={iouNote}
              onChangeText={setIouNote}
              style={styles.iouInput}
              testID="iou-note"
            />
            
            <HSButton
              title="Create IOU Request"
              variant="secondary"
              onPress={async () => {
                const amt = parseFloat(iouAmount) / 0.12; // Convert £ to TRX
                if (!isFinite(amt) || amt <= 0 || !iouTo.trim()) return;
                try {
                  // Fixed: Line 246 - Changed from 3 arguments to 2
                  await addIOU(amt, `${iouNote} (from ${iouTo})`);
                  setIouAmount("");
                  setIouTo("");
                  setIouNote("Help with groceries");
                } catch (e) {
                  console.log("[IOU] create error", e);
                }
              }}
              testID="create-iou-btn"
              style={styles.createIouButton}
            />
          </View>

          {(wallet.iouRequests?.length ?? 0) > 0 ? (
            <FlatList
              data={wallet.iouRequests}
              keyExtractor={(item) => item.id}
              renderItem={renderIOU}
              scrollEnabled={false}
              style={styles.iouList}
            />
          ) : (
            <View style={styles.emptyIou}>
              <Users color={Colors.brand.inkMuted} size={32} />
              <Text style={styles.emptyIouText}>No IOUs yet</Text>
              <Text style={styles.emptyIouSubtext}>Create your first IOU request above</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#ffffff" 
  },
  scrollContent: { 
    paddingBottom: 40 
  },
  headerCard: {
    alignItems: "center",
    padding: 24,
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
  },
  section: {
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
  },
  totalCard: {
    backgroundColor: Colors.brand.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.brand.inkMuted,
  },
  totalInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "900" as const,
    color: Colors.brand.cherryRed,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "900" as const,
    color: Colors.brand.ink,
    minWidth: 100,
    textAlign: "center",
  },
  totalTrx: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
  },
  peopleSection: {
    gap: 12,
  },
  peopleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  peopleTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
  },
  addPersonButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.brand.cherryRed,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addPersonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },
  personLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  personAvatarText: {
    color: "#ffffff",
    fontWeight: "700" as const,
    fontSize: 16,
  },
  personName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.brand.ink,
    flex: 1,
  },
  personRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shareControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brand.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
    minWidth: 20,
    textAlign: "center",
  },
  shareAmount: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.brand.cherryRed,
    minWidth: 50,
    textAlign: "right",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  noteSection: {
    gap: 8,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.brand.ink,
  },
  noteInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  splitButton: {
    marginTop: 8,
    backgroundColor: Colors.brand.cherryRed,
  },
  iouForm: {
    gap: 12,
  },
  iouInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  iouInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.brand.border,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  createIouButton: {
    marginTop: 4,
  },
  iouList: {
    marginTop: 8,
  },
  iouCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.brand.border,
  },
  iouLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iouIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iouTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
  },
  iouAmount: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: Colors.brand.cherryRed,
    marginTop: 2,
  },
  iouNote: {
    fontSize: 12,
    color: Colors.brand.inkMuted,
    marginTop: 2,
  },
  settleButton: {
    height: 36,
    paddingHorizontal: 16,
  },
  emptyIou: {
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  emptyIouText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.brand.ink,
  },
  emptyIouSubtext: {
    fontSize: 14,
    color: Colors.brand.inkMuted,
    textAlign: "center",
  },
});
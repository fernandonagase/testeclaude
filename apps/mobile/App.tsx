import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { MyDexesScreen } from './src/screens/MyDexesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const TABS = [
  { key: 'discover', label: 'Descobrir', screen: DiscoverScreen },
  { key: 'mydexes', label: 'Minhas Dexes', screen: MyDexesScreen },
  { key: 'profile', label: 'Perfil', screen: ProfileScreen },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/**
 * Esqueleto da Fase 0 com navegação mínima por abas.
 * TODO(Fase 1): react-navigation, telas reais de Dex e captura, sync offline.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('discover');
  const ActiveScreen = TABS.find((tab) => tab.key === activeTab)!.screen;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActiveScreen />
      </View>
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable key={tab.key} style={styles.tab} onPress={() => setActiveTab(tab.key)}>
            <Text style={tab.key === activeTab ? styles.tabActive : styles.tabLabel}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#ddd' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabLabel: { color: '#666' },
  tabActive: { color: '#1a73e8', fontWeight: '700' },
});

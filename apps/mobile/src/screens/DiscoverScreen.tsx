import { StyleSheet, Text, View } from 'react-native';
import { DEX_CATEGORIES } from '@collectdex/shared';

/** TODO(Fase 3): busca real (GET /v1/dexes) com filtros e popularidade. */
export function DiscoverScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Descobrir</Text>
      <Text style={styles.subtitle}>Encontre Dexes para colecionar.</Text>
      {DEX_CATEGORIES.map((category) => (
        <Text key={category} style={styles.category}>
          • {category}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 4, marginBottom: 16 },
  category: { fontSize: 16, paddingVertical: 4, textTransform: 'capitalize' },
});

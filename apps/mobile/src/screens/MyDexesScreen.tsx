import { StyleSheet, Text, View } from 'react-native';
import { computeProgress } from '@collectdex/shared';

/** TODO(Fase 1): trackers reais (GET /v1/me/trackers) com cache local p/ offline. */
export function MyDexesScreen() {
  const exampleProgress = computeProgress(37, 120);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Minhas Dexes</Text>
      <View style={styles.card}>
        <Text style={styles.dexTitle}>Aves do Cerrado (exemplo)</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: exampleProgress }]} />
          <View style={{ flex: 1 - exampleProgress }} />
        </View>
        <Text style={styles.progressLabel}>37/120 · {Math.round(exampleProgress * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16 },
  dexTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  progressTrack: { flexDirection: 'row', height: 8, borderRadius: 4, backgroundColor: '#eee' },
  progressFill: { backgroundColor: '#1a73e8', borderRadius: 4 },
  progressLabel: { marginTop: 6, color: '#666' },
});

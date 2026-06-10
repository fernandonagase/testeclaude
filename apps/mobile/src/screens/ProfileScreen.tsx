import { StyleSheet, Text, View } from 'react-native';

/** TODO(Fase 1): login via provedor gerenciado e GET /v1/me. */
export function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Entre para guardar seu progresso.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 4 },
});

import React, { useContext, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationContext } from '@/contexts/NotificationContext';

const ITEMS_PER_PAGE = 5;

export default function NotificationCenter() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useContext(NotificationContext);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);

  const paginated = notifications.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Centre de notifications</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.actionBtn}>Tout lire</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.actionBtn}>Tout effacer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={paginated}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.unread]}
            onPress={() => markAsRead(item.id)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
            <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune notification</Text>}
      />

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity disabled={page === 1} onPress={() => setPage(p => p - 1)}>
            <Text style={styles.pageBtn}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>Page {page} / {totalPages}</Text>
          <TouchableOpacity disabled={page === totalPages} onPress={() => setPage(p => p + 1)}>
            <Text style={styles.pageBtn}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionBtn: {
    color: '#007AFF',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#F2F2F2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardBody: {
    fontSize: 14,
    color: '#555',
    marginVertical: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  pageBtn: {
    fontSize: 24,
    marginHorizontal: 20,
    color: '#007AFF',
  },
  pageIndicator: {
    fontSize: 16,
    fontWeight: '500',
  },
});

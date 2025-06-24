import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/constants/Translations';
import { COLORS } from '@/constants/Colors';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const InvoiceEditor = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [items, setItems] = useState<LineItem[]>([]);
  const [currentItem, setCurrentItem] = useState<LineItem>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0
  });

  const calculateTotal = (item: LineItem) => {
    return item.quantity * item.unitPrice;
  };

  const addItem = () => {
    const newItem = {
      ...currentItem,
      total: calculateTotal(currentItem)
    };
    setItems([...items, newItem]);
    setCurrentItem({
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    });
  };

  const getSubTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const getTVA = () => {
    return getSubTotal() * 0.20; // 20% TVA
  };

  const getTotal = () => {
    return getSubTotal() + getTVA();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.createInvoice}</Text>
      </View>

      <View style={styles.itemInput}>
        <TextInput
          style={styles.input}
          placeholder={t.description}
          value={currentItem.description}
          onChangeText={(text) => setCurrentItem({...currentItem, description: text})}
        />
        <TextInput
          style={styles.input}
          placeholder={t.quantity}
          keyboardType="numeric"
          value={currentItem.quantity.toString()}
          onChangeText={(text) => setCurrentItem({...currentItem, quantity: parseInt(text) || 0})}
        />
        <TextInput
          style={styles.input}
          placeholder={t.unitPrice}
          keyboardType="numeric"
          value={currentItem.unitPrice.toString()}
          onChangeText={(text) => setCurrentItem({...currentItem, unitPrice: parseFloat(text) || 0})}
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>{t.addItem}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.itemsList}>
        {items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.itemDescription}>{item.description}</Text>
            <Text style={styles.itemDetails}>
              {item.quantity} x {item.unitPrice}€ = {item.total}€
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t.subtotal}</Text>
          <Text style={styles.summaryValue}>{getSubTotal().toFixed(2)}€</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t.tva}</Text>
          <Text style={styles.summaryValue}>{getTVA().toFixed(2)}€</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t.total}</Text>
          <Text style={styles.summaryValue}>{getTotal().toFixed(2)}€</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemInput: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemsList: {
    padding: 16,
  },
  item: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemDetails: {
    color: '#666',
  },
  summary: {
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
}
const App = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const productsCollection = firestore().collection('products');

  useEffect(() => {
    const subscriber = productsCollection.orderBy('name', 'asc').onSnapshot(
      querySnapshot => {
        const productList: Product[] = [];
        querySnapshot.forEach(doc => {
          productList.push({
            id: doc.id,
            ...doc.data(),
          } as Product);
        });
        setProducts(productList);
        setError(null);
      },
      err => {
        setError(err.message);
      },
    );

    return () => subscriber();
  }, []);

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('');
    setImageUrl('');
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!name.trim() || !price.trim() || !category.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      setError('Price must be a valid positive number');
      return;
    }

    try {
      await productsCollection.add({
        name: name.trim(),
        price: priceNumber,
        category: category.trim(),
        imageUrl: imageUrl.trim(),
      });
      resetForm();
      setError(null);
    } catch (e: any) {
      setError('Failed to add product: ' + e.message);
    }
  };

  const handleEdit = (product: Product) => {
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setImageUrl(product.imageUrl || '');
    setEditingId(product.id);
  };

  const handleUpdate = async () => {
    if (!editingId) {
      setError('No product selected for editing');
      return;
    }

    if (!name.trim() || !price.trim() || !category.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      setError('Price must be a valid positive number');
      return;
    }

    try {
      await productsCollection.doc(editingId).update({
        name: name.trim(),
        price: priceNumber,
        category: category.trim(),
        imageUrl: imageUrl.trim(),
      });
      resetForm();
      setError(null);
    } catch (e: any) {
      setError('Failed to update product: ' + e.message);
    }
  };

  const handleDelete = (id: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productsCollection.doc(id).delete();
              setError(null);
            } catch (e: any) {
              setError('Failed to delete product: ' + e.message);
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Product Management</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Product Name"
          />
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Price"
            keyboardType="decimal-pad"
          />
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Category"
          />
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="Image URL"
          />

          {editingId ? (
            <View style={styles.buttonGroup}>
              <Button title="Update Product" onPress={handleUpdate} />
              <Button title="Cancel" onPress={resetForm} color="gray" />
            </View>
          ) : (
            <Button title="Add Product" onPress={handleCreate} />
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.subHeader}>Products List</Text>
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.productItem}>
              <View style={styles.productInfo}>
                {item.imageUrl ? (
                  <Image
                    source={{uri: item.imageUrl}}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text>No Image</Text>
                  </View>
                )}
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>
                    ${item.price.toFixed(2)}
                  </Text>
                  <Text style={styles.productCategory}>{item.category}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(item)}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(item.id, item.name)}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 20,
  },
  formContainer: {
    paddingLeft: 15,
    paddingRight: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  productItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  productInfo: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: '#008000',
    marginBottom: 5,
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#4682B4',
  },
  deleteButton: {
    backgroundColor: '#DC143C',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default App;

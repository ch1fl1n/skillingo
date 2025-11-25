import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
  Dimensions,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Book = {
  title: string;
  author?: string;
  cover?: string | null;
};

const STORAGE_POS = '@RandomBook:pos';
const STORAGE_COLLAPSED = '@RandomBook:collapsed';
const STORAGE_BOOK = '@RandomBook:book';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BUBBLE_SIZE = 64;

export default function RandomBook(): JSX.Element {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [pos, setPos] = useState({ x: SCREEN_W - BUBBLE_SIZE - 16, y: SCREEN_H - BUBBLE_SIZE - 120 });

  const panStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    (async () => {
      try {
        const posRaw = await AsyncStorage.getItem(STORAGE_POS);
        const collapsedRaw = await AsyncStorage.getItem(STORAGE_COLLAPSED);
        const bookRaw = await AsyncStorage.getItem(STORAGE_BOOK);

        if (posRaw) {
          const parsed = JSON.parse(posRaw);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setPos(clampPos(parsed));
          }
        }

        if (collapsedRaw !== null) {
          setCollapsed(collapsedRaw === 'true');
        }

        if (bookRaw) {
          setBook(JSON.parse(bookRaw));
        }
              } catch (e) {
                console.log('RandomBook load error', e);
              }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_POS, JSON.stringify(pos)).catch(() => {});
  }, [pos]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_COLLAPSED, String(collapsed)).catch(() => {});
  }, [collapsed]);

  useEffect(() => {
    if (book) AsyncStorage.setItem(STORAGE_BOOK, JSON.stringify(book)).catch(() => {});
  }, [book]);

  function clampPos(p: { x: number; y: number }) {
    const x = Math.max(8, Math.min(p.x, SCREEN_W - BUBBLE_SIZE - 8));
    const y = Math.max(8, Math.min(p.y, SCREEN_H - BUBBLE_SIZE - 8));
    return { x, y };
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panStart.current = { x: pos.x, y: pos.y };
      },
      onPanResponderMove: (_evt, gestureState) => {
        const nx = panStart.current.x + gestureState.dx;
        const ny = panStart.current.y + gestureState.dy;
        setPos(clampPos({ x: nx, y: ny }));
      },
      onPanResponderRelease: () => {},
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  async function getRandomBook() {
    try {
      setLoading(true);

      const res = await fetch('https://openlibrary.org/search.json?q=the&limit=200');
      const data = await res.json();

      if (!data?.docs?.length) {
        setBook(null);
        return;
      }

      const randomIndex = Math.floor(Math.random() * data.docs.length);
      const randomBook = data.docs[randomIndex];

      const formatted: Book = {
        title: randomBook.title,
        author: randomBook.author_name?.[0],
        cover: randomBook.cover_i
          ? `https://covers.openlibrary.org/b/id/${randomBook.cover_i}-L.jpg`
          : null,
      };

      setBook(formatted);
    } catch (e) {
      console.log('RandomBook error:', e);
    } finally {
      setLoading(false);
    }
  }

  function toggleCollapsed() {
    setCollapsed((c) => !c);
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        style={[styles.container, { left: pos.x, top: pos.y, width: collapsed ? BUBBLE_SIZE : 260 }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={toggleCollapsed} style={styles.bubbleTouch}>
          {collapsed ? (
            <View style={styles.bubble}>
              <Text style={styles.emoji}>📚</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Random Book</Text>
                <TouchableOpacity onPress={() => setCollapsed(true)}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <TouchableOpacity onPress={getRandomBook} style={styles.refreshButton}>
                  <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>

                {loading && <ActivityIndicator style={{ marginTop: 8 }} />}

                {book && !loading && (
                  <View style={styles.bookRow}>
                    {book.cover ? (
                      <Image source={{ uri: book.cover }} style={styles.cover} />
                    ) : (
                      <View style={[styles.cover, styles.coverPlaceholder]}>
                        <Text style={{ fontSize: 12 }}>No cover</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text numberOfLines={2} style={styles.bookTitle}>
                        {book.title}
                      </Text>
                      {book.author && <Text style={styles.bookAuthor}>{book.author}</Text>}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  bubbleTouch: {
    alignItems: 'center',
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#2b6cb0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  emoji: {
    fontSize: 28,
  },
  card: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontWeight: '700' },
  close: { fontSize: 18, paddingHorizontal: 6 },
  content: { marginTop: 8 },
  refreshButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  refreshText: { fontWeight: '600' },
  bookRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  cover: { width: 64, height: 96, borderRadius: 4, backgroundColor: '#f1f5f9' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontWeight: '700' },
  bookAuthor: { color: '#475569', marginTop: 4 },
});

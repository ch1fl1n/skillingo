import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
  useWindowDimensions,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Book = {
  title: string;
  author?: string;
  cover?: string | null;
};

const STORAGE_POS = '@RandomBook:pos';
const STORAGE_COLLAPSED = '@RandomBook:collapsed';
const STORAGE_BOOK = '@RandomBook:book';

// We'll read dimensions dynamically so the bubble behaves correctly on rotation and different devices
const BUBBLE_SIZE = 64;
// Toggle to pin bubble to left-center. Set true to disable dragging and keep it fixed.
const FIXED_LEFT_CENTER = true;

export default function RandomBook(): JSX.Element {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const initialWindow = Dimensions.get('window');
  const effectiveW = SCREEN_W || initialWindow.width;
  const effectiveH = SCREEN_H || initialWindow.height;
  const leftCenter = { x: 8, y: Math.round(effectiveH / 2 - BUBBLE_SIZE / 2) };
  const initialPos = FIXED_LEFT_CENTER ? leftCenter : { x: effectiveW - BUBBLE_SIZE - 16, y: effectiveH - BUBBLE_SIZE - 120 };
  const [pos, setPos] = useState(initialPos);
  const animatedPos = useRef(new Animated.ValueXY({ x: Number(initialPos.x || 8), y: Number(initialPos.y || 8) })).current;
  const dragState = useRef({ dragging: false });

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
    // keep animated value in sync when pos is updated externally (load or after snap)
    animatedPos.setValue({ x: pos.x, y: pos.y });
  }, [pos]);

  // Keep bubble within bounds when orientation/dimensions change
  useEffect(() => {
    if (FIXED_LEFT_CENTER) {
      const lc = { x: 8, y: Math.round(SCREEN_H / 2 - BUBBLE_SIZE / 2) };
      setPos(lc);
      animatedPos.setValue(lc);
    } else {
      setPos((p) => clampPos(p));
    }
  }, [SCREEN_W, SCREEN_H]);

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
      // Don't claim responder on start (avoids interfering with ScrollView)
      onStartShouldSetPanResponder: () => false,
      // Start responding only when there's a clear drag gesture
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        if (FIXED_LEFT_CENTER) return false;
        const dx = Math.abs(gestureState.dx || 0);
        const dy = Math.abs(gestureState.dy || 0);
        return dx > 6 || dy > 6; // small threshold
      },
      onPanResponderGrant: () => {
        panStart.current = { x: pos.x, y: pos.y };
        dragState.current.dragging = false;
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (FIXED_LEFT_CENTER) return;
        dragState.current.dragging = true;
        const nx = panStart.current.x + gestureState.dx;
        const ny = panStart.current.y + gestureState.dy;
        const clamped = clampPos({ x: nx, y: ny });
        // update animated position for smooth movement
        animatedPos.setValue({ x: clamped.x, y: clamped.y });
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (FIXED_LEFT_CENTER) return;
        // apply small inertia based on gesture velocity then snap to nearest edge
        const INERTIA = 300; // multiplier for velocity to pixels
        const projectedX = panStart.current.x + gestureState.dx + (gestureState.vx || 0) * INERTIA;
        const projectedY = panStart.current.y + gestureState.dy + (gestureState.vy || 0) * INERTIA;
        const afterInertia = clampPos({ x: projectedX, y: projectedY });

        // snap horizontally to nearest edge
        const centerX = afterInertia.x + BUBBLE_SIZE / 2;
        const snapX = centerX < SCREEN_W / 2 ? 8 : SCREEN_W - BUBBLE_SIZE - 8;
        const snapY = afterInertia.y; // keep vertical where released (clamped)

        // animate to snap position
        Animated.spring(animatedPos, {
          toValue: { x: snapX, y: snapY },
          useNativeDriver: false,
          speed: 20,
          bounciness: 6,
        }).start(() => {
          // persist final position
          const final = { x: snapX, y: snapY };
          setPos(final);
          dragState.current.dragging = false;
        });
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  async function getRandomBook() {
    setError(null);
    setLoading(true);
    try {
      // Try a set of curated seed queries and small limits to avoid server-side rejections.
      const seeds = ['novel', 'fiction', 'story', 'history', 'science', 'fantasy', 'children', 'biography', 'poetry'];
      const limits = [50, 20, 10];

      for (const seed of seeds) {
        for (const lim of limits) {
          try {
            const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(seed)}&limit=${lim}`;
            // Some mobile environments can be restrictive; add a try/catch and small timeout behavior
            const res = await fetch(url, {
              headers: {
                Accept: 'application/json',
                'User-Agent': 'skillingo-app/1.0 (+https://skillingo.local)'
              }
            });

            if (res.status === 422) {
              const body = await res.text().catch(() => '[no-body]');
              console.warn(`OpenLibrary returned 422 for seed=${seed} limit=${lim}, body:`, body);
              continue; // try smaller limit or next seed
            }

            if (!res.ok) {
              const body = await res.text().catch(() => '[no-body]');
              console.warn(`OpenLibrary non-OK response for seed=${seed} limit=${lim}: ${res.status} ${res.statusText}`, body);
              continue;
            }

            const data = await res.json();
            if (data?.docs?.length) {
              const randomIndex = Math.floor(Math.random() * data.docs.length);
              const randomBook = data.docs[randomIndex];
              const formatted: Book = {
                title: randomBook.title,
                author: randomBook.author_name?.[0],
                cover: randomBook.cover_i ? `https://covers.openlibrary.org/b/id/${randomBook.cover_i}-L.jpg` : null,
              };
              setBook(formatted);
              return;
            }
          } catch (innerErr) {
            console.warn(`RandomBook fetch attempt failed for seed=${seed} limit=${lim}:`, innerErr);
            // try next limit/seed
          }
        }
      }

      // nothing worked
      setBook(null);
      setError('Could not load books from the Open Library API. Try again later.');
    } catch (e) {
      console.error('RandomBook error:', e);
      setError('Network error while fetching a random book.');
    } finally {
      setLoading(false);
    }
  }

  function toggleCollapsed() {
    setCollapsed((c) => !c);
  }

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[styles.container, animatedPos.getLayout(), { width: collapsed ? BUBBLE_SIZE : 260 }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={toggleCollapsed} style={styles.bubbleTouch}>
          {collapsed ? (
            <View style={[styles.bubble, { backgroundColor: colors.primary['500'] }]}> 
              <Text style={styles.emoji}>📚</Text>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surface.default }]}> 
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Random Book</Text>
                <TouchableOpacity onPress={() => setCollapsed(true)}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <TouchableOpacity onPress={getRandomBook} style={[styles.refreshButton, { backgroundColor: colors.surface.elevated }]}> 
                  <Text style={[styles.refreshText, { color: colors.primary['500'], fontSize: Typography.sizes.small } ]}>Refresh</Text>
                </TouchableOpacity>

                {loading && <ActivityIndicator style={{ marginTop: 8 }} color={colors.primary['500']} />}

                {error && <Text style={styles.errorText}>{error}</Text>}

                {book && !loading && (
                  <View style={styles.bookRow}>
                    {book.cover ? (
                      <Image source={{ uri: book.cover }} style={styles.cover} />
                    ) : (
                      <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: colors.surface.elevated }]}>
                        <Text style={{ fontSize: Typography.sizes.caption }}>No cover</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text numberOfLines={2} style={[styles.bookTitle, { color: colors.text, fontSize: Typography.sizes.h3 }]}>
                        {book.title}
                      </Text>
                      {book.author && <Text style={[styles.bookAuthor, { color: colors.neutral['500'], fontSize: Typography.sizes.small }]}>{book.author}</Text>}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
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
  errorText: { color: '#dc2626', marginTop: 8 },
  bookRow: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  cover: { width: 64, height: 96, borderRadius: 4, backgroundColor: '#f1f5f9' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontWeight: '700' },
  bookAuthor: { color: '#475569', marginTop: 4 },
});

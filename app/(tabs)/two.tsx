import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';


// imagen subida (usar esta ruta tal cual)
/* eslint-disable @typescript-eslint/no-require-imports */
const HERO_IMAGE = require('@/assets/images/mascot/step4.jpeg');
/* eslint-enable @typescript-eslint/no-require-imports */




const posts = [
  {
    id: 'p1',
    title: 'Time Management Tips',
    subtitle: 'Master time management and boost productivity with these simple techniques. Shared a micro-lesson',
    likes: 23,
    comments: 5,
    saves: 12,
  },
  {
    id: 'p2',
    title: 'Learning Streak',
    subtitle: "Consistency is key! Celebrating my 7-day learning streak on Skillingo. Small steps lead to big achievements. Achieved a 7-day learning streak",
    likes: 45,
    comments: 10,
    saves: 20,
  },
  {
    id: 'p3',
    title: 'Insight: Collaborative Learning',
    subtitle: 'Collaboration enhances learning. Join study groups on Skillingo to learn together and achieve more. Shared an insight',
    likes: 30,
    comments: 8,
    saves: 15,
  },
];

export default function TabThreeScreen() {
      const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'for' | 'following' | 'groups'>('for');

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#2a2a2a', '#1a1a1a']} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/Not_seen/Post' })} 
        >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            underlineColorAndroid="transparent"
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('for')}>
            <Text style={[styles.tabText, activeTab === 'for' && styles.tabTextActive]}>For you</Text>
            {activeTab === 'for' && <View style={styles.tabMarker} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('following')}>
            <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>Following</Text>
            {activeTab === 'following' && <View style={styles.tabMarker} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('groups')}>
            <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>Groups</Text>
            {activeTab === 'groups' && <View style={styles.tabMarker} />}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Feed */}
      <ScrollView style={styles.feed} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {posts.map((p) => (
          <View key={p.id} style={styles.postCard}>
            <View style={styles.postRow}>
              <Image source={HERO_IMAGE} style={styles.avatar} />
              <View style={styles.postBody}>
                <View style={styles.postHeader}>
                  <Text style={styles.postTitle}>{p.title}</Text>
                  <TouchableOpacity style={styles.starBtn} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="star-outline" size={18} color="#d1d5db" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.postSubtitle} numberOfLines={3}>{p.subtitle}</Text>
              </View>
            </View>

            {/* Post footer icons */}
            <View style={styles.postFooter}>
              <View style={styles.iconGroup}>
                <MaterialCommunityIcons name="heart-outline" size={18} color="#cbd5e1" />
                <Text style={styles.iconText}>{p.likes}</Text>
              </View>

              <View style={styles.iconGroup}>
                <MaterialCommunityIcons name="message-outline" size={18} color="#cbd5e1" />
                <Text style={styles.iconText}>{p.comments}</Text>
              </View>

              <View style={styles.iconGroup}>
                <MaterialCommunityIcons name="bookmark-outline" size={18} color="#cbd5e1" />
                <Text style={styles.iconText}>{p.saves}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // page background same as index
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },

  /* Header */
  header: {
    paddingTop: 42,
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 6,
    top: 0,
    padding: 8,
    borderRadius: 8,
  },

  /* Search */
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1113',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    color: '#e5e7eb',
    fontSize: 14,
  },

  /* Tabs */
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabText: {
    color: '#9ca3af',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabMarker: {
    height: 2,
    backgroundColor: '#00d4ff', // matches index accent
    width: '60%',
    marginTop: 8,
    borderRadius: 2,
  },

  /* Feed / posts */
  feed: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  postCard: {
    backgroundColor: '#0f1113',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#161616',
  },
  postRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#ffd966',
  },
  postBody: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  starBtn: {
    padding: 6,
    borderRadius: 8,
  },
  postSubtitle: {
    color: '#c1c5c9',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },

  postFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 12,
    paddingLeft: 4,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  iconText: {
    color: '#cbd5e1',
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
});

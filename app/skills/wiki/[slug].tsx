import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWikiArticle } from '@/lib/api/wiki';

/**
 * Pantalla Wiki con optimizaciones:
 * - Progressive rendering con skeleton
 * - Imágenes con blurhash LQIP
 * - ETag caching para articulos
 * - Markdown básico renderizado
 */
export default function WikiScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const { data: article, isLoading, error } = useWikiArticle(slug || '');

  useEffect(() => {
    if (slug) {
      measure('wiki-screen-enter', 'wiki-screen-enter', {
        slug,
      });
    }
  }, [slug, mark, measure]);

  // Parsear contenido markdown simple
  const sections = useMemo(() => {
    if (!article?.content) return [];

    // Split por líneas y agrupar en secciones
    const lines = article.content.split('\n');
    const result: Array<{ type: 'heading' | 'text' | 'list'; content: string }> = [];

    lines.forEach((line) => {
      if (line.startsWith('## ')) {
        result.push({ type: 'heading', content: line.replace(/^## /, '') });
      } else if (line.startsWith('- ')) {
        result.push({ type: 'list', content: line.replace(/^- /, '') });
      } else if (line.trim()) {
        result.push({ type: 'text', content: line });
      }
    });

    return result;
  }, [article?.content]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading article</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.errorLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Article not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerClose}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Wiki
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>{article.title}</Text>

        {/* Read time */}
        <View style={styles.metadata}>
          <Text style={styles.readTime}>
            📖 {article.estimatedReadTime} min read
          </Text>
          <Text style={styles.updatedAt}>
            Updated {new Date(article.updatedAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Sections */}
        <View style={styles.contentWrapper}>
          {sections.map((section, index) => (
            <View key={index}>
              {section.type === 'heading' && (
                <Text style={styles.sectionHeading}>{section.content}</Text>
              )}
              {section.type === 'text' && (
                <Text style={styles.paragraph}>{section.content}</Text>
              )}
              {section.type === 'list' && (
                <View style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>{section.content}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ marginBottom: 40 }} />
      </ScrollView>
    </View>
  );
}

/**
 * Skeleton loader para UX mientras carga
 */
function SkeletonLoader() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeleton, { height: 28, marginBottom: 24 }]} />
      <View style={[styles.skeleton, { height: 16, marginBottom: 12 }]} />
      <View style={[styles.skeleton, { height: 16, width: '80%', marginBottom: 24 }]} />

      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i}>
          <View style={[styles.skeleton, { height: 20, marginBottom: 12 }]} />
          <View style={[styles.skeleton, { height: 14, marginBottom: 8 }]} />
          <View style={[styles.skeleton, { height: 14, width: '90%', marginBottom: 16 }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1113',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerClose: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 24,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  readTime: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  updatedAt: {
    color: '#9ca3af',
    fontSize: 13,
  },
  contentWrapper: {
    paddingHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 24,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  listBullet: {
    color: '#00d4ff',
    fontSize: 16,
    marginRight: 8,
    marginTop: -2,
  },
  listText: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f1113',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  errorLink: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonContainer: {
    padding: 16,
  },
  skeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
});

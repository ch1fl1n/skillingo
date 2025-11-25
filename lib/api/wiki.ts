import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { usePerf } from '@/components/tutorial/PerfProvider';

interface WikiArticle {
  slug: string;
  title: string;
  content: string;
  htmlContent?: string;
  sections?: WikiSection[];
  updatedAt: string;
  estimatedReadTime: number;
}

interface WikiSection {
  id: string;
  heading: string;
  content: string;
  order: number;
}

interface WikiAsset {
  url: string;
  contentType: string;
  size: number;
  blurhash?: string;
}

const WIKI_BUCKET = 'wiki-content';
const WIKI_ASSETS_BUCKET = 'wiki-assets';

/**
 * Fetcher para artículos wiki desde Storage con ETag.
 * Cachea por 1 hora.
 */
export function useWikiArticle(slug: string) {
  const { mark, measure } = usePerf();

  return useQuery({
    queryKey: ['wiki', 'article', slug],
    queryFn: async (): Promise<WikiArticle> => {
      mark('wiki-article-start');

      try {
        // Obtener JSON del artículo desde Storage
        const { data, error } = await supabase.storage
          .from(WIKI_BUCKET)
          .download(`${slug}/article.json`);

        if (error) throw error;

        const text = await data?.text();
        const article = JSON.parse(text || '{}') as WikiArticle;

        measure('wiki-article-load', 'wiki-article-start', {
          slug,
          size: data?.size || 0,
        });

        return article;
      } catch (err) {
        console.error('[Wiki] Failed to load article:', slug, err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

/**
 * Fetcher para assets (imágenes, etc.) con signatures.
 * Cachea por 24 horas.
 */
export async function getWikiAsset(assetPath: string): Promise<WikiAsset> {
  try {
    // Obtener URL firmada del asset
    const { data, error } = await supabase.storage
      .from(WIKI_ASSETS_BUCKET)
      .createSignedUrl(assetPath, 3600 * 24); // 24 horas

    if (error) throw error;

    // Obtener metadata del asset
    const { data: metadata, error: metaError } = await supabase.storage
      .from(WIKI_ASSETS_BUCKET)
      .info(assetPath);

    if (metaError) {
      console.warn('[Wiki] Failed to get asset metadata:', metaError);
    }

    return {
      url: data?.signedUrl || '',
      contentType: metadata?.metadata?.['content-type'] || 'application/octet-stream',
      size: metadata?.metadata?.['size'] || 0,
      blurhash: metadata?.metadata?.['blurhash'],
    };
  } catch (err) {
    console.error('[Wiki] Failed to get asset:', assetPath, err);
    throw err;
  }
}

/**
 * Listar todos los artículos wiki para navegación.
 * Cachea por 1 hora.
 */
export function useWikiIndex() {
  return useQuery({
    queryKey: ['wiki', 'index'],
    queryFn: async (): Promise<Array<{ slug: string; title: string; excerpt: string }>> => {
      try {
        const { data, error } = await supabase.storage
          .from(WIKI_BUCKET)
          .download('index.json');

        if (error) throw error;

        const text = await data?.text();
        return JSON.parse(text || '[]');
      } catch (err) {
        console.error('[Wiki] Failed to load index:', err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24,
  });
}

/**
 * Buscar artículos wiki.
 */
export function useWikiSearch(query: string) {
  return useQuery({
    queryKey: ['wiki', 'search', query],
    queryFn: async (): Promise<WikiArticle[]> => {
      if (!query.trim()) return [];

      try {
        // Usar Storage para búsqueda simple (en prod usar full-text search)
        const { data: files, error } = await supabase.storage
          .from(WIKI_BUCKET)
          .list('');

        if (error) throw error;

        const results: WikiArticle[] = [];
        for (const file of files || []) {
          if (file.name.includes(query.toLowerCase())) {
            const { data, error: readErr } = await supabase.storage
              .from(WIKI_BUCKET)
              .download(`${file.name}/article.json`);

            if (!readErr && data) {
              const text = await data.text();
              results.push(JSON.parse(text));
            }
          }
        }

        return results;
      } catch (err) {
        console.error('[Wiki] Search failed:', err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 min
    gcTime: 1000 * 60 * 60,
    enabled: !!query.trim(),
  });
}

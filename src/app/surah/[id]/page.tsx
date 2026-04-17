'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { use } from 'react';

export default function SurahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const surahNum = parseInt(id);
  const [surah, setSurah] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirData, setTafsirData] = useState<string | null>(null);
  const [hadithData, setHadithData] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    async function loadSurah() {
      try {
        const res = await fetch('https://cdn.jsdelivr.net/npm/quran-cloud@1.0.0/dist/quran.json');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (cancelled) return;
        const targetSurah = data.find((s: any) => s.id === surahNum);
        if (targetSurah) {
          setSurah(targetSurah);
        } else {
          setError('Surah not found');
        }
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError('Failed to load surah');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    loadSurah();
    return () => { cancelled = true; };
  }, [surahNum]);

  async function fetchTafsir(ayahNum: number) {
    setTafsirLoading(true);
    setSelectedAyah(ayahNum);
    setTafsirData(null);
    setHadithData(null);

    try {
      const res = await fetch(
        `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/en-al-jalalayn/${surahNum}.json`
      );
      const data = await res.json();
      const ayahData = data.data?.find((a: { ayah: number }) => a.ayah === ayahNum);
      if (ayahData?.tafsir?.text) {
        setTafsirData(ayahData.tafsir.text);
      } else {
        setTafsirData('No tafsir available for this verse.');
      }
    } catch (err) {
      console.error('Tafsir error:', err);
      setTafsirData('Failed to load tafsir.');
    } finally {
      setTafsirLoading(false);
    }
  }

  async function fetchHadith(ayahNum: number) {
    setTafsirLoading(true);
    setSelectedAyah(ayahNum);
    setTafsirData(null);
    setHadithData(null);

    try {
      const res = await fetch('https://cdn.jsdelivr.net/gh/NeaByteLab/Quran-Data/main/public/hadith/all.json');
      const data = await res.json();
      const related = data?.data?.filter((h: any) => 
        h.verses?.some((v: any) => `${surahNum}:${ayahNum}`.includes(v))
      );
      
      if (related && related.length > 0) {
        setHadithData(related.slice(0, 3).map((h: any) => 
          `${h.source}: ${h.text?.substring(0, 200)}...`
        ).join('\n\n'));
      } else {
        setHadithData('No related hadith found for this verse. Try searching in hadith collections.');
      }
    } catch (err) {
      console.error('Hadith error:', err);
      setHadithData('No related hadith found for this verse.');
    } finally {
      setTafsirLoading(false);
    }
  }

  async function AskAI(ayahNum: number) {
    setTafsirLoading(true);
    setSelectedAyah(ayahNum);
    setTafsirData(null);
    setHadithData(null);
    setTafsirData('Ask your AI assistant: "Explain the tafsir and provide relevant hadith for Quran ' + surahNum + ':' + ayahNum + '"');
    setTafsirLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-emerald-700 text-xl">Loading Quran...</div>
      </div>
    );
  }

  if (error || !surah) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-red-600 mb-4">{error || 'Surah not found'}</div>
        <Link href="/" className="text-emerald-700">← Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-700 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white text-xl">←</Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{surah.transliteration}</h1>
            <p className="text-emerald-100 text-sm">{surah.translation} • {surah.total_verses} verses • {surah.type}</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-3xl mx-auto">
        {surah.verses?.map((ayat: any) => (
          <div key={ayat.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-sm font-medium">
                ۝{ayat.id}
              </span>
            </div>
            
            <p className="font-arabic text-2xl text-right mb-4 leading-loose" dir="rtl">
              {ayat.text}
            </p>
            
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => fetchTafsir(ayat.id)}
                disabled={tafsirLoading && selectedAyah === ayat.id}
                className="flex-1 bg-emerald-600 text-white py-2 px-3 rounded hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-1"
              >
                📖 Tafsir
              </button>
              <button
                onClick={() => fetchHadith(ayat.id)}
                disabled={tafsirLoading && selectedAyah === ayat.id}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-1"
              >
                📿 Hadith
              </button>
              <button
                onClick={() => AskAI(ayat.id)}
                disabled={tafsirLoading}
                className="flex-1 bg-purple-600 text-white py-2 px-3 rounded hover:bg-purple-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-1"
              >
                🤖 AI Explain
              </button>
            </div>

            {tafsirLoading && selectedAyah === ayat.id && (
              <div className="mt-3 p-3 bg-gray-100 rounded text-center">
                <span className="text-gray-600">Loading...</span>
              </div>
            )}

            {(tafsirData && selectedAyah === ayat.id) && (
              <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                <h4 className="font-bold text-yellow-800 mb-2">📖 Tafsir / Explanation</h4>
                <p className="text-gray-700 text-sm whitespace-pre-line">
                  {tafsirData}
                </p>
              </div>
            )}

            {(hadithData && selectedAyah === ayat.id) && (
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">📿 Related Hadith</h4>
                <p className="text-gray-700 text-sm whitespace-pre-line">
                  {hadithData}
                </p>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
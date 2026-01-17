'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Music2, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Heart,
  Volume2,
  VolumeX,
  Search,
  ArrowLeft,
  Repeat,
  Shuffle,
  ListMusic,
  Clock,
  Headphones,
  Sparkles,
  Radio,
  Disc3,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

interface Track {
  id: string
  title: string
  artist: string
  duration: number
  category: string
  deity: string
  audio_url: string
  image_url: string
  play_count: number
  featured: boolean
}

const categories = [
  { id: 'all', name: 'All', icon: '🎵', color: 'from-violet-500 to-purple-500' },
  { id: 'bhajan', name: 'Bhajan', icon: '🙏', color: 'from-amber-500 to-orange-500' },
  { id: 'aarti', name: 'Aarti', icon: '🪔', color: 'from-orange-500 to-red-500' },
  { id: 'mantra', name: 'Mantra', icon: '🕉️', color: 'from-blue-500 to-cyan-500' },
  { id: 'kirtan', name: 'Kirtan', icon: '🎤', color: 'from-pink-500 to-rose-500' },
  { id: 'meditation', name: 'Meditation', icon: '🧘', color: 'from-teal-500 to-emerald-500' },
  { id: 'chalisa', name: 'Chalisa', icon: '📿', color: 'from-purple-500 to-indigo-500' },
]

const deities = [
  { id: 'all', name: 'All', emoji: '🕉️', color: 'from-purple-500 to-pink-500' },
  { id: 'shiva', name: 'Shiva', emoji: '🔱', color: 'from-blue-500 to-cyan-500' },
  { id: 'krishna', name: 'Krishna', emoji: '🦚', color: 'from-indigo-500 to-purple-500' },
  { id: 'hanuman', name: 'Hanuman', emoji: '🙏', color: 'from-orange-500 to-red-500' },
  { id: 'lakshmi', name: 'Lakshmi', emoji: '🪷', color: 'from-yellow-500 to-amber-500' },
  { id: 'ganesh', name: 'Ganesh', emoji: '🐘', color: 'from-red-500 to-pink-500' },
  { id: 'durga', name: 'Durga', emoji: '🦁', color: 'from-rose-500 to-red-500' },
]

const demoTracks: Track[] = [
  { id: '1', title: 'Om Jai Jagdish Hare', artist: 'Traditional', duration: 285, category: 'aarti', deity: 'vishnu', audio_url: '', image_url: '', play_count: 15420, featured: true },
  { id: '2', title: 'Hanuman Chalisa', artist: 'Hariharan', duration: 540, category: 'chalisa', deity: 'hanuman', audio_url: '', image_url: '', play_count: 125000, featured: true },
  { id: '3', title: 'Om Namah Shivaya', artist: 'Anuradha Paudwal', duration: 320, category: 'mantra', deity: 'shiva', audio_url: '', image_url: '', play_count: 89500, featured: true },
  { id: '4', title: 'Shri Krishna Govind Hare', artist: 'Jagjit Singh', duration: 410, category: 'bhajan', deity: 'krishna', audio_url: '', image_url: '', play_count: 67300, featured: false },
  { id: '5', title: 'Ganesh Aarti', artist: 'Shankar Mahadevan', duration: 295, category: 'aarti', deity: 'ganesh', audio_url: '', image_url: '', play_count: 54200, featured: true },
  { id: '6', title: 'Durga Chalisa', artist: 'Anuradha Paudwal', duration: 480, category: 'chalisa', deity: 'durga', audio_url: '', image_url: '', play_count: 43100, featured: false },
  { id: '7', title: 'Lakshmi Aarti', artist: 'Lata Mangeshkar', duration: 310, category: 'aarti', deity: 'lakshmi', audio_url: '', image_url: '', play_count: 71800, featured: true },
  { id: '8', title: 'Gayatri Mantra (108 times)', artist: 'Suresh Wadkar', duration: 1800, category: 'mantra', deity: 'all', audio_url: '', image_url: '', play_count: 156000, featured: true },
  { id: '9', title: 'Peaceful Meditation', artist: 'Temple Sounds', duration: 600, category: 'meditation', deity: 'all', audio_url: '', image_url: '', play_count: 28400, featured: false },
  { id: '10', title: 'Hare Krishna Mahamantra', artist: 'ISKCON', duration: 480, category: 'kirtan', deity: 'krishna', audio_url: '', image_url: '', play_count: 92300, featured: true },
  { id: '11', title: 'Shiv Tandav Stotram', artist: 'Shankar Mahadevan', duration: 390, category: 'mantra', deity: 'shiva', audio_url: '', image_url: '', play_count: 145000, featured: true },
  { id: '12', title: 'Jai Ambe Gauri', artist: 'Narendra Chanchal', duration: 350, category: 'aarti', deity: 'durga', audio_url: '', image_url: '', play_count: 68900, featured: false },
]

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatPlayCount = (count: number) => {
  if (count >= 100000) return `${(count / 1000).toFixed(0)}K`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

const getDeityGradient = (deity: string) => {
  const d = deities.find(d => d.id === deity)
  return d?.color || 'from-purple-500 to-pink-500'
}

const getDeityEmoji = (deity: string) => {
  switch (deity) {
    case 'shiva': return '🔱'
    case 'krishna': return '🦚'
    case 'hanuman': return '🙏'
    case 'lakshmi': return '🪷'
    case 'ganesh': return '🐘'
    case 'durga': return '🦁'
    case 'vishnu': return '🔵'
    default: return '🕉️'
  }
}

const getCategoryEmoji = (category: string) => {
  const cat = categories.find(c => c.id === category)
  return cat?.icon || '🎵'
}

export default function MusicPage() {
  const { t } = useLanguage()
  const [tracks] = useState<Track[]>(demoTracks)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDeity, setSelectedDeity] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  
  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [showFullPlayer, setShowFullPlayer] = useState(false)

  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  const filteredTracks = tracks.filter(track => {
    if (showFavorites && !favorites.includes(track.id)) return false
    if (selectedCategory !== 'all' && track.category !== selectedCategory) return false
    if (selectedDeity !== 'all' && track.deity !== selectedDeity) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return track.title.toLowerCase().includes(query) || track.artist.toLowerCase().includes(query)
    }
    return true
  })

  const featuredTracks = tracks.filter(t => t.featured).slice(0, 6)

  const toggleFavorite = (trackId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setFavorites(prev => prev.includes(trackId) ? prev.filter(id => id !== trackId) : [...prev, trackId])
  }

  const playTrack = (track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)

    if (progressInterval.current) clearInterval(progressInterval.current)
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (isRepeat) return 0
          clearInterval(progressInterval.current!)
          playNext()
          return 0
        }
        return prev + (100 / track.duration)
      })
    }, 1000)
  }

  const togglePlay = () => {
    if (!currentTrack) return
    setIsPlaying(!isPlaying)
    
    if (isPlaying) {
      if (progressInterval.current) clearInterval(progressInterval.current)
    } else {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (isRepeat) return 0
            clearInterval(progressInterval.current!)
            playNext()
            return 0
          }
          return prev + (100 / currentTrack.duration)
        })
      }, 1000)
    }
  }

  const playNext = () => {
    if (!currentTrack) return
    const currentIndex = filteredTracks.findIndex(t => t.id === currentTrack.id)
    let nextIndex: number
    
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * filteredTracks.length)
    } else {
      nextIndex = (currentIndex + 1) % filteredTracks.length
    }
    
    if (filteredTracks[nextIndex]) playTrack(filteredTracks[nextIndex])
  }

  const playPrev = () => {
    if (!currentTrack) return
    const currentIndex = filteredTracks.findIndex(t => t.id === currentTrack.id)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredTracks.length - 1
    if (filteredTracks[prevIndex]) playTrack(filteredTracks[prevIndex])
  }

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [])

  const currentTime = currentTrack ? Math.floor((progress / 100) * currentTrack.duration) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-slate-950 text-white pb-36">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-violet-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/pilgrim">
                <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Music2 className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="font-bold text-xl">{t('music.title')}</h1>
                  <p className="text-xs text-purple-300 flex items-center gap-1">
                    <Radio className="w-3 h-3" /> {t('music.tagline')}
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFavorites(!showFavorites)}
              className={cn(
                "rounded-full gap-2 text-white",
                showFavorites ? "bg-pink-500/20 text-pink-300" : "hover:bg-white/10"
              )}
            >
              <Heart className={cn("w-4 h-4", showFavorites && "fill-current")} />
              <span className="hidden sm:inline">{t('music.favorites')}</span>
              <Badge variant="secondary" className="bg-white/10 text-white text-xs">{favorites.length}</Badge>
            </Button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <Input
              placeholder={t('music.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-purple-400 focus-visible:ring-purple-500"
            />
          </div>

          {/* Categories */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {categories.map((cat, index) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                  selectedCategory === cat.id
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                    : "bg-white/5 text-purple-200 hover:bg-white/10"
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8 relative">
        {/* Deity Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {deities.map(deity => (
            <button
              key={deity.id}
              onClick={() => setSelectedDeity(deity.id)}
              className={cn(
                "shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all",
                selectedDeity === deity.id
                  ? `bg-gradient-to-r ${deity.color} text-white shadow-lg`
                  : "bg-white/5 text-purple-200 hover:bg-white/10"
              )}
            >
              <span className="text-lg">{deity.emoji}</span>
              <span>{deity.name}</span>
            </button>
          ))}
        </div>

        {/* Featured Section */}
        {!showFavorites && selectedCategory === 'all' && selectedDeity === 'all' && !searchQuery && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {t('music.featured')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {featuredTracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => playTrack(track)}
                  className="cursor-pointer group"
                >
                  <div className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br shadow-xl",
                    getDeityGradient(track.deity)
                  )}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-8xl opacity-20">{getDeityEmoji(track.deity)}</span>
                    </div>
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1, opacity: 1 }}
                        className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-6 h-6 text-purple-600" />
                        ) : (
                          <Play className="w-6 h-6 text-purple-600 ml-1" />
                        )}
                      </motion.div>
                    </div>

                    {/* Playing Indicator */}
                    {currentTrack?.id === track.id && isPlaying && (
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        {[1,2,3,4].map(i => (
                          <motion.div
                            key={i}
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1 h-4 bg-white rounded-full"
                          />
                        ))}
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      className="absolute top-3 right-3 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                      onClick={(e) => toggleFavorite(track.id, e)}
                    >
                      <Heart className={cn("w-4 h-4", favorites.includes(track.id) ? "fill-pink-500 text-pink-500" : "text-white")} />
                    </button>

                    {/* Category Badge */}
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-black/30 backdrop-blur-sm border-0 text-white text-xs">
                        {getCategoryEmoji(track.category)} {track.category}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="font-semibold mt-3 text-sm line-clamp-1">{track.title}</h3>
                  <p className="text-xs text-purple-400">{track.artist}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* All Tracks */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ListMusic className="w-5 h-5" />
            {showFavorites ? t('music.yourFavorites') : t('music.allTracks')}
            <Badge variant="secondary" className="bg-white/10 text-white ml-2">{filteredTracks.length}</Badge>
          </h2>

          <div className="space-y-2">
            {filteredTracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id
              
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => playTrack(track)}
                  className={cn(
                    "group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all",
                    isCurrentTrack 
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                      : "hover:bg-white/5"
                  )}
                >
                  {/* Track Number / Playing Indicator */}
                  <div className="w-8 text-center shrink-0">
                    {isCurrentTrack && isPlaying ? (
                      <div className="flex gap-0.5 justify-center">
                        {[1,2,3].map(i => (
                          <motion.div
                            key={i}
                            animate={{ scaleY: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1 h-4 bg-purple-400 rounded-full"
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-purple-500 group-hover:hidden">{index + 1}</span>
                    )}
                    <Play className="w-4 h-4 hidden group-hover:block mx-auto text-white" />
                  </div>

                  {/* Album Art */}
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br shadow-lg",
                    getDeityGradient(track.deity)
                  )}>
                    {getDeityEmoji(track.deity)}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("font-medium text-sm line-clamp-1", isCurrentTrack && "text-purple-300")}>{track.title}</h3>
                    <p className="text-xs text-purple-400 line-clamp-1">{track.artist}</p>
                  </div>

                  {/* Category */}
                  <Badge variant="secondary" className="bg-white/5 text-purple-300 text-xs hidden sm:flex">
                    {getCategoryEmoji(track.category)} {track.category}
                  </Badge>

                  {/* Play Count */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-purple-400 min-w-[60px]">
                    <Headphones className="w-3 h-3" />
                    {formatPlayCount(track.play_count)}
                  </div>

                  {/* Duration */}
                  <span className="text-xs text-purple-400 min-w-[40px] text-right">{formatDuration(track.duration)}</span>

                  {/* Favorite */}
                  <button
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    onClick={(e) => toggleFavorite(track.id, e)}
                  >
                    <Heart className={cn("w-4 h-4", favorites.includes(track.id) ? "fill-pink-500 text-pink-500" : "text-purple-400")} />
                  </button>
                </motion.div>
              )
            })}

            {filteredTracks.length === 0 && (
              <div className="text-center py-16">
                <Music2 className="w-16 h-16 mx-auto text-purple-800 mb-4" />
                <h3 className="font-medium text-lg mb-2">{t('music.noTracks')}</h3>
                <p className="text-purple-400 text-sm">{t('music.adjustFilters')}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Mini Player */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            {/* Progress Bar */}
            <div className="h-1 bg-white/10">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div 
              className="bg-gradient-to-r from-violet-950/95 to-purple-950/95 backdrop-blur-xl border-t border-white/5 cursor-pointer"
              onClick={() => setShowFullPlayer(true)}
            >
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-4">
                  {/* Album Art */}
                  <motion.div 
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-xl bg-gradient-to-br shrink-0",
                      getDeityGradient(currentTrack.deity)
                    )}
                    animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    {getDeityEmoji(currentTrack.deity)}
                  </motion.div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-1">{currentTrack.title}</h4>
                    <p className="text-xs text-purple-400">{currentTrack.artist}</p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-9 w-9 rounded-full text-white hover:bg-white/10", isShuffle && "text-purple-400")}
                      onClick={(e) => { e.stopPropagation(); setIsShuffle(!isShuffle) }}
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-white hover:bg-white/10"
                      onClick={(e) => { e.stopPropagation(); playPrev() }}
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button 
                      size="icon" 
                      className="h-12 w-12 rounded-full bg-white text-purple-600 hover:bg-purple-100 shadow-xl shadow-purple-500/20"
                      onClick={(e) => { e.stopPropagation(); togglePlay() }}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-white hover:bg-white/10"
                      onClick={(e) => { e.stopPropagation(); playNext() }}
                    >
                      <SkipForward className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-9 w-9 rounded-full text-white hover:bg-white/10", isRepeat && "text-purple-400")}
                      onClick={(e) => { e.stopPropagation(); setIsRepeat(!isRepeat) }}
                    >
                      <Repeat className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Volume (Desktop) */}
                  <div className="hidden md:flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-white hover:bg-white/10"
                      onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted) }}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={100}
                      step={1}
                      onValueChange={([v]) => { setVolume(v); setIsMuted(false) }}
                      className="w-24"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Favorite */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-white/10"
                    onClick={(e) => toggleFavorite(currentTrack.id, e)}
                  >
                    <Heart className={cn("w-5 h-5", favorites.includes(currentTrack.id) ? "fill-pink-500 text-pink-500" : "text-white")} />
                  </Button>
                </div>

                {/* Time Display */}
                <div className="flex items-center justify-between text-xs text-purple-400 mt-2">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(currentTrack.duration)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Player */}
      <AnimatePresence>
        {showFullPlayer && currentTrack && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[60] bg-gradient-to-br from-violet-950 via-purple-950 to-slate-950 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="icon" className="rounded-full text-white" onClick={() => setShowFullPlayer(false)}>
                <ChevronDown className="w-6 h-6" />
              </Button>
              <span className="text-sm text-purple-300">{t('music.nowPlaying')}</span>
              <Button variant="ghost" size="icon" className="rounded-full text-white">
                <MoreHorizontal className="w-6 h-6" />
              </Button>
            </div>

            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center p-8">
              <motion.div 
                className={cn(
                  "w-72 h-72 sm:w-80 sm:h-80 rounded-3xl flex items-center justify-center text-[120px] shadow-2xl bg-gradient-to-br",
                  getDeityGradient(currentTrack.deity)
                )}
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                {getDeityEmoji(currentTrack.deity)}
              </motion.div>
            </div>

            {/* Track Info */}
            <div className="px-8 text-center">
              <h2 className="text-2xl font-bold mb-1">{currentTrack.title}</h2>
              <p className="text-purple-400">{currentTrack.artist}</p>
            </div>

            {/* Progress */}
            <div className="px-8 mt-8">
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-purple-400 mt-2">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 py-8">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-12 w-12 rounded-full text-white", isShuffle && "text-purple-400")}
                onClick={() => setIsShuffle(!isShuffle)}
              >
                <Shuffle className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 rounded-full text-white"
                onClick={playPrev}
              >
                <SkipBack className="w-7 h-7" />
              </Button>
              <Button 
                size="icon" 
                className="h-20 w-20 rounded-full bg-white text-purple-600 hover:bg-purple-100 shadow-2xl"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 rounded-full text-white"
                onClick={playNext}
              >
                <SkipForward className="w-7 h-7" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-12 w-12 rounded-full text-white", isRepeat && "text-purple-400")}
                onClick={() => setIsRepeat(!isRepeat)}
              >
                <Repeat className="w-5 h-5" />
              </Button>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-center gap-8 pb-8">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => toggleFavorite(currentTrack.id)}
              >
                <Heart className={cn("w-6 h-6", favorites.includes(currentTrack.id) ? "fill-pink-500 text-pink-500" : "text-white")} />
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-white"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => { setVolume(v); setIsMuted(false) }}
                  className="w-32"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

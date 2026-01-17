'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flower2, 
  ShoppingCart, 
  MapPin, 
  Clock, 
  Star, 
  Search,
  ArrowLeft,
  Plus,
  Minus,
  X,
  Truck,
  CheckCircle,
  Loader2,
  Sparkles,
  Gift,
  Package,
  Timer,
  BadgePercent,
  ChevronRight,
  Bike
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  image_url: string
  is_available: boolean
  popular: boolean
}

interface Vendor {
  id: string
  name: string
  shop_name: string
  location: string
  category: string
  rating: number
  total_orders: number
  avg_delivery_time: number
  image_url: string
  products: Product[]
  isOpen: boolean
}

interface CartItem {
  product: Product
  vendor: Vendor
  quantity: number
}

const categories = [
  { id: 'all', name: 'All', icon: '🛕', color: 'from-amber-500 to-orange-500' },
  { id: 'flowers', name: 'Flowers', icon: '🌸', color: 'from-pink-500 to-rose-500' },
  { id: 'garlands', name: 'Garlands', icon: '💐', color: 'from-fuchsia-500 to-pink-500' },
  { id: 'prasad', name: 'Prasad', icon: '🍚', color: 'from-yellow-500 to-amber-500' },
  { id: 'puja-items', name: 'Puja Items', icon: '🪔', color: 'from-orange-500 to-red-500' },
  { id: 'coconuts', name: 'Coconuts', icon: '🥥', color: 'from-green-500 to-emerald-500' },
  { id: 'sweets', name: 'Sweets', icon: '🍬', color: 'from-purple-500 to-pink-500' },
]

const demoVendors: Vendor[] = [
  {
    id: '1',
    name: 'Ramesh Kumar',
    shop_name: 'Shree Flowers',
    location: 'Near Gate A',
    category: 'flowers',
    rating: 4.8,
    total_orders: 1250,
    avg_delivery_time: 10,
    image_url: '',
    isOpen: true,
    products: [
      { id: 'p1', name: 'Rose Petals (500g)', description: 'Fresh red rose petals for puja', price: 150, originalPrice: 180, category: 'flowers', image_url: '', is_available: true, popular: true },
      { id: 'p2', name: 'Marigold Garland', description: 'Traditional orange marigold mala', price: 80, category: 'garlands', image_url: '', is_available: true, popular: true },
      { id: 'p3', name: 'Lotus Flowers (5 pcs)', description: 'Fresh pink lotus for offering', price: 200, category: 'flowers', image_url: '', is_available: true, popular: false },
      { id: 'p4', name: 'Jasmine String', description: 'Fragrant mogra string', price: 60, category: 'flowers', image_url: '', is_available: true, popular: true },
    ]
  },
  {
    id: '2',
    name: 'Lakshmi Devi',
    shop_name: 'Maa Prasad Bhandar',
    location: 'Temple Street',
    category: 'prasad',
    rating: 4.9,
    total_orders: 2100,
    avg_delivery_time: 15,
    image_url: '',
    isOpen: true,
    products: [
      { id: 'p5', name: 'Ladoo Prasad (6 pcs)', description: 'Pure desi ghee ladoos', price: 120, category: 'prasad', image_url: '', is_available: true, popular: true },
      { id: 'p6', name: 'Panchamrit', description: 'Sacred five-nectar mixture', price: 50, category: 'prasad', image_url: '', is_available: true, popular: false },
      { id: 'p7', name: 'Churma Prasad', description: 'Traditional wheat prasad', price: 80, originalPrice: 100, category: 'prasad', image_url: '', is_available: true, popular: true },
    ]
  },
  {
    id: '3',
    name: 'Suresh Sharma',
    shop_name: 'Om Puja Samagri',
    location: 'Near Gate B',
    category: 'puja-items',
    rating: 4.7,
    total_orders: 890,
    avg_delivery_time: 12,
    image_url: '',
    isOpen: true,
    products: [
      { id: 'p8', name: 'Complete Puja Kit', description: 'All items for darshan puja', price: 350, originalPrice: 450, category: 'puja-items', image_url: '', is_available: true, popular: true },
      { id: 'p9', name: 'Coconut (Nariyal)', description: 'Fresh coconut for offering', price: 40, category: 'coconuts', image_url: '', is_available: true, popular: true },
      { id: 'p10', name: 'Camphor & Incense Set', description: 'Pure camphor and agarbatti', price: 60, category: 'puja-items', image_url: '', is_available: true, popular: false },
      { id: 'p11', name: 'Chunri/Dupatta', description: 'Red chunri for offering', price: 150, category: 'puja-items', image_url: '', is_available: true, popular: false },
    ]
  },
  {
    id: '4',
    name: 'Geeta Ben',
    shop_name: 'Divine Sweets',
    location: 'Market Road',
    category: 'sweets',
    rating: 4.6,
    total_orders: 650,
    avg_delivery_time: 20,
    image_url: '',
    isOpen: true,
    products: [
      { id: 'p12', name: 'Peda Box (250g)', description: 'Traditional milk pedas', price: 180, category: 'sweets', image_url: '', is_available: true, popular: true },
      { id: 'p13', name: 'Mohanthal', description: 'Gram flour sweet', price: 200, category: 'sweets', image_url: '', is_available: true, popular: false },
      { id: 'p14', name: 'Dry Fruit Ladoo', description: 'Premium dry fruit ladoos', price: 300, originalPrice: 350, category: 'sweets', image_url: '', is_available: true, popular: true },
    ]
  },
]

const productEmojis: Record<string, string> = {
  'flowers': '🌹',
  'garlands': '💐',
  'prasad': '🍚',
  'coconuts': '🥥',
  'sweets': '🍬',
  'puja-items': '🪔',
}

export default function MarketplacePage() {
  const { user } = useAuth()
  const [vendors] = useState<Vendor[]>(demoVendors)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [pilgrimLocation, setPilgrimLocation] = useState('')
  const [pilgrimPhone, setPilgrimPhone] = useState('')
  const [addedProductId, setAddedProductId] = useState<string | null>(null)

  const filteredVendors = vendors.filter(vendor => {
    if (selectedCategory !== 'all' && vendor.category !== selectedCategory) {
      const hasMatchingProduct = vendor.products.some(p => p.category === selectedCategory)
      if (!hasMatchingProduct) return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        vendor.shop_name.toLowerCase().includes(query) ||
        vendor.products.some(p => p.name.toLowerCase().includes(query))
      )
    }
    return true
  })

  const addToCart = (product: Product, vendor: Vendor) => {
    setAddedProductId(product.id)
    setTimeout(() => setAddedProductId(null), 600)
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, vendor, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    })
  }

  const getCartItemQuantity = (productId: string) => {
    return cart.find(item => item.product.id === productId)?.quantity || 0
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const placeOrder = async () => {
    if (!pilgrimLocation || !pilgrimPhone) return
    setIsOrdering(true)

    try {
      // Group cart items by vendor
      const byVendor: Record<string, CartItem[]> = {}
      cart.forEach(item => {
        const vid = item.vendor.id
        if (!byVendor[vid]) byVendor[vid] = []
        byVendor[vid].push(item)
      })

      const createdOrders: string[] = []

      for (const vendorId of Object.keys(byVendor)) {
        const items = byVendor[vendorId].map(i => ({ product_id: i.product.id, name: i.product.name, quantity: i.quantity, price: i.product.price }))
        const totalAmount = items.reduce((s, it) => s + it.price * it.quantity, 0)

        const res = await fetch('/api/vendors/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId,
            pilgrimName: user?.full_name || 'Guest',
            pilgrimPhone,
            pilgrimLocation,
            bookingId: null,
            items,
            totalAmount,
            deliveryNotes: ''
          })
        })

        const data = await res.json()
        if (res.ok && data?.order) {
          createdOrders.push(data.order.order_id || data.order.orderId || '')
        }
      }

      // Persist pilgrim phone so dashboard can fetch orders
      try { localStorage.setItem('pilgrim_phone', pilgrimPhone) } catch (e) { }

      setOrderSuccess(true)
      setCart([])

      // Optionally show the placed order ids in console
      console.info('Created orders:', createdOrders)

      setTimeout(() => {
        setOrderSuccess(false)
        setShowCheckout(false)
        setShowCart(false)
      }, 3000)
    } catch (err) {
      console.error('Place order failed', err)
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-rose-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/pilgrim">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-100 dark:hover:bg-pink-900/30">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Flower2 className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    Seva Marketplace
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Bike className="w-3 h-3" /> Delivery to your queue position
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search flowers, prasad, puja items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-2xl bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg shadow-black/5 focus-visible:ring-pink-500"
            />
          </div>

          {/* Categories */}
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {categories.map((cat, index) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all min-w-[72px]",
                  selectedCategory === cat.id
                    ? `bg-gradient-to-br ${cat.color} text-white shadow-lg scale-105`
                    : "bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 hover:scale-102"
                )}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium whitespace-nowrap">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6 relative pb-32">
        {/* Promo Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white border-0 overflow-hidden relative shadow-xl shadow-pink-500/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
            <CardContent className="p-5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Truck className="w-7 h-7" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg">Queue Delivery Service</h3>
                    <p className="text-sm opacity-90">Order now & we'll find you in line!</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                  <Timer className="w-4 h-4" />
                  <span className="font-bold">~15 min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Package, label: 'Items', value: '50+', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30' },
            { icon: Star, label: 'Rating', value: '4.8★', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { icon: Bike, label: 'Delivery', value: 'FREE', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className={cn("rounded-2xl p-4 text-center backdrop-blur", stat.bg)}
            >
              <stat.icon className={cn("w-6 h-6 mx-auto mb-1", stat.color)} />
              <p className="font-bold text-lg">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Vendors */}
        <div className="space-y-5">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Available Shops
            <Badge variant="secondary" className="ml-2">{filteredVendors.length}</Badge>
          </h2>

          {filteredVendors.map((vendor, vendorIndex) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: vendorIndex * 0.1 }}
            >
              <Card className="overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur border-0 shadow-xl shadow-black/5">
                {/* Vendor Header */}
                <CardHeader className="pb-3 bg-gradient-to-r from-pink-50/80 to-rose-50/80 dark:from-gray-800/50 dark:to-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800"
                        whileHover={{ scale: 1.05 }}
                      >
                        {productEmojis[vendor.category] || '🛕'}
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{vendor.shop_name}</CardTitle>
                          {vendor.isOpen && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Open
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {vendor.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {vendor.avg_delivery_time} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-bold">{vendor.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{vendor.total_orders}+ orders</p>
                    </div>
                  </div>
                </CardHeader>

                {/* Products Grid */}
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {vendor.products.filter(p => p.is_available).map((product, productIndex) => {
                      const quantity = getCartItemQuantity(product.id)
                      const isAdded = addedProductId === product.id
                      
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: isAdded ? 1.02 : 1 }}
                          transition={{ delay: productIndex * 0.05 }}
                          whileHover={{ y: -3 }}
                          className={cn(
                            "relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 transition-all",
                            isAdded && "ring-2 ring-green-500 ring-offset-2"
                          )}
                        >
                          {/* Badges */}
                          <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                            {product.popular && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs border-0 shadow-lg">
                                <Sparkles className="w-3 h-3 mr-0.5" />
                                Hot
                              </Badge>
                            )}
                            {product.originalPrice && (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-xs border-0 shadow-lg">
                                <BadgePercent className="w-3 h-3 mr-0.5" />
                                {Math.round((1 - product.price / product.originalPrice) * 100)}%
                              </Badge>
                            )}
                          </div>

                          {/* Product Image */}
                          <motion.div 
                            className="w-full h-20 bg-gradient-to-br from-pink-100 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl flex items-center justify-center text-4xl mb-3"
                            animate={isAdded ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            {productEmojis[product.category] || '🌸'}
                          </motion.div>

                          {/* Product Info */}
                          <h4 className="font-semibold text-sm line-clamp-1">{product.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{product.description}</p>

                          {/* Price & Cart Controls */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-pink-600 dark:text-pink-400">₹{product.price}</span>
                              {product.originalPrice && (
                                <span className="text-xs text-muted-foreground line-through ml-1">₹{product.originalPrice}</span>
                              )}
                            </div>
                            
                            {quantity > 0 ? (
                              <div className="flex items-center gap-1 bg-pink-100 dark:bg-pink-900/30 rounded-full p-0.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 rounded-full hover:bg-pink-200 dark:hover:bg-pink-800"
                                  onClick={() => updateQuantity(product.id, -1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <motion.span 
                                  key={quantity}
                                  initial={{ scale: 1.3 }}
                                  animate={{ scale: 1 }}
                                  className="w-5 text-center font-bold text-sm"
                                >
                                  {quantity}
                                </motion.span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 rounded-full hover:bg-pink-200 dark:hover:bg-pink-800"
                                  onClick={() => addToCart(product, vendor)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="h-8 px-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/25"
                                onClick={() => addToCart(product, vendor)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && !showCart && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-50"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:via-rose-600 hover:to-pink-600 shadow-2xl shadow-pink-500/40 text-white font-medium flex items-center justify-between px-5"
              onClick={() => setShowCart(true)}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <ShoppingCart className="w-5 h-5" />
                </motion.div>
                <span className="font-bold text-lg">{cartCount} items</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl">₹{cartTotal}</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col"
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-800 shrink-0">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-pink-500" />
                  Your Cart
                </h2>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowCart(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Gift className="w-20 h-20 mx-auto text-pink-200 mb-4" />
                    </motion.div>
                    <h3 className="font-bold text-lg mb-2">Your cart is empty</h3>
                    <p className="text-muted-foreground text-sm">Add items to offer at the temple</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <motion.div 
                      key={item.product.id} 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-xl flex items-center justify-center text-2xl shrink-0">
                        {productEmojis[item.product.category] || '🌸'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.vendor.shop_name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.product.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.product.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="font-bold text-pink-600 min-w-[55px] text-right shrink-0">₹{item.product.price * item.quantity}</span>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-5 border-t bg-gradient-to-r from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-800 space-y-3 shrink-0">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span className="flex items-center gap-1"><Bike className="w-4 h-4" /> Delivery</span>
                    <span className="font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-pink-600">₹{cartTotal}</span>
                  </div>
                  <Button 
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-base shadow-lg shadow-pink-500/25"
                    onClick={() => setShowCheckout(true)}
                  >
                    Proceed to Checkout
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {orderSuccess ? (
                <div className="text-center py-12 px-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30"
                  >
                    <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Order Placed! 🎉</h3>
                  <p className="text-muted-foreground">Your items will be delivered to your queue position in ~15 minutes</p>
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                        <Bike className="w-5 h-5" />
                      </motion.div>
                      <span className="font-medium">Delivery partner on the way!</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Truck className="w-6 h-6" />
                      Queue Delivery
                    </h3>
                    <p className="text-sm opacity-90 mt-1">We'll find you in the line!</p>
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="text-sm font-medium mb-2 block">📍 Your Queue Location</label>
                      <Input
                        placeholder="e.g., Near Gate B, Position ~150"
                        value={pilgrimLocation}
                        onChange={(e) => setPilgrimLocation(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Describe your position so the vendor can find you
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">📱 Phone Number</label>
                      <Input
                        placeholder="Your phone number"
                        value={pilgrimPhone}
                        onChange={(e) => setPilgrimPhone(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal ({cartCount} items)</span>
                        <span>₹{cartTotal}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Delivery</span>
                        <span>FREE</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-pink-200 dark:border-pink-800">
                        <span>Total</span>
                        <span className="text-pink-600">₹{cartTotal}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowCheckout(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                        onClick={placeOrder}
                        disabled={!pilgrimLocation || !pilgrimPhone || isOrdering}
                      >
                        {isOrdering ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>Place Order <ChevronRight className="w-5 h-5 ml-1" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

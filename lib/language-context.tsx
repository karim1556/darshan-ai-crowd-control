'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'en' | 'hi' | 'mr'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'app.name': 'DARSHAN.AI',
    'app.tagline': 'Pilgrim Portal',
    'common.home': 'Home',
    'common.back': 'Back',
    'common.refresh': 'Refresh',
    'common.loading': 'Loading...',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.search': 'Search',
    'common.track': 'Track',
    'common.view': 'View',
    'common.close': 'Close',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.total': 'Total',
    'common.status': 'Status',
    'common.pending': 'Pending',
    'common.delivered': 'Delivered',
    'common.items': 'Items',
    
    // Header / Navigation
    'nav.notifications': 'Notifications',
    'nav.markAllRead': 'Mark all read',
    'nav.noNotifications': 'No notifications',
    
    // Emergency
    'emergency.sos': 'EMERGENCY SOS',
    'emergency.title': 'Emergency SOS',
    'emergency.description': 'Tap for immediate help',
    
    // Dashboard Stats
    'stats.upcoming': 'Upcoming',
    'stats.checkedIn': 'Checked In',
    'stats.crowd': 'Crowd',
    'stats.high': 'High',
    'stats.low': 'Low',
    
    // AI Assistant
    'ai.title': 'Darshan AI Assistant',
    'ai.description': 'Ask about crowd, slots, gates & more',
    'ai.new': 'NEW',
    
    // Seva Marketplace
    'marketplace.title': 'Seva Marketplace',
    'marketplace.description': 'Flowers, Prasad & Puja Items',
    'marketplace.deliveryTag': 'Delivery to Queue!',
    'marketplace.search': 'Search flowers, prasad, puja items...',
    'marketplace.queueDelivery': 'Queue Delivery Service',
    'marketplace.queueDeliveryDesc': 'Order now & we\'ll find you in line!',
    'marketplace.availableShops': 'Available Shops',
    'marketplace.cart': 'Your Cart',
    'marketplace.emptyCart': 'Your cart is empty',
    'marketplace.emptyCartDesc': 'Add items to offer at the temple',
    'marketplace.subtotal': 'Subtotal',
    'marketplace.delivery': 'Delivery',
    'marketplace.free': 'FREE',
    'marketplace.checkout': 'Proceed to Checkout',
    'marketplace.placeOrder': 'Place Order',
    'marketplace.orderPlaced': 'Order Placed!',
    'marketplace.orderPlacedDesc': 'Your items will be delivered to your queue position in ~15 minutes',
    'marketplace.deliveryOnWay': 'Delivery partner on the way!',
    'marketplace.yourLocation': 'Your Queue Location',
    'marketplace.locationPlaceholder': 'e.g., Near Gate B, Position ~150',
    'marketplace.locationHint': 'Describe your position so the vendor can find you',
    'marketplace.phoneNumber': 'Phone Number',
    
    // Holy Music
    'music.title': 'Holy Music',
    'music.description': 'Bhajans, Mantras & Aarti',
    'music.listenTag': 'Listen While Waiting',
    'music.tagline': 'Divine sounds for your soul',
    'music.search': 'Search bhajans, mantras, artists...',
    'music.favorites': 'Favorites',
    'music.featured': 'Featured Devotional',
    'music.allTracks': 'All Tracks',
    'music.yourFavorites': 'Your Favorites',
    'music.noTracks': 'No tracks found',
    'music.adjustFilters': 'Try adjusting your filters',
    'music.nowPlaying': 'Now Playing',
    
    // Bookings
    'bookings.title': 'My Bookings',
    'bookings.noBookings': 'No Bookings Yet',
    'bookings.noBookingsDesc': 'Book a darshan slot to get started',
    'bookings.bookNow': 'Book Now',
    'bookings.bookNew': 'Book New Darshan Slot',
    'bookings.planVisit': 'Plan your temple visit',
    'bookings.viewQR': 'View QR Ticket',
    'bookings.members': 'member(s)',
    
    // Orders
    'orders.title': 'My Orders',
    'orders.recentDeliveries': 'Recent deliveries',
    'orders.noOrders': 'No recent orders. Order flowers or prasad and track delivery here.',
    'orders.trackOrder': 'Track Order',
    'orders.orderItems': 'Items',
    'orders.liveTracking': 'Live Tracking',
    'orders.outForDelivery': 'Out for delivery',
    'orders.deliveryAssigned': 'Delivery partner assigned. Estimated',
    'orders.minutes': 'minutes',
    'orders.contactVendor': 'If the order status doesn\'t update, contact the vendor directly.',
    'orders.backToMarketplace': 'Back to Marketplace',
    'orders.placed': 'Placed',
    
    // Crowd Status
    'crowd.title': 'Crowd Status',
    'crowd.alert': 'High Crowd Alert',
    'crowd.atHighCapacity': 'at high capacity',
    'crowd.capacity': 'Capacity',
    'crowd.people': 'people',
    'crowd.noData': 'No crowd data available',
    
    // AI Guide
    'guide.title': 'AI Guide',
    'guide.aiGuide': 'AI Darshan Guide',
    'guide.smartRecommendations': 'Smart recommendations for your visit',
    'guide.recommendedRoute': 'Recommended Route',
    'guide.visit': 'Visit',
    'guide.currentlyAt': 'currently at',
    'guide.loadingRoute': 'Loading route recommendations...',
    'guide.bestTimes': 'Best Times to Visit',
    'guide.earlyMorning': 'Early morning (6 AM - 8 AM) - Low crowd',
    'guide.evening': 'Evening (4 PM - 6 PM) - Moderate crowd',
    'guide.peakHours': 'Peak hours (10 AM - 2 PM) - Avoid if possible',
    'guide.safetyTips': 'Safety Tips',
    'guide.tip1': 'Keep your phone charged - SOS available 24/7',
    'guide.tip2': 'Stay hydrated - water stations at all zones',
    'guide.tip3': 'Keep your QR ticket ready for quick check-in',
    'guide.tip4': 'Emergency helpline displayed at all checkpoints',
    
    // Categories
    'category.all': 'All',
    'category.flowers': 'Flowers',
    'category.garlands': 'Garlands',
    'category.prasad': 'Prasad',
    'category.pujaItems': 'Puja Items',
    'category.coconuts': 'Coconuts',
    'category.sweets': 'Sweets',
    'category.bhajan': 'Bhajan',
    'category.aarti': 'Aarti',
    'category.mantra': 'Mantra',
    'category.kirtan': 'Kirtan',
    'category.meditation': 'Meditation',
    'category.chalisa': 'Chalisa',
    
    // Language
    'language.title': 'Language',
    'language.en': 'English',
    'language.hi': 'हिंदी',
    'language.mr': 'मराठी',
  },
  
  hi: {
    // Common
    'app.name': 'दर्शन.AI',
    'app.tagline': 'तीर्थयात्री पोर्टल',
    'common.home': 'होम',
    'common.back': 'वापस',
    'common.refresh': 'रिफ्रेश',
    'common.loading': 'लोड हो रहा है...',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.save': 'सहेजें',
    'common.search': 'खोजें',
    'common.track': 'ट्रैक करें',
    'common.view': 'देखें',
    'common.close': 'बंद करें',
    'common.add': 'जोड़ें',
    'common.remove': 'हटाएं',
    'common.total': 'कुल',
    'common.status': 'स्थिति',
    'common.pending': 'लंबित',
    'common.delivered': 'पहुंचाया गया',
    'common.items': 'आइटम',
    
    // Header / Navigation
    'nav.notifications': 'सूचनाएं',
    'nav.markAllRead': 'सभी पढ़ा हुआ',
    'nav.noNotifications': 'कोई सूचना नहीं',
    
    // Emergency
    'emergency.sos': 'आपातकालीन SOS',
    'emergency.title': 'आपातकालीन SOS',
    'emergency.description': 'तुरंत मदद के लिए टैप करें',
    
    // Dashboard Stats
    'stats.upcoming': 'आने वाला',
    'stats.checkedIn': 'चेक इन',
    'stats.crowd': 'भीड़',
    'stats.high': 'अधिक',
    'stats.low': 'कम',
    
    // AI Assistant
    'ai.title': 'दर्शन AI सहायक',
    'ai.description': 'भीड़, स्लॉट, गेट के बारे में पूछें',
    'ai.new': 'नया',
    
    // Seva Marketplace
    'marketplace.title': 'सेवा मार्केटप्लेस',
    'marketplace.description': 'फूल, प्रसाद और पूजा सामग्री',
    'marketplace.deliveryTag': 'कतार में डिलीवरी!',
    'marketplace.search': 'फूल, प्रसाद, पूजा सामग्री खोजें...',
    'marketplace.queueDelivery': 'कतार डिलीवरी सेवा',
    'marketplace.queueDeliveryDesc': 'अभी ऑर्डर करें, हम आपको लाइन में ढूंढ लेंगे!',
    'marketplace.availableShops': 'उपलब्ध दुकानें',
    'marketplace.cart': 'आपकी टोकरी',
    'marketplace.emptyCart': 'आपकी टोकरी खाली है',
    'marketplace.emptyCartDesc': 'मंदिर में चढ़ाने के लिए सामग्री जोड़ें',
    'marketplace.subtotal': 'उप-कुल',
    'marketplace.delivery': 'डिलीवरी',
    'marketplace.free': 'मुफ्त',
    'marketplace.checkout': 'चेकआउट करें',
    'marketplace.placeOrder': 'ऑर्डर करें',
    'marketplace.orderPlaced': 'ऑर्डर हो गया!',
    'marketplace.orderPlacedDesc': 'आपकी सामग्री ~15 मिनट में आपकी कतार पर पहुंच जाएगी',
    'marketplace.deliveryOnWay': 'डिलीवरी पार्टनर रास्ते में है!',
    'marketplace.yourLocation': 'आपकी कतार स्थिति',
    'marketplace.locationPlaceholder': 'जैसे, गेट B के पास, स्थिति ~150',
    'marketplace.locationHint': 'अपनी स्थिति बताएं ताकि विक्रेता आपको ढूंढ सके',
    'marketplace.phoneNumber': 'फोन नंबर',
    
    // Holy Music
    'music.title': 'पवित्र संगीत',
    'music.description': 'भजन, मंत्र और आरती',
    'music.listenTag': 'इंतजार करते हुए सुनें',
    'music.tagline': 'आपकी आत्मा के लिए दिव्य ध्वनि',
    'music.search': 'भजन, मंत्र, कलाकार खोजें...',
    'music.favorites': 'पसंदीदा',
    'music.featured': 'विशेष भक्ति संगीत',
    'music.allTracks': 'सभी ट्रैक',
    'music.yourFavorites': 'आपके पसंदीदा',
    'music.noTracks': 'कोई ट्रैक नहीं मिला',
    'music.adjustFilters': 'फिल्टर बदलकर देखें',
    'music.nowPlaying': 'अभी बज रहा है',
    
    // Bookings
    'bookings.title': 'मेरी बुकिंग',
    'bookings.noBookings': 'अभी कोई बुकिंग नहीं',
    'bookings.noBookingsDesc': 'शुरू करने के लिए दर्शन स्लॉट बुक करें',
    'bookings.bookNow': 'अभी बुक करें',
    'bookings.bookNew': 'नया दर्शन स्लॉट बुक करें',
    'bookings.planVisit': 'अपनी मंदिर यात्रा की योजना बनाएं',
    'bookings.viewQR': 'QR टिकट देखें',
    'bookings.members': 'सदस्य',
    
    // Orders
    'orders.title': 'मेरे ऑर्डर',
    'orders.recentDeliveries': 'हाल की डिलीवरी',
    'orders.noOrders': 'कोई हाल का ऑर्डर नहीं। फूल या प्रसाद ऑर्डर करें और यहां ट्रैक करें।',
    'orders.trackOrder': 'ऑर्डर ट्रैक करें',
    'orders.orderItems': 'आइटम',
    'orders.liveTracking': 'लाइव ट्रैकिंग',
    'orders.outForDelivery': 'डिलीवरी के लिए निकला',
    'orders.deliveryAssigned': 'डिलीवरी पार्टनर असाइन किया गया। अनुमानित',
    'orders.minutes': 'मिनट',
    'orders.contactVendor': 'अगर स्थिति अपडेट नहीं होती, तो सीधे विक्रेता से संपर्क करें।',
    'orders.backToMarketplace': 'मार्केटप्लेस पर वापस जाएं',
    'orders.placed': 'ऑर्डर किया',
    
    // Crowd Status
    'crowd.title': 'भीड़ की स्थिति',
    'crowd.alert': 'भीड़ अलर्ट',
    'crowd.atHighCapacity': 'उच्च क्षमता पर है',
    'crowd.capacity': 'क्षमता',
    'crowd.people': 'लोग',
    'crowd.noData': 'भीड़ का डेटा उपलब्ध नहीं',
    
    // AI Guide
    'guide.title': 'AI गाइड',
    'guide.aiGuide': 'AI दर्शन गाइड',
    'guide.smartRecommendations': 'आपकी यात्रा के लिए स्मार्ट सुझाव',
    'guide.recommendedRoute': 'सुझाया गया मार्ग',
    'guide.visit': 'जाएं',
    'guide.currentlyAt': 'वर्तमान में',
    'guide.loadingRoute': 'मार्ग सुझाव लोड हो रहे हैं...',
    'guide.bestTimes': 'जाने का सबसे अच्छा समय',
    'guide.earlyMorning': 'सुबह जल्दी (6 AM - 8 AM) - कम भीड़',
    'guide.evening': 'शाम (4 PM - 6 PM) - मध्यम भीड़',
    'guide.peakHours': 'पीक घंटे (10 AM - 2 PM) - बचें',
    'guide.safetyTips': 'सुरक्षा सुझाव',
    'guide.tip1': 'फोन चार्ज रखें - SOS 24/7 उपलब्ध',
    'guide.tip2': 'हाइड्रेटेड रहें - सभी जोन में पानी स्टेशन',
    'guide.tip3': 'QR टिकट तैयार रखें',
    'guide.tip4': 'सभी चेकपॉइंट पर हेल्पलाइन उपलब्ध',
    
    // Categories
    'category.all': 'सभी',
    'category.flowers': 'फूल',
    'category.garlands': 'माला',
    'category.prasad': 'प्रसाद',
    'category.pujaItems': 'पूजा सामग्री',
    'category.coconuts': 'नारियल',
    'category.sweets': 'मिठाई',
    'category.bhajan': 'भजन',
    'category.aarti': 'आरती',
    'category.mantra': 'मंत्र',
    'category.kirtan': 'कीर्तन',
    'category.meditation': 'ध्यान',
    'category.chalisa': 'चालीसा',
    
    // Language
    'language.title': 'भाषा',
    'language.en': 'English',
    'language.hi': 'हिंदी',
    'language.mr': 'मराठी',
  },
  
  mr: {
    // Common
    'app.name': 'दर्शन.AI',
    'app.tagline': 'भाविक पोर्टल',
    'common.home': 'मुख्यपृष्ठ',
    'common.back': 'मागे',
    'common.refresh': 'रिफ्रेश',
    'common.loading': 'लोड होत आहे...',
    'common.cancel': 'रद्द करा',
    'common.confirm': 'पुष्टी करा',
    'common.save': 'सेव्ह करा',
    'common.search': 'शोधा',
    'common.track': 'ट्रॅक करा',
    'common.view': 'पहा',
    'common.close': 'बंद करा',
    'common.add': 'जोडा',
    'common.remove': 'काढा',
    'common.total': 'एकूण',
    'common.status': 'स्थिती',
    'common.pending': 'प्रलंबित',
    'common.delivered': 'वितरित',
    'common.items': 'आयटम',
    
    // Header / Navigation
    'nav.notifications': 'सूचना',
    'nav.markAllRead': 'सर्व वाचले',
    'nav.noNotifications': 'सूचना नाहीत',
    
    // Emergency
    'emergency.sos': 'आणीबाणी SOS',
    'emergency.title': 'आणीबाणी SOS',
    'emergency.description': 'त्वरित मदतीसाठी टॅप करा',
    
    // Dashboard Stats
    'stats.upcoming': 'येणारे',
    'stats.checkedIn': 'चेक इन',
    'stats.crowd': 'गर्दी',
    'stats.high': 'जास्त',
    'stats.low': 'कमी',
    
    // AI Assistant
    'ai.title': 'दर्शन AI सहाय्यक',
    'ai.description': 'गर्दी, स्लॉट, गेट बद्दल विचारा',
    'ai.new': 'नवीन',
    
    // Seva Marketplace
    'marketplace.title': 'सेवा मार्केटप्लेस',
    'marketplace.description': 'फुले, प्रसाद आणि पूजा साहित्य',
    'marketplace.deliveryTag': 'रांगेत डिलिव्हरी!',
    'marketplace.search': 'फुले, प्रसाद, पूजा साहित्य शोधा...',
    'marketplace.queueDelivery': 'रांग डिलिव्हरी सेवा',
    'marketplace.queueDeliveryDesc': 'आता ऑर्डर करा, आम्ही तुम्हाला रांगेत शोधू!',
    'marketplace.availableShops': 'उपलब्ध दुकाने',
    'marketplace.cart': 'तुमची टोपली',
    'marketplace.emptyCart': 'तुमची टोपली रिकामी आहे',
    'marketplace.emptyCartDesc': 'मंदिरात अर्पण करण्यासाठी साहित्य जोडा',
    'marketplace.subtotal': 'उप-एकूण',
    'marketplace.delivery': 'डिलिव्हरी',
    'marketplace.free': 'मोफत',
    'marketplace.checkout': 'चेकआउट करा',
    'marketplace.placeOrder': 'ऑर्डर करा',
    'marketplace.orderPlaced': 'ऑर्डर झाले!',
    'marketplace.orderPlacedDesc': 'तुमचे साहित्य ~15 मिनिटांत तुमच्या रांगेत पोहोचेल',
    'marketplace.deliveryOnWay': 'डिलिव्हरी पार्टनर येत आहे!',
    'marketplace.yourLocation': 'तुमची रांग स्थिती',
    'marketplace.locationPlaceholder': 'उदा., गेट B जवळ, स्थिती ~150',
    'marketplace.locationHint': 'तुमची स्थिती सांगा जेणेकरून विक्रेता तुम्हाला शोधू शकेल',
    'marketplace.phoneNumber': 'फोन नंबर',
    
    // Holy Music
    'music.title': 'पवित्र संगीत',
    'music.description': 'भजन, मंत्र आणि आरती',
    'music.listenTag': 'वाट पाहताना ऐका',
    'music.tagline': 'तुमच्या आत्म्यासाठी दिव्य ध्वनी',
    'music.search': 'भजन, मंत्र, कलाकार शोधा...',
    'music.favorites': 'आवडते',
    'music.featured': 'विशेष भक्ती संगीत',
    'music.allTracks': 'सर्व ट्रॅक',
    'music.yourFavorites': 'तुमचे आवडते',
    'music.noTracks': 'ट्रॅक सापडले नाहीत',
    'music.adjustFilters': 'फिल्टर बदलून पहा',
    'music.nowPlaying': 'आता वाजत आहे',
    
    // Bookings
    'bookings.title': 'माझी बुकिंग',
    'bookings.noBookings': 'अजून बुकिंग नाही',
    'bookings.noBookingsDesc': 'सुरू करण्यासाठी दर्शन स्लॉट बुक करा',
    'bookings.bookNow': 'आता बुक करा',
    'bookings.bookNew': 'नवीन दर्शन स्लॉट बुक करा',
    'bookings.planVisit': 'तुमच्या मंदिर भेटीचे नियोजन करा',
    'bookings.viewQR': 'QR तिकीट पहा',
    'bookings.members': 'सदस्य',
    
    // Orders
    'orders.title': 'माझे ऑर्डर',
    'orders.recentDeliveries': 'अलीकडील डिलिव्हरी',
    'orders.noOrders': 'अलीकडील ऑर्डर नाहीत. फुले किंवा प्रसाद ऑर्डर करा आणि इथे ट्रॅक करा.',
    'orders.trackOrder': 'ऑर्डर ट्रॅक करा',
    'orders.orderItems': 'आयटम',
    'orders.liveTracking': 'लाइव्ह ट्रॅकिंग',
    'orders.outForDelivery': 'डिलिव्हरीसाठी निघाले',
    'orders.deliveryAssigned': 'डिलिव्हरी पार्टनर नियुक्त. अंदाजे',
    'orders.minutes': 'मिनिटे',
    'orders.contactVendor': 'स्थिती अपडेट नाही झाली तर थेट विक्रेत्याशी संपर्क करा.',
    'orders.backToMarketplace': 'मार्केटप्लेसवर परत जा',
    'orders.placed': 'ऑर्डर केले',
    
    // Crowd Status
    'crowd.title': 'गर्दी स्थिती',
    'crowd.alert': 'गर्दी अलर्ट',
    'crowd.atHighCapacity': 'उच्च क्षमतेवर आहे',
    'crowd.capacity': 'क्षमता',
    'crowd.people': 'लोक',
    'crowd.noData': 'गर्दी डेटा उपलब्ध नाही',
    
    // AI Guide
    'guide.title': 'AI मार्गदर्शक',
    'guide.aiGuide': 'AI दर्शन मार्गदर्शक',
    'guide.smartRecommendations': 'तुमच्या भेटीसाठी स्मार्ट सूचना',
    'guide.recommendedRoute': 'सुचवलेला मार्ग',
    'guide.visit': 'भेट द्या',
    'guide.currentlyAt': 'सध्या',
    'guide.loadingRoute': 'मार्ग सूचना लोड होत आहेत...',
    'guide.bestTimes': 'जाण्याची सर्वोत्तम वेळ',
    'guide.earlyMorning': 'सकाळी लवकर (6 AM - 8 AM) - कमी गर्दी',
    'guide.evening': 'संध्याकाळ (4 PM - 6 PM) - मध्यम गर्दी',
    'guide.peakHours': 'पीक तास (10 AM - 2 PM) - टाळा',
    'guide.safetyTips': 'सुरक्षा सूचना',
    'guide.tip1': 'फोन चार्ज ठेवा - SOS 24/7 उपलब्ध',
    'guide.tip2': 'हायड्रेटेड राहा - सर्व झोनमध्ये पाणी स्टेशन',
    'guide.tip3': 'QR तिकीट तयार ठेवा',
    'guide.tip4': 'सर्व चेकपॉइंटवर हेल्पलाइन उपलब्ध',
    
    // Categories
    'category.all': 'सर्व',
    'category.flowers': 'फुले',
    'category.garlands': 'माळा',
    'category.prasad': 'प्रसाद',
    'category.pujaItems': 'पूजा साहित्य',
    'category.coconuts': 'नारळ',
    'category.sweets': 'मिठाई',
    'category.bhajan': 'भजन',
    'category.aarti': 'आरती',
    'category.mantra': 'मंत्र',
    'category.kirtan': 'कीर्तन',
    'category.meditation': 'ध्यान',
    'category.chalisa': 'चालीसा',
    
    // Language
    'language.title': 'भाषा',
    'language.en': 'English',
    'language.hi': 'हिंदी',
    'language.mr': 'मराठी',
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem('app_language') as Language
    if (saved && ['en', 'hi', 'mr'].includes(saved)) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('app_language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

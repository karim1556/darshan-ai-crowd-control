'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Bike, Truck, CheckCircle2, Clock, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function OrderTrackPage() {
  const params = useParams()
  const router = useRouter()
  const { orderId } = params || {}
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const orderIdStr = Array.isArray(orderId) ? orderId[0] : orderId
      const res = await fetch(`/api/vendors/orders?orderId=${encodeURIComponent(orderIdStr)}`)
      if (res.ok) {
        const data = await res.json()
        const found = Array.isArray(data.orders) ? data.orders[0] : data.order || null
        setOrder(found)
      } else {
        const err = await res.json()
        console.error('Error fetching order', err)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    const iv = setInterval(fetchOrder, 10000)
    return () => clearInterval(iv)
  }, [orderId])

  if (!orderId) return <div className="p-6">Order ID missing</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Track Order</h1>
        </div>

        <Card className="p-4 mb-4">
          <p className="text-xs text-muted-foreground">{order?.order_id || orderId}</p>
          <h2 className="font-semibold text-lg">{order?.vendor?.shop_name || order?.vendor?.name || 'Vendor'}</h2>
          <p className="text-sm text-muted-foreground">{order?.pilgrim_location}</p>
          <div className="flex items-center gap-3 mt-3 text-sm">
            <Bike className="w-4 h-4 text-amber-500" />
            <span className="font-medium">Status: </span>
            <span className="text-sm">{order?.status || 'pending'}</span>
          </div>
        </Card>

        <Card className="p-4 mb-4">
          <h3 className="font-semibold mb-2">Items</h3>
          <div className="space-y-2">
            {order?.items?.map((it: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-muted-foreground text-xs">Qty: {it.quantity} • ₹{it.price}</div>
                </div>
                <div className="font-semibold">₹{it.quantity * it.price}</div>
              </div>
            ))}
            {!order?.items && <p className="text-sm text-muted-foreground">No items found</p>}
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">Placed: {order?.created_at ? new Date(order.created_at).toLocaleString() : '-'}</div>
            <div className="font-bold">Total: ₹{order?.total_amount}</div>
          </div>
        </Card>

        <Card className="p-4 mb-4">
          <h3 className="font-semibold mb-3">Live Tracking</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium">Out for delivery</div>
                <div className="text-sm text-muted-foreground">Delivery partner assigned. Estimated {order?.estimated_delivery || 15} minutes</div>
              </div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: order?.status === 'delivered' ? '100%' : order?.status === 'out-for-delivery' ? '60%' : '20%' }} />
            </motion.div>

            <div className="flex gap-2">
              <Button onClick={fetchOrder}>Refresh</Button>
              <Link href="/pilgrim/marketplace">
                <Button variant="ghost">Back to Marketplace</Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground">If the order status doesn't update, contact the vendor directly.</div>
      </div>
    </div>
  )
}

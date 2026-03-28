'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/user/Navbar'
import Footer from '@/components/user/Footer'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

function DiscoveryBookingSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const razorpayPaymentId = searchParams.get('razorpay_payment_id')
  const razorpayOrderId = searchParams.get('razorpay_order_id')
  const razorpaySignature = searchParams.get('razorpay_signature')
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const verifyBooking = async () => {
      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        toast.error('Invalid payment details')
        router.push('/discoveryappointment')
        return
      }

      try {
        const token = sessionStorage.getItem('userToken')
        if (!token) {
          toast.error('Please login')
          router.push('/login')
          return
        }

        const storedFormData = sessionStorage.getItem('discoveryCheckoutForm')
        let formData = {}
        if (storedFormData) {
          try {
            formData = JSON.parse(storedFormData)
          } catch {
            formData = {}
          }
        }

        const response = await fetch('/api/payment/verify-discovery-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpayPaymentId,
            razorpayOrderId,
            razorpaySignature,
            formData,
          }),
        })

        const data = await response.json()

        if (data.success) {
          sessionStorage.removeItem('discoveryCheckoutForm')
          setVerified(true)
          toast.success('Discovery session booked successfully!')
        } else {
          toast.error(data.message || 'Failed to verify booking')
          router.push('/discoveryappointment')
        }
      } catch (error) {
        console.error('Verification error:', error)
        toast.error('Failed to verify booking')
        router.push('/discoveryappointment')
      } finally {
        setVerifying(false)
      }
    }

    verifyBooking()
  }, [razorpayPaymentId, razorpayOrderId, razorpaySignature, router])

  if (verifying) {
    return (
      <div className='bg-white min-h-screen'>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-[#1C3163]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
            <p>Verifying your booking...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!verified) {
    return (
      <div className='bg-white min-h-screen'>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-[#1C3163]">
            <p className="mb-4">Booking verification failed</p>
            <Link href="/discoveryappointment" className="text-[#000000] hover:underline">
              Back to Discovery Booking
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className='bg-white min-h-screen'>
      <Navbar />
      
      <div className="w-full py-[40px] md:py-[68px]">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/50 rounded-lg p-8 md:p-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
            <h1 className="text-[#1C3163] text-[28px] md:text-[32px] font-semibold mb-4">
              Discovery Session Booked!
            </h1>
            <p className="text-[#6B5D4F] text-[16px] md:text-[18px] mb-8">
              Your discovery session booking has been confirmed. You will receive a confirmation email shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/discoveryappointment"
                className="inline-block bg-[#1C3163] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2a4a7a] transition-colors"
              >
                Book Another Session
              </Link>
              <Link
                href="/"
                className="inline-block border border-[#1C3163] text-[#1C3163] px-6 py-3 rounded-lg font-medium hover:bg-[#1C3163] hover:text-white transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function DiscoveryBookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className='bg-white min-h-screen'>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-[#1C3163]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#1C3163] mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <DiscoveryBookingSuccessContent />
    </Suspense>
  )
}




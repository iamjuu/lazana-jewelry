'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/user/Navbar'
import Footer from '@/components/user/Footer'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function EventBookingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const verifyBooking = async () => {
      if (!sessionId) {
        toast.error('Invalid session')
        router.push('/events')
        return
      }

      try {
        const token = sessionStorage.getItem('userToken')
        if (!token) {
          toast.error('Please login')
          router.push('/login')
          return
        }

        const response = await fetch('/api/payment/verify-event-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        })

        const data = await response.json()

        if (data.success) {
          setVerified(true)
          toast.success('Event booked successfully!')
        } else {
          toast.error(data.message || 'Failed to verify booking')
          router.push('/events')
        }
      } catch (error) {
        console.error('Verification error:', error)
        toast.error('Failed to verify booking')
        router.push('/events')
      } finally {
        setVerifying(false)
      }
    }

    verifyBooking()
  }, [sessionId, router])

  if (verifying) {
    return (
      <div className='bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen'>
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
      <div className='bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen'>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-[#1C3163]">
            <p className="mb-4">Booking verification failed</p>
            <Link href="/events" className="text-[#D5B584] hover:underline">
              Back to Events
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className='bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen'>
      <Navbar />
      
      <div className="w-full py-[40px] md:py-[68px]">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/50 rounded-lg p-8 md:p-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
            <h1 className="text-[#1C3163] text-[28px] md:text-[32px] font-semibold mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-[#6B5D4F] text-[16px] md:text-[18px] mb-8">
              Your event booking has been confirmed. You will receive a confirmation email shortly asap.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/events"
                className="inline-block bg-[#1C3163] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2a4a7a] transition-colors"
              >
                View All Events
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






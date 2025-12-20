'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import Navbar from '@/components/user/Navbar'
import Footer from '@/components/user/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const BookASessionPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'discovery' | 'freeStudioVisit' | 'corporate'>('discovery')
  const [submitting, setSubmitting] = useState(false)

  // Free Studio Visit Form state
  const [freeStudioFormData, setFreeStudioFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    comment: ''
  })

  // Corporate Form state
  const [corporateFormData, setCorporateFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    comment: ''
  })

  const handleFreeStudioChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFreeStudioFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCorporateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCorporateFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFreeStudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const sessionType = 'freeStudioVisit'
    const services = 'Free Studio Visit'

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...freeStudioFormData, services, sessionType }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Thank you for submitting! We will contact you soon.')
        // Reset form
        setFreeStudioFormData({
          fullName: '',
          phone: '',
          email: '',
          comment: ''
        })
      } else {
        toast.error(data.message || 'Failed to submit enquiry. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to submit enquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCorporateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const sessionType = 'corporate'
    const services = 'Corporate Session'

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...corporateFormData, services, sessionType }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Thank you for submitting! We will contact you soon.')
        // Reset form
        setCorporateFormData({
          fullName: '',
          phone: '',
          email: '',
          comment: ''
        })
      } else {
        toast.error(data.message || 'Failed to submit enquiry. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to submit enquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='bg-gradient-to-r from-[#FDECE2] to-[#FEC1A2] min-h-screen'>
      <Navbar />
      <div className="w-full">
        <section className="w-full px-4 md:px-0 py-[68px]">
          <div className="max-w-6xl pb-[106px] mx-auto">
            {/* Header */}
            <div className="mb-8 md:mb-12">
              <h1 className="text-[32px] sm:text-[36px] md:text-[40px] text-[#D5B584] font-light leading-tight mb-3">
                Book a Session
              </h1>
              <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#5B7C99] font-light leading-relaxed max-w-2xl">
                Choose from our available sessions and book your preferred experience with us.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8 border-b border-[#D5B584]/30">
              <div className="flex gap-4 md:gap-8">
                <button
                  onClick={() => setActiveTab('discovery')}
                  className={`pb-4 px-2 text-[16px] sm:text-[18px] font-medium transition-colors ${
                    activeTab === 'discovery'
                      ? 'text-[#1C3163] border-b-2 border-[#1C3163]'
                      : 'text-[#5B7C99] hover:text-[#1C3163]'
                  }`}
                >
                  Discovery Session
                </button>
                <button
                  onClick={() => setActiveTab('freeStudioVisit')}
                  className={`pb-4 px-2 text-[16px] sm:text-[18px] font-medium transition-colors ${
                    activeTab === 'freeStudioVisit'
                      ? 'text-[#1C3163] border-b-2 border-[#1C3163]'
                      : 'text-[#5B7C99] hover:text-[#1C3163]'
                  }`}
                >
                  Free Studio Visit
                </button>
                <button
                  onClick={() => setActiveTab('corporate')}
                  className={`pb-4 px-2 text-[16px] sm:text-[18px] font-medium transition-colors ${
                    activeTab === 'corporate'
                      ? 'text-[#1C3163] border-b-2 border-[#1C3163]'
                      : 'text-[#5B7C99] hover:text-[#1C3163]'
                  }`}
                >
                  Corporate Session
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
              {/* Discovery Session Tab */}
              {activeTab === 'discovery' && (
                <div className="bg-white/50 rounded-lg p-6 md:p-8">
                  <h2 className="text-[24px] sm:text-[28px] text-[#1C3163] font-medium mb-4">
                    Discovery Session
                  </h2>
                  <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#5B7C99] mb-6 leading-relaxed">
                    Book a one-on-one discovery session to explore crystal bowls and find the perfect ones for your practice. 
                    Select your preferred date and time to get started.
                  </p>
                  <Link
                    href="/discoveryappointment"
                    className="inline-block bg-[#1C3163] text-white px-8 py-4 rounded-lg text-[16px] sm:text-[18px] font-medium hover:bg-[#2a4580] transition-colors duration-300 shadow-md"
                  >
                    Book Discovery Session
                  </Link>
                </div>
              )}

              {/* Free Studio Visit Tab */}
              {activeTab === 'freeStudioVisit' && (
                <div className="bg-white/50 rounded-lg p-6 md:p-8">
                  <h2 className="text-[24px] sm:text-[28px] text-[#1C3163] font-medium mb-4">
                    Free Studio Visit
                  </h2>
                  <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#5B7C99] mb-6 leading-relaxed">
                    Schedule a free visit to our studio and experience our crystal bowls in person. 
                    Fill out the form below and we'll get back to you to arrange your visit.
                  </p>

                  <form onSubmit={handleFreeStudioSubmit} className="space-y-6 mt-6">
                    {/* Full Name */}
                    <div>
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={freeStudioFormData.fullName}
                        onChange={handleFreeStudioChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#5B7C99] placeholder-[#5B7C99] text-[14px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                        required
                      />
                    </div>

                    {/* Phone and Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Phone"
                          value={freeStudioFormData.phone}
                          onChange={handleFreeStudioChange}
                          className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#5B7C99] placeholder-[#5B7C99] text-[14px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          name="email"
                          placeholder="Email"
                          value={freeStudioFormData.email}
                          onChange={handleFreeStudioChange}
                          className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#5B7C99] placeholder-[#5B7C99] text-[14px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Comment Section */}
                    <div className="pt-4">
                      <textarea
                        name="comment"
                        placeholder="Write your comment here"
                        value={freeStudioFormData.comment}
                        onChange={handleFreeStudioChange}
                        rows={6}
                        className="w-full px-6 py-4 bg-white/20 border-2 border-[#5B7C99] rounded-lg text-[#5B7C99] placeholder-[#5B7C99] text-[14px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-[#1C3163] text-white px-12 py-4 rounded-lg text-[16px] sm:text-[18px] font-medium hover:bg-[#2a4580] transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Corporate Session Tab */}
              {activeTab === 'corporate' && (
                <div className="bg-white/50 rounded-lg p-6 md:p-8">
                  <h2 className="text-[24px] sm:text-[28px] text-[#1C3163] font-medium mb-4">
                    Corporate Session
                  </h2>
                  <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#5B7C99] mb-6 leading-relaxed">
                    Bring the healing power of crystal bowls to your workplace. Fill out the form below 
                    and we'll contact you to discuss your corporate wellness needs.
                  </p>

                  <form onSubmit={handleCorporateSubmit} className="space-y-6 mt-6">
                    {/* Full Name */}
                    <div>
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={corporateFormData.fullName}
                        onChange={handleCorporateChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#5B7C99] placeholder-[#5B7C99] text-[14px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                        required
                      />
                    </div>

                    {/* Phone and Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Phone"
                          value={corporateFormData.phone}
                          onChange={handleCorporateChange}
                          className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#5B7C99] placeholder-[#5B7C99] text-[14px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          name="email"
                          placeholder="Email"
                          value={corporateFormData.email}
                          onChange={handleCorporateChange}
                          className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#5B7C99] placeholder-[#5B7C99] text-[14px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Comment Section */}
                    <div className="pt-4">
                      <textarea
                        name="comment"
                        placeholder="Write your comment here"
                        value={corporateFormData.comment}
                        onChange={handleCorporateChange}
                        rows={6}
                        className="w-full px-6 py-4 bg-white/20 border-2 border-[#5B7C99] rounded-lg text-[#5B7C99] placeholder-[#5B7C99] text-[14px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#D5B584] transition-all resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-[#1C3163] text-white px-12 py-4 rounded-lg text-[16px] sm:text-[18px] font-medium hover:bg-[#2a4580] transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}

export default BookASessionPage


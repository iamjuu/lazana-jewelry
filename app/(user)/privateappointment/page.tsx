'use client'

import React, { useState, useEffect, Suspense } from 'react'
import toast from 'react-hot-toast'
import Navbar from '@/components/user/Navbar'
import Footer from '@/components/user/Footer'
import ProtectedRoute from '@/components/user/ProtectedRoute'
import { useRouter, useSearchParams } from 'next/navigation'

type AvailableSlot = {
  _id: string
  sessionType: string
  title?: string
  month: string
  date: string
  time: string
  isBooked: boolean
  price?: number
}

function PrivateAppointmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('sessionId') // Get sessionId from URL if passed

  const [submitting, setSubmitting] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    comment: '',
    slotId: '', // Selected slot ID
    // Optional corporate-related fields
    companyName: '',
    jobTitle: '',
    workEmail: '',
    industry: '',
    companySize: '',
    preferredDates: '',
    preferredLocation: '',
    preferredDuration: '',
    sessionObjectives: [] as string[]
  })

  // Fetch available slots
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoadingSlots(true)
        const response = await fetch('/api/slots?sessionType=private')
        const data = await response.json()
        
        if (data.success) {
          const slots = data.data || []
          setAvailableSlots(slots)
        } else {
          console.error('Failed to fetch slots:', data.message)
          toast.error('Failed to load available slots')
        }
      } catch (error) {
        console.error('Error fetching slots:', error)
        toast.error('Failed to load available slots')
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchSlots()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCheckboxChange = (name: 'sessionObjectives', value: string) => {
    setFormData(prev => {
      const currentArray = prev[name] || []
      const isChecked = currentArray.includes(value)
      return {
        ...prev,
        [name]: isChecked
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      }
    })
  }

  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr + 'T00:00:00') // Add time to avoid timezone issues
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Format time to 12-hour format
  const formatTime12Hour = (time24: string) => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Format slot display text - show title instead of date/time
  const formatSlotDisplay = (slot: AvailableSlot) => {
    return slot.title || 'Private Session'
  }

  // Get selected slot details
  const selectedSlot = availableSlots.find(slot => slot._id === formData.slotId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.slotId) {
      toast.error('Please select a session')
      return
    }

    if (!formData.preferredDates) {
      toast.error('Please enter preferred date(s)')
      return
    }

    if (!formData.preferredLocation) {
      toast.error('Please select preferred location')
      return
    }

    if (!formData.preferredDuration) {
      toast.error('Please select preferred session duration')
      return
    }

    setSubmitting(true)

    try {
      // Check if user is logged in
      const token = sessionStorage.getItem("userToken")
      if (!token) {
        toast.error("Please login to book a session")
        router.push("/login")
        return
      }

      // Book the private session
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionType: 'private',
          slotId: formData.slotId,
          sessionId: formData.slotId, // For private sessions, slotId is the sessionId
          seats: 1,
          phone: formData.phone,
          comment: formData.comment,
          // Optional corporate-related fields
          companyName: formData.companyName || undefined,
          jobTitle: formData.jobTitle || undefined,
          workEmail: formData.workEmail || undefined,
          industry: formData.industry || undefined,
          companySize: formData.companySize || undefined,
          preferredDates: formData.preferredDates || undefined,
          preferredLocation: formData.preferredLocation || undefined,
          preferredDuration: formData.preferredDuration || undefined,
          sessionObjectives: formData.sessionObjectives.length > 0 ? formData.sessionObjectives : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Private session booked successfully!')
        // Reset form
        setFormData({
          fullName: '',
          phone: '',
          email: '',
          comment: '',
          slotId: '',
          companyName: '',
          jobTitle: '',
          workEmail: '',
          industry: '',
          companySize: '',
          preferredDates: '',
          preferredLocation: '',
          preferredDuration: '',
          sessionObjectives: []
        })
        // Redirect to bookings page
        setTimeout(() => {
          router.push('/profile?tab=bookings')
        }, 1500)
      } else {
        toast.error(data.message || 'Failed to book session. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to book session. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className='bg-white min-h-screen'>
        <Navbar />
        <div className="w-full">
          <section className="w-full px-4 md:px-0 mt-[25px]">
            <div className="max-w-4xl  mx-auto">
              {/* Header */}
              <div className="mb-[25px] md:mb-[25px]">
                <h1 className="text-[28px] sm:text-[28px] md:text-[30px]  lg:text-[32px] text-[#000000] font-light leading-tight mb-3 font-seasons">
                  Private Session Booking
                </h1>
                <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#545454] font-light leading-relaxed max-w-2xl font-touvlo">
                  Fill out the form below to book your private session. Select your preferred date and time from the available slots.
                </p>
              </div>

              {/* Form */}
              <div className="bg-white/50 rounded-lg p-6 md:p-8 ">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Session Time Dropdown */}
                  <div>
                    <label htmlFor="slotId" className="block text-[14px] sm:text-[15px] md:text-[16px]  font-medium text-[#1C3163] mb-2 font-touvlo">
                      Select Session Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="slotId"
                      name="slotId"
                      value={formData.slotId}
                      onChange={handleChange}
                      className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                      required
                      disabled={loadingSlots}
                    >
                      <option value="">
                        {loadingSlots ? 'Loading available sessions...' : 'Select a session '}
                      </option>
                      {availableSlots.map((slot) => (
                        <option key={slot._id} value={slot._id}>
                          {formatSlotDisplay(slot)}
                        </option>
                      ))}
                    </select>
                    {availableSlots.length === 0 && !loadingSlots && (
                      <p className="mt-2 text-sm text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] font-touvlo">
                        No available sessions at the moment. Please check back later.
                      </p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
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
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Required Session Details */}
                  <div className="pt-4 border-t border-[#5B7C99]/20">
                    <h3 className="text-[#1C3163]  text-[14px] md:text-[16px] sm:text-[15px] font-medium mb-4 font-touvlo">Session Details</h3>
                    
                    {/* Preferred Date(s) */}
                    <div className="mb-4">
                      <label className="block text-[#1C3163] text-[14px] sm:text-[15px] md:text-[16px] mb-2 font-touvlo">
                        Preferred Date(s) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="preferredDates"
                        placeholder="e.g., March 15, 2024 or March 15-20, 2024"
                        value={formData.preferredDates}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                        required
                      />
                    </div>

                    {/* Preferred Location */}
                    <div className="mb-4">
                      <label className="block text-[#1C3163] text-[14px] sm:text-[15px] md:text-[16px] mb-2 font-touvlo">
                        Preferred Location <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {['On-site', 'Off-site', 'Virtual / Hybrid'].map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="preferredLocation"
                              value={option}
                              checked={formData.preferredLocation === option}
                              onChange={() => handleRadioChange('preferredLocation', option)}
                              className="w-4 h-4 text-[#000000] border-[#1C3163] focus:ring-[#000000] text-[14]"
                              required
                            />
                            <span className="text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] font-touvlo">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Preferred Duration */}
                    <div className="mb-4">
                      <label className="block text-[#1C3163] text-[14px] sm:text-[15px] md:text-[16px] mb-2 font-touvlo">
                        Preferred Session Duration <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="preferredDuration"
                        value={formData.preferredDuration}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                        required
                      >
                        <option value="">Select Duration</option>
                        <option value="30 minutes">30 minutes</option>
                        <option value="45 minutes">45 minutes</option>
                        <option value="60 minutes">60 minutes</option>
                        <option value="75 minutes">75 minutes</option>
                        <option value="90 minutes">90 minutes</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Corporate-Related Fields */}
                  <div className="pt-4 border-t border-[#5B7C99]/20">
                    <h3 className="text-[#1C3163] text-[14px] sm:text-[15px] md:text-[16px] font-medium mb-4 font-touvlo">Additional Information (Optional)</h3>
                    
                    {/* Company Name and Job Title */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
                      <div>
                        <input
                          type="text"
                          name="companyName"
                          placeholder="Company Name"
                          value={formData.companyName}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="jobTitle"
                          placeholder="Job Title / Role"
                          value={formData.jobTitle}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                        />
                      </div>
                    </div>

                    {/* Work Email */}
                    <div className="mb-4">
                      <input
                        type="email"
                        name="workEmail"
                        placeholder="Work Email (Optional)"
                        value={formData.workEmail}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                      />
                    </div>

                    {/* Industry and Company Size */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
                      <div>
                        <select
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                        >
                          <option value="">Industry (Optional)</option>
                          <option value="Finance">Finance</option>
                          <option value="Technology">Technology</option>
                          <option value="FMCG">FMCG</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Hospitality">Hospitality</option>
                          <option value="Education">Education</option>
                          <option value="Professional Services">Professional Services</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <select
                          name="companySize"
                          value={formData.companySize}
                          onChange={handleChange}
                          className="w-full px-6 py-4 bg-[#E8E4E1] rounded-lg  text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all"
                        >
                          <option value="">Company Size (Optional)</option>
                          <option value="1-50">1-50</option>
                          <option value="51-200">51-200</option>
                          <option value="201-1,000">201-1,000</option>
                          <option value="1,000+">1,000+</option>
                        </select>
                      </div>
                    </div>

                    {/* Session Objectives */}
                    <div className="mb-4">
                      <label className="block text-[#1C3163] text-[14px] sm:text-[15px] md:text-[16px] mb-2 font-touvlo">Session Objectives (Optional)</label>
                      <div className="space-y-2">
                        {[
                          'Stress reduction & relaxation',
                          'Team bonding',
                          'Focus & mental clarity',
                          'Leadership or high-performance support',
                          'Employee wellbeing initiative',
                          'Other'
                        ].map((option) => (
                          <label key={option} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.sessionObjectives.includes(option)}
                              onChange={() => handleCheckboxChange('sessionObjectives', option)}
                              className="w-4 h-4 text-[#000000] border-[#1C3163] rounded focus:ring-[#000000]"
                            />
                            <span className="text-[#545454] text-[14px] sm:text-[15px] md:text-[16px] font-touvlo">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Comment Section */}
                  <div className="pt-4">
                    <textarea
                      name="comment"
                      placeholder="Write your comment here"
                      value={formData.comment}
                      onChange={handleChange}
                      rows={6}
                      className="w-full font-touvlo px-6 py-4 bg-white/20 border-2 border-[#5B7C99] rounded-lg text-[#545454] placeholder-[#545454] text-[14px] sm:text-[15px] md:text-[16px] focus:outline-none focus:ring-2 focus:ring-[#000000] transition-all resize-none"
                    />
                  </div>

                  {/* Selected Slot Display */}
                  {selectedSlot && (
                    <div className="bg-[#000000]/20 border border-[#000000]/40 rounded-lg p-4">
                      <p className="text-sm font-medium text-[#1C3163] mb-2 font-touvlo">Selected Session:</p>
                      <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#1C3163] font-medium font-touvlo">
                        {formatSlotDisplay(selectedSlot)}
                      </p>
                      {/* Show date/time only if they exist (optional fields) */}
                      {/* {(selectedSlot.date || selectedSlot.time) && (
                        <p className="text-[12px] sm:text-[14px] text-[#5B7C99] mt-1">
                          {selectedSlot.date && selectedSlot.time 
                            ? `${formatDate(selectedSlot.date)} at ${formatTime12Hour(selectedSlot.time)}`
                            : selectedSlot.date 
                            ? formatDate(selectedSlot.date)
                            : selectedSlot.time
                            ? formatTime12Hour(selectedSlot.time)
                            : ''
                          }
                        </p>
                      )} */}
                      {/* {selectedSlot.price && selectedSlot.price > 0 && (
                        <p className="text-[14px] sm:text-[16px] text-[#1C3163] mt-1">
                          Price: ${selectedSlot.price.toFixed(2)}
                        </p>
                      )} */}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting || !formData.slotId || !formData.preferredDates || !formData.preferredLocation || !formData.preferredDuration}
                      className="bg-[#1C3163] text-white px-12 py-4 rounded-lg text-[14px] sm:text-[15px] md:text-[16px] font-medium hover:bg-[#2a4580] transition-colors duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-touvlo"
                    >
                      {submitting ? 'Booking...' : 'Book Session'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}

const PrivateAppointmentPage = () => {
  return (
    <Suspense fallback={
      <div className='bg-white min-h-screen flex items-center justify-center'>
        <p className="text-[#5B7C99]">Loading...</p>
      </div>
    }>
      <PrivateAppointmentContent />
    </Suspense>
  )
}

export default PrivateAppointmentPage



import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import DiscoverySession from "@/models/DiscoverySession";
import PrivateSession from "@/models/PrivateSession";
import CorporateSession from "@/models/CorporateSession";
import Event from "@/models/Event";
import SessionEnquiry from "@/models/SessionEnquiry";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { sendPrivateSessionConfirmationToUser, sendPrivateSessionNotificationToAdmin } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await connectDB();
    
    // Fetch bookings for user, optionally filter by sessionType, with pagination
    const { searchParams } = new URL(req.url);
    const sessionType = searchParams.get("sessionType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const skip = (page - 1) * limit;
    
    let query: any = { userId: user._id };
    if (sessionType) {
      // Handle comma-separated sessionTypes or single sessionType
      if (sessionType.includes(",")) {
        const types = sessionType.split(",").map(t => t.trim());
        query.sessionType = { $in: types };
      } else if (["discovery", "private", "corporate", "event"].includes(sessionType)) {
        query.sessionType = sessionType;
      }
    }
    
    // Get total count for pagination
    const total = await Booking.countDocuments(query);
    
    const bookings = await Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    
    // Populate event details for event bookings
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking: any) => {
        if (booking.sessionType === "event" && booking.sessionId) {
          const event = await Event.findById(booking.sessionId).lean();
          return { ...booking, event };
        }
        return booking;
      })
    );
    
    return NextResponse.json({ 
      success: true, 
      data: bookingsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + bookings.length < total,
      }
    });
  } catch (e: any) {
    const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, message: e?.message || "Server error" }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { sessionId, sessionType, seats, phone, comment, slotId, 
      companyName, jobTitle, workEmail, industry, companySize, 
      preferredDates, preferredLocation, preferredDuration, sessionObjectives 
    } = (await req.json()) as { 
      sessionId?: string;
      sessionType?: "discovery" | "private" | "corporate";
      seats?: number; 
      phone?: string; 
      comment?: string;
      slotId?: string; // For discovery/private slot reference
      // Optional corporate-related fields
      companyName?: string;
      jobTitle?: string;
      workEmail?: string;
      industry?: string;
      companySize?: string;
      preferredDates?: string;
      preferredLocation?: string;
      preferredDuration?: string;
      sessionObjectives?: string[];
    };
    
    if (!sessionType) {
      return NextResponse.json({ 
        success: false, 
        message: "Session type is required" 
      }, { status: 400 });
    }
    
    // For private sessions, slotId is required instead of sessionId
    if (sessionType === "private" && !slotId) {
      return NextResponse.json({ 
        success: false, 
        message: "Slot ID is required for private session booking" 
      }, { status: 400 });
    }
    
    // For other session types, sessionId is required
    if (sessionType !== "private" && !sessionId) {
      return NextResponse.json({ 
        success: false, 
        message: "Session ID is required" 
      }, { status: 400 });
    }
    
    if (!seats || seats <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid seats" 
      }, { status: 400 });
    }
    
    // Phone is optional for private sessions (no payment flow)
    if (sessionType !== "private" && (!phone || phone.trim() === "")) {
      return NextResponse.json({ 
        success: false, 
        message: "Phone number is required" 
      }, { status: 400 });
    }

    await connectDB();
    
    let session: any;
    let amount = 0;
    
    // Fetch session based on type
    if (sessionType === "discovery") {
      session = await DiscoverySession.findById(sessionId);
      if (!session) {
        return NextResponse.json({ 
          success: false, 
          message: "Discovery session not found" 
        }, { status: 404 });
      }
      // Discovery: one-on-one, no payment
      if (session.totalSeats !== 1 || session.bookedSeats >= 1) {
        return NextResponse.json({ 
          success: false, 
          message: "Session is already booked" 
        }, { status: 400 });
      }
      amount = 0; // No payment
    } else if (sessionType === "private") {
      // Private sessions: Direct booking without payment
      // For private sessions, slotId IS the PrivateSession _id
      session = await PrivateSession.findById(slotId);
      
      if (!session) {
        return NextResponse.json({ 
          success: false, 
          message: "Private session not found" 
        }, { status: 404 });
      }
      
      // REMOVED: Booking limit check - allow unlimited bookings for private sessions
      // Just increment booked seats counter for tracking purposes (not used for limiting)
      session.bookedSeats = (session.bookedSeats || 0) + 1;
      await session.save();
      
      amount = 0; // No payment required
    } else if (sessionType === "corporate") {
      // Corporate: enquiry only, no direct booking
      return NextResponse.json({ 
        success: false, 
        message: "Corporate sessions are enquiry-based. Please submit an enquiry form." 
      }, { status: 400 });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid session type" 
      }, { status: 400 });
    }

    // Create booking (auto-confirmed for private - no payment required)
    // Discovery sessions now go through payment flow (handled by verify-discovery-checkout)
    const booking = await Booking.create({ 
      userId: user._id, 
      sessionId: sessionType === "private" ? session._id : sessionId, 
      sessionType, 
      seats: 1, 
      amount: 0, // No payment for private sessions
      status: "confirmed", // Auto-confirmed for private sessions
      phone: phone?.trim(),
      comment: comment?.trim() || undefined,
      slotId: slotId || undefined, // Store slot reference if provided
    });
    
    // For private sessions, also create a SessionEnquiry and send emails
    if (sessionType === "private") {
      try {
        // Fetch full user details to get email and name
        const fullUser = await User.findById(user._id);
        if (!fullUser) {
          console.warn("User not found when creating SessionEnquiry");
        } else {
          // Format date to YYYY-MM-DD and readable format
          let sessionDate = "";
          let sessionDateReadable = "";
          if (session.date) {
            const rawDate = session.date;
            if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
              sessionDate = rawDate;
              // Convert to readable format (e.g., "January 1, 2024")
              try {
                const dateObj = new Date(rawDate + 'T00:00:00');
                sessionDateReadable = dateObj.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              } catch {
                sessionDateReadable = rawDate;
              }
            } else {
              try {
                const parsedDate = new Date(rawDate);
                if (!isNaN(parsedDate.getTime())) {
                  const year = parsedDate.getFullYear();
                  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(parsedDate.getDate()).padStart(2, '0');
                  sessionDate = `${year}-${month}-${day}`;
                  sessionDateReadable = parsedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                } else {
                  sessionDate = rawDate;
                  sessionDateReadable = rawDate;
                }
              } catch {
                sessionDate = rawDate;
                sessionDateReadable = rawDate;
              }
            }
          }
          
          const sessionTime = session.startTime || "";
          const customerName = fullUser.name || "Customer";
          const customerEmail = fullUser.email || "";
          const customerPhone = phone?.trim() || fullUser.phone || "N/A";
          const bookingAmount = session.price || 0; // Use session price if available
          
          // Check if enquiry already exists to avoid duplicates
          const existingEnquiry = await SessionEnquiry.findOne({
            sessionId: session._id.toString(),
            sessionType: "private",
            email: customerEmail,
            bookedDate: sessionDate,
          });
          
          if (!existingEnquiry) {
            await SessionEnquiry.create({
              fullName: customerName,
              services: `Private Session - ${sessionDate} at ${sessionTime}`,
              phone: customerPhone,
              email: customerEmail,
              comment: comment?.trim() || `Private Session booking - Direct booking (no payment required)`,
              status: "pending", // Start as pending since admin needs to review
              sessionType: "private",
              sessionId: session._id.toString(),
              bookedDate: sessionDate,
              bookedTime: sessionTime,
              // Optional corporate-related fields
              companyName: companyName || undefined,
              jobTitle: jobTitle || undefined,
              workEmail: workEmail || undefined,
              industry: industry || undefined,
              companySize: companySize || undefined,
              preferredDates: preferredDates || undefined,
              preferredLocation: preferredLocation || undefined,
              preferredDuration: preferredDuration || undefined,
              sessionObjectives: Array.isArray(sessionObjectives) && sessionObjectives.length > 0 ? sessionObjectives : undefined,
            });
            console.log("✅ Created SessionEnquiry for private session booking");
          } else {
            console.log("SessionEnquiry already exists for this booking");
          }

          // Send confirmation email to user
          if (customerEmail) {
            sendPrivateSessionConfirmationToUser({
              fullName: customerName,
              email: customerEmail,
              sessionTitle: session.title || undefined,
              date: sessionDate ? (sessionDateReadable || sessionDate) : undefined,
              time: sessionTime || undefined,
              preferredDates: preferredDates || undefined,
              preferredLocation: preferredLocation || undefined,
              preferredDuration: preferredDuration || undefined,
              companyName: companyName || undefined,
              jobTitle: jobTitle || undefined,
              workEmail: workEmail || undefined,
              industry: industry || undefined,
              companySize: companySize || undefined,
              sessionObjectives: Array.isArray(sessionObjectives) && sessionObjectives.length > 0 ? sessionObjectives : undefined,
              comment: comment?.trim() || undefined,
            }).catch((error) => {
              console.error("Failed to send private session confirmation email to user:", error);
            });
          }

          // Send notification email to admin
          sendPrivateSessionNotificationToAdmin({
            fullName: customerName,
            email: customerEmail,
            phone: customerPhone,
            sessionTitle: session.title || undefined,
            date: (sessionDate && (sessionDateReadable || sessionDate)) ? (sessionDateReadable || sessionDate) : undefined,
            time: sessionTime || undefined,
            preferredDates: preferredDates || undefined,
            preferredLocation: preferredLocation || undefined,
            preferredDuration: preferredDuration || undefined,
            companyName: companyName || undefined,
            jobTitle: jobTitle || undefined,
            workEmail: workEmail || undefined,
            industry: industry || undefined,
            companySize: companySize || undefined,
            sessionObjectives: Array.isArray(sessionObjectives) && sessionObjectives.length > 0 ? sessionObjectives : undefined,
            comment: comment?.trim() || undefined,
          }).catch((error) => {
            console.error("Failed to send private session notification email to admin:", error);
          });
        }
      } catch (enquiryError: any) {
        // Don't fail the booking if enquiry creation or email sending fails
        console.error("❌ Error creating SessionEnquiry or sending emails:", enquiryError);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: booking,
      requiresPayment: false, // No payment for private sessions
    }, { status: 201 });
  } catch (e: any) {
    const status = e?.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ 
      success: false, 
      message: e?.message || "Bad request" 
    }, { status });
  }
}

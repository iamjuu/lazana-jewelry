import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import DiscoverySession from "@/models/DiscoverySession";
import PrivateSession from "@/models/PrivateSession";

// POST - Add a new available slot (kept for backward compatibility, but not used anymore)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { sessionType, month, date, time } = body;

    // Validate required fields
    if (!sessionType || !month || !date || !time) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // This endpoint is deprecated - slots are now created directly with sessions
    return NextResponse.json(
      { success: false, message: "Slots are now created with sessions. Please create a session instead." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating slot:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add slot" },
      { status: 500 }
    );
  }
}

// GET - Fetch slots from DiscoverySession and PrivateSession collections
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const sessionType = searchParams.get("sessionType");
    const showAll = searchParams.get("showAll"); // If 'true', show all slots including booked

    let slots: any[] = [];

    // Fetch from DiscoverySession if sessionType is discovery or not specified
    if (!sessionType || sessionType === "discovery") {
      let discoveryQuery: Record<string, any> = {};
      
      // Filter by booked status (default: only show available)
      if (showAll !== "true") {
        // Only show sessions where bookedSeats < totalSeats (not fully booked)
        // For discovery sessions, totalSeats is always 1, so we check bookedSeats < 1 (i.e., bookedSeats === 0)
        discoveryQuery.$or = [
          { bookedSeats: { $exists: false } }, // Handle sessions without bookedSeats field
          { bookedSeats: { $lt: 1 } }, // Not booked (0)
        ];
      }

      const discoverySessions = await DiscoverySession.find(discoveryQuery)
        .sort({ date: 1, startTime: 1 })
        .lean();

      console.log('Discovery sessions found:', discoverySessions.length, 'with query:', discoveryQuery);

      // Convert DiscoverySession to slot format
      const discoverySlots = discoverySessions
        .filter((session: any) => {
          // Double-check: filter out fully booked sessions
          const isBooked = (session.bookedSeats || 0) >= (session.totalSeats || 1);
          if (isBooked) {
            console.log('Filtering out booked session:', {
              id: session._id,
              date: session.date,
              time: session.startTime,
              bookedSeats: session.bookedSeats,
              totalSeats: session.totalSeats
            });
          }
          return !isBooked;
        })
        .map((session: any) => ({
          _id: session._id,
          sessionType: "discovery",
          month: new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long' }),
          date: session.date,
          time: session.startTime,
          isBooked: (session.bookedSeats || 0) >= (session.totalSeats || 1),
        }));

      slots = [...slots, ...discoverySlots];
    }

    // Fetch from PrivateSession if sessionType is private or not specified
    if (!sessionType || sessionType === "private") {
      let privateQuery: Record<string, any> = {};
      
      // Only show sessions that have a date (required for booking)
      privateQuery.date = { $exists: true, $nin: [null, ""] };
      
      // Filter by booked status (default: only show available)
      if (showAll !== "true") {
        // Only show sessions where bookedSeats < totalSeats (not fully booked)
        // Handle cases where bookedSeats might be 0, undefined, null, or less than totalSeats
        const bookedStatusFilter = {
          $or: [
            { bookedSeats: { $exists: false } }, // Handle sessions without bookedSeats field
            { bookedSeats: null }, // Handle null values
            { bookedSeats: 0 }, // Not booked
            { $expr: { $lt: ["$bookedSeats", { $ifNull: ["$totalSeats", 1] }] } }, // bookedSeats < totalSeats
          ]
        };
        
        // Combine date requirement with booked status filter
        privateQuery.$and = [
          { date: { $exists: true, $nin: [null, ""] } },
          bookedStatusFilter
        ];
        delete privateQuery.date; // Remove from top level since it's in $and
      }

      const privateSessions = await PrivateSession.find(privateQuery)
        .sort({ date: 1, startTime: 1 })
        .lean();

      console.log('Private sessions found:', privateSessions.length, 'with query:', JSON.stringify(privateQuery));
      console.log('Private sessions dates:', privateSessions.map((s: any) => ({ id: s._id, date: s.date, bookedSeats: s.bookedSeats, totalSeats: s.totalSeats })));

      // Convert PrivateSession to slot format
      const privateSlots = privateSessions
        .filter((session: any) => {
          // Double-check: filter out fully booked sessions
          return (session.bookedSeats || 0) < (session.totalSeats || 1);
        })
        .map((session: any) => {
          // Ensure date is in YYYY-MM-DD format (handle Date objects or string dates)
          let formattedDate = session.date;
          if (formattedDate) {
            if (formattedDate instanceof Date) {
              // If it's a Date object, convert to YYYY-MM-DD
              const year = formattedDate.getFullYear();
              const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
              const day = String(formattedDate.getDate()).padStart(2, '0');
              formattedDate = `${year}-${month}-${day}`;
            } else {
              // If it's a string, ensure it's trimmed
              formattedDate = String(formattedDate).trim();
              // Validate format - if it doesn't match YYYY-MM-DD, try to convert
              if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
                // Try to parse as Date and reformat
                const parsedDate = new Date(formattedDate);
                if (!isNaN(parsedDate.getTime())) {
                  const year = parsedDate.getFullYear();
                  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(parsedDate.getDate()).padStart(2, '0');
                  formattedDate = `${year}-${month}-${day}`;
                }
              }
            }
          }
          
          const slot = {
            _id: session._id,
            sessionType: "private",
            month: formattedDate ? new Date(formattedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long' }) : '',
            date: formattedDate,
            time: session.startTime,
            isBooked: (session.bookedSeats || 0) >= (session.totalSeats || 1),
            price: session.price || 0, // Include price from session
          };
          
          // Debug log for slots with issues
          if (!formattedDate) {
            console.warn('⚠️ Slot missing date:', { sessionId: session._id, originalDate: session.date });
          }
          
          return slot;
        });
      
      console.log('✅ Private slots converted:', privateSlots.length);
      if (privateSlots.length > 0) {
        console.log('📅 Private slots dates:', privateSlots.map((s: any) => ({ id: s._id?.toString().slice(-8), date: s.date, isBooked: s.isBooked })));
      }

      slots = [...slots, ...privateSlots];
    }

    // Sort all slots by date and time
    slots.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return NextResponse.json(
      { success: true, data: slots },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch slots" },
      { status: 500 }
    );
  }
}


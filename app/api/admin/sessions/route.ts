import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import DiscoverySession from "@/models/DiscoverySession";
import PrivateSession from "@/models/PrivateSession";
import CorporateSession from "@/models/CorporateSession";
import FreeStudioVisit from "@/models/FreeStudioVisit";
import { requireAdmin } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// GET - Fetch all sessions with pagination and search
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sessionType = searchParams.get("type") || ""; // discovery, private, corporate, freeStudioVisit

    // Build search query
    const buildSearchQuery = () => {
      if (!search) return {};
      return {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { instructorName: { $regex: search, $options: "i" } },
          { format: { $regex: search, $options: "i" } },
        ],
      };
    };

    // Fetch all sessions first, then paginate in memory (since we need to combine multiple models)
    const fetchAllSessions = async () => {
      const searchQuery = buildSearchQuery();
      const allSessions: any[] = [];

      if (!sessionType || sessionType === "discovery") {
        const sessions = await DiscoverySession.find(searchQuery)
          .sort({ createdAt: -1 })
          .lean();
        allSessions.push(
          ...sessions.map((s: any) => ({ ...s, sessionType: "discovery" })),
        );
      }
      if (!sessionType || sessionType === "private") {
        const sessions = await PrivateSession.find(searchQuery)
          .sort({ createdAt: -1 })
          .lean();
        allSessions.push(
          ...sessions.map((s: any) => ({ ...s, sessionType: "private" })),
        );
      }
      if (!sessionType || sessionType === "corporate") {
        const sessions = await CorporateSession.find(searchQuery)
          .sort({ createdAt: -1 })
          .lean();
        allSessions.push(
          ...sessions.map((s: any) => ({ ...s, sessionType: "corporate" })),
        );
      }
      if (!sessionType || sessionType === "freeStudioVisit") {
        const sessions = await FreeStudioVisit.find(searchQuery)
          .sort({ createdAt: -1 })
          .lean();
        allSessions.push(
          ...sessions.map((s: any) => ({
            ...s,
            sessionType: "freeStudioVisit",
          })),
        );
      }

      // Sort all by createdAt (newest first)
      allSessions.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return allSessions;
    };

    const allSessions = await fetchAllSessions();
    const total = allSessions.length;
    const skip = (page - 1) * limit;
    const paginatedSessions = allSessions.slice(skip, skip + limit);

    return NextResponse.json(
      {
        success: true,
        data: paginatedSessions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (e: any) {
    const status =
      e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();

    const body = await req.json();
    const {
      title,
      description,
      sessionType,
      imageUrl,
      videoUrl,
      format,
      benefits,
      instructorName, // New field for discovery/private
      duration, // New field (in minutes)
      price, // For private sessions only
      date, // Date for discovery/private
      startTime, // Start time for discovery/private
      featured, // For private and corporate sessions
    } = body;

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: "Title and description are required" },
        { status: 400 },
      );
    }

    if (!imageUrl && !videoUrl) {
      return NextResponse.json(
        { success: false, message: "Either image or video is required" },
        { status: 400 },
      );
    }

    // Upload image to Cloudinary if provided (convert to WebP)
    let s3ImageUrl: string | undefined;
    if (imageUrl) {
      const imageStr = String(imageUrl).trim();
      if (imageStr.startsWith("https://")) {
        s3ImageUrl = imageStr;
      } else {
        try {
          const filename = `session-${sessionType}-${Date.now()}.webp`;
          const result = await uploadToCloudinary(imageStr, filename, "images");
          s3ImageUrl = result.url;
          console.log(`✓ Uploaded session image to Cloudinary as WebP: ${result.url}`);
        } catch (uploadError) {
          console.error("Failed to upload session image:", uploadError);
          return NextResponse.json(
            { success: false, message: "Failed to upload session image to Cloudinary" },
            { status: 500 },
          );
        }
      }
    }

    // Upload video to Cloudinary if provided
    let s3VideoUrl: string | undefined;
    if (videoUrl) {
      const videoStr = String(videoUrl).trim();
      if (videoStr.startsWith("https://") || videoStr.startsWith("http://")) {
        s3VideoUrl = videoStr;
      } else {
        try {
          const filename = `session-${sessionType}-video-${Date.now()}.mp4`;
          const result = await uploadToCloudinary(videoStr, filename, "videos");
          s3VideoUrl = result.url;
          console.log(`✓ Uploaded session video to Cloudinary: ${result.url}`);
        } catch (uploadError) {
          console.error("Failed to upload session video:", uploadError);
          return NextResponse.json(
            { success: false, message: "Failed to upload session video to Cloudinary" },
            { status: 500 },
          );
        }
      }
    }

    // Filter out empty benefits
    const filteredBenefits = Array.isArray(benefits)
      ? benefits
          .filter((b: string) => b && b.trim().length > 0)
          .map((b: string) => String(b).trim())
      : [];

    // Validate featured count for private and corporate sessions (separate limits for each type)
    if (featured === true && sessionType === "private") {
      const featuredPrivateCount = await PrivateSession.countDocuments({
        featured: true,
      });

      if (featuredPrivateCount >= 3) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Maximum 3 featured sessions allowed for private sessions. Please unfeature another private session first.",
          },
          { status: 400 },
        );
      }
    }

    if (featured === true && sessionType === "corporate") {
      const featuredCorporateCount = await CorporateSession.countDocuments({
        featured: true,
      });

      if (featuredCorporateCount >= 3) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Maximum 3 featured sessions allowed for corporate sessions. Please unfeature another corporate session first.",
          },
          { status: 400 },
        );
      }
    }

    let session;

    if (sessionType === "discovery") {
      // Validation for discovery
      if (!instructorName) {
        return NextResponse.json(
          {
            success: false,
            message: "Instructor name is required for discovery sessions",
          },
          { status: 400 },
        );
      }
      if (!duration || duration <= 0) {
        return NextResponse.json(
          { success: false, message: "Duration is required (in minutes)" },
          { status: 400 },
        );
      }
      if (!date) {
        return NextResponse.json(
          { success: false, message: "Date is required" },
          { status: 400 },
        );
      }
      if (!startTime) {
        return NextResponse.json(
          { success: false, message: "Start time is required" },
          { status: 400 },
        );
      }

      // Calculate endTime from startTime and duration
      const [hours, minutes] = startTime.split(":").map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + Number(duration);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

      // Check for existing sessions at the same date and time (discovery or private)
      const existingDiscovery = await DiscoverySession.findOne({
        date: String(date).trim(),
        startTime: String(startTime).trim(),
      });

      const existingPrivate = await PrivateSession.findOne({
        date: String(date).trim(),
        startTime: String(startTime).trim(),
      });

      if (existingDiscovery || existingPrivate) {
        const existingSession = existingDiscovery || existingPrivate;
        return NextResponse.json(
          {
            success: false,
            message: `A session already exists on ${date} at ${startTime}. Please choose a different date or time.`,
          },
          { status: 400 },
        );
      }

      // Also check for time overlaps (if sessions overlap in time)
      const allDiscoverySessions = await DiscoverySession.find({
        date: String(date).trim(),
      }).lean();

      const allPrivateSessions = await PrivateSession.find({
        date: String(date).trim(),
      }).lean();

      const allSessions = [...allDiscoverySessions, ...allPrivateSessions];

      // Check for time overlap
      for (const existingSession of allSessions) {
        // Type guard: ensure session has startTime and endTime
        if (
          !("startTime" in existingSession) ||
          !("endTime" in existingSession) ||
          !existingSession.startTime ||
          !existingSession.endTime
        ) {
          continue; // Skip sessions without time info
        }
        const existingStart = (existingSession.startTime as string)
          .split(":")
          .map(Number);
        const existingEnd = (existingSession.endTime as string)
          .split(":")
          .map(Number);
        const existingStartMinutes = existingStart[0] * 60 + existingStart[1];
        const existingEndMinutes = existingEnd[0] * 60 + existingEnd[1];
        const newStartMinutes = hours * 60 + minutes;
        const newEndMinutes = endHours * 60 + endMins;

        // Check if times overlap
        if (
          (newStartMinutes >= existingStartMinutes &&
            newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes &&
            newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes &&
            newEndMinutes >= existingEndMinutes)
        ) {
          const sessionStartTime = existingSession.startTime as string;
          const sessionEndTime = existingSession.endTime as string;
          return NextResponse.json(
            {
              success: false,
              message: `Time conflict: A session already exists on ${date} from ${sessionStartTime} to ${sessionEndTime}. Please choose a different time.`,
            },
            { status: 400 },
          );
        }
      }

      session = await DiscoverySession.create({
        title: String(title).trim(),
        description: String(description).trim(),
        instructorName: String(instructorName).trim(),
        duration: Number(duration),
        date: String(date).trim(),
        startTime: String(startTime).trim(),
        endTime,
        totalSeats: 1, // One-on-one
        bookedSeats: 0,
        price: price ? Number(price) : 0,
        imageUrl: s3ImageUrl,
        videoUrl: s3VideoUrl,
        format: format ? String(format).trim() : undefined,
        benefits: filteredBenefits,
      });
    } else if (sessionType === "private") {
      // Validation for private
      if (!instructorName) {
        return NextResponse.json(
          {
            success: false,
            message: "Instructor name is required for private sessions",
          },
          { status: 400 },
        );
      }
      if (!duration || duration <= 0) {
        return NextResponse.json(
          { success: false, message: "Duration is required (in minutes)" },
          { status: 400 },
        );
      }
      // Date and time are now optional for private sessions

      // Calculate endTime from startTime and duration (only if both are provided)
      let endTime: string | undefined;
      if (startTime && duration) {
        const [hours, minutes] = startTime.split(":").map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + Number(duration);
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
      }

      // Only check for conflicts if date and startTime are provided
      if (date && startTime && endTime) {
        // Parse the new session's start time for overlap checking
        const [hours, minutes] = startTime.split(":").map(Number);
        const [endHours, endMins] = endTime.split(":").map(Number);

        // Check for existing sessions at the same date and time (discovery or private)
        const existingDiscovery = await DiscoverySession.findOne({
          date: String(date).trim(),
          startTime: String(startTime).trim(),
        });

        const existingPrivate = await PrivateSession.findOne({
          date: String(date).trim(),
          startTime: String(startTime).trim(),
        });

        if (existingDiscovery || existingPrivate) {
          const existingSession = existingDiscovery || existingPrivate;
          return NextResponse.json(
            {
              success: false,
              message: `A session already exists on ${date} at ${startTime}. Please choose a different date or time.`,
            },
            { status: 400 },
          );
        }

        // Also check for time overlaps (if sessions overlap in time)
        const allDiscoverySessions = await DiscoverySession.find({
          date: String(date).trim(),
        }).lean();

        const allPrivateSessions = await PrivateSession.find({
          date: String(date).trim(),
        }).lean();

        const allSessions = [...allDiscoverySessions, ...allPrivateSessions];

        // Check for time overlap
        for (const existingSession of allSessions) {
          // Type guard: ensure session has startTime and endTime
          if (
            !("startTime" in existingSession) ||
            !("endTime" in existingSession) ||
            !existingSession.startTime ||
            !existingSession.endTime
          ) {
            continue; // Skip sessions without time info
          }
          const existingStart = (existingSession.startTime as string)
            .split(":")
            .map(Number);
          const existingEnd = (existingSession.endTime as string)
            .split(":")
            .map(Number);
          const existingStartMinutes = existingStart[0] * 60 + existingStart[1];
          const existingEndMinutes = existingEnd[0] * 60 + existingEnd[1];
          const newStartMinutes = hours * 60 + minutes;
          const newEndMinutes = endHours * 60 + endMins;

          // Check if times overlap
          if (
            (newStartMinutes >= existingStartMinutes &&
              newStartMinutes < existingEndMinutes) ||
            (newEndMinutes > existingStartMinutes &&
              newEndMinutes <= existingEndMinutes) ||
            (newStartMinutes <= existingStartMinutes &&
              newEndMinutes >= existingEndMinutes)
          ) {
            const sessionStartTime = existingSession.startTime as string;
            const sessionEndTime = existingSession.endTime as string;
            return NextResponse.json(
              {
                success: false,
                message: `Time conflict: A session already exists on ${date} from ${sessionStartTime} to ${sessionEndTime}. Please choose a different time.`,
              },
              { status: 400 },
            );
          }
        }
      }

      // Ensure date is in YYYY-MM-DD format (if provided)
      let formattedDate: string | undefined;
      if (date) {
        formattedDate = String(date).trim();
        // Validate and normalize date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
          // Try to parse and reformat
          const parsedDate = new Date(formattedDate);
          if (!isNaN(parsedDate.getTime())) {
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
            const day = String(parsedDate.getDate()).padStart(2, "0");
            formattedDate = `${year}-${month}-${day}`;
          }
        }
      }

      session = await PrivateSession.create({
        title: String(title).trim(),
        description: String(description).trim(),
        instructorName: String(instructorName).trim(),
        duration: Number(duration),
        price: 0, // No payment required for private sessions
        date: formattedDate || undefined, // Optional - allow undefined
        startTime: startTime ? String(startTime).trim() : undefined, // Optional
        endTime: endTime || undefined, // Optional
        totalSeats: 999, // Set high number since we removed booking limits
        bookedSeats: 0,
        imageUrl: s3ImageUrl,
        videoUrl: s3VideoUrl,
        format: format ? String(format).trim() : undefined,
        benefits: filteredBenefits,
        featured: featured === true || featured === "true" || featured === 1,
      });
    } else if (sessionType === "corporate") {
      // Corporate session - save to CorporateSession collection
      session = await CorporateSession.create({
        title: String(title).trim(),
        description: String(description).trim(),
        imageUrl: s3ImageUrl,
        videoUrl: s3VideoUrl,
        format: format ? String(format).trim() : undefined,
        benefits: filteredBenefits,
        featured: featured === true || featured === "true" || featured === 1,
        // Set default values for required fields (these will be updated when company books)
        companyName: "Pending",
        contactPerson: "TBD",
        email: "tbd@example.com",
        phone: "0000000000",
        employeeCount: 0,
        date: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "10:00",
        duration: 60,
        price: 0,
        status: "pending",
      });
    } else if (sessionType === "freeStudioVisit") {
      // Free Studio Visit - save to FreeStudioVisit collection
      if (!duration) {
        return NextResponse.json(
          {
            success: false,
            message: "Duration is required for Free Studio Visit",
          },
          { status: 400 },
        );
      }
      session = await FreeStudioVisit.create({
        title: String(title).trim(),
        description: String(description).trim(),
        imageUrl: s3ImageUrl,
        videoUrl: s3VideoUrl,
        duration: Number(duration),
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid session type" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (e: any) {
    const status =
      e?.message === "FORBIDDEN" || e?.message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json(
      { success: false, message: e?.message || "Server error" },
      { status },
    );
  }
}


const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env.local");
  process.exit(1);
}

// Schemas (Minimal definitions for migration)
const bookingSchema = new mongoose.Schema({}, { strict: false });
const sessionEnquirySchema = new mongoose.Schema({}, { strict: false });
const discoverySessionSchema = new mongoose.Schema({}, { strict: false });
const privateSessionSchema = new mongoose.Schema({}, { strict: false });
const corporateSessionSchema = new mongoose.Schema({}, { strict: false });
const userSchema = new mongoose.Schema({}, { strict: false });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
const SessionEnquiry = mongoose.models.SessionEnquiry || mongoose.model('SessionEnquiry', sessionEnquirySchema);
const DiscoverySession = mongoose.models.DiscoverySession || mongoose.model('DiscoverySession', discoverySessionSchema);
const PrivateSession = mongoose.models.PrivateSession || mongoose.model('PrivateSession', privateSessionSchema);
const CorporateSession = mongoose.models.CorporateSession || mongoose.model('CorporateSession', corporateSessionSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function migrateData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all bookings that are NOT events
    const bookingsToMigrate = await Booking.find({
      sessionType: { $in: ['discovery', 'private', 'corporate'] }
    });

    console.log(`Found ${bookingsToMigrate.length} bookings to migrate.`);

    for (const booking of bookingsToMigrate) {
      console.log(`Migrating booking ${booking._id} (Type: ${booking.sessionType})...`);

      // Check if enquiry already exists (avoid duplicates)
      const existingEnquiry = await SessionEnquiry.findOne({
        paymentRef: booking.paymentRef || booking._id.toString(),
        sessionType: booking.sessionType
      });

      if (existingEnquiry) {
        console.log(`Enquiry already exists for booking ${booking._id}, skipping.`);
        continue;
      }

      // Fetch session details to populate enquiry fields
      let session = null;
      if (booking.sessionType === 'discovery') {
        session = await DiscoverySession.findById(booking.sessionId);
      } else if (booking.sessionType === 'private') {
        session = await PrivateSession.findById(booking.sessionId);
      } else if (booking.sessionType === 'corporate') {
        session = await CorporateSession.findById(booking.sessionId);
      }

      // Fetch user details
      const user = await User.findById(booking.userId);

      // Create SessionEnquiry
      const newEnquiry = {
        userId: booking.userId,
        fullName: user ? user.name : 'Unknown User',
        email: user ? user.email : 'unknown@example.com',
        phone: user ? user.phone : 'N/A',
        services: session ? (session.title || `${booking.sessionType} Session`) : `${booking.sessionType} Session`,
        comment: booking.comment || JSON.stringify({ migrated: true, originalBookingId: booking._id }),
        status: booking.status === 'confirmed' ? 'completed' : booking.status,
        sessionType: booking.sessionType,
        sessionId: booking.sessionId,
        amount: booking.amount,
        paymentProvider: booking.paymentProvider || 'stripe',
        paymentRef: booking.paymentRef || booking._id.toString(),
        paymentStatus: booking.paymentStatus || (booking.status === 'confirmed' ? 'paid' : 'pending'),
        bookedDate: session ? session.date : undefined,
        bookedTime: session ? session.startTime : undefined,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      };

      await SessionEnquiry.create(newEnquiry);
      console.log(`Created SessionEnquiry for booking ${booking._id}`);
      
      // Optional: Delete original booking? 
      // User said "migrate", usually implies moving. keep safe for now
      // await Booking.deleteOne({ _id: booking._id });
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateData();

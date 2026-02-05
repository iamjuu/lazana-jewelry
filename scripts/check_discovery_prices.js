
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

const DiscoverySessionSchema = new mongoose.Schema(
  {
    title: { type: String },
    date: { type: String },
    startTime: { type: String },
    price: { type: Number },
    // Include other fields if necessary but we mainly care about price
  },
  { collection: 'discoverysessions' } // Ensure we point to the correct collection matching the model name usually pluralized
);

// Check if model already exists to avoid recompilation error, though simpler to just define here
const DiscoverySession = mongoose.models.DiscoverySession || mongoose.model('DiscoverySession', DiscoverySessionSchema);

async function checkPrices() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const sessions = await DiscoverySession.find({});
    console.log(`Found ${sessions.length} discovery sessions.`);

    const invalidSessions = sessions.filter(s => !s.price || s.price <= 0);

    if (invalidSessions.length > 0) {
      console.log('--- Sessions with Invalid Prices ---');
      invalidSessions.forEach(s => {
        console.log(`ID: ${s._id}, Date: ${s.date}, Time: ${s.startTime}, Price: ${s.price}`);
      });
      console.log(`Total invalid: ${invalidSessions.length}`);
    } else {
      console.log('All discovery sessions have valid prices.');
    }

    const validSessions = sessions.filter(s => s.price > 0);
    if(validSessions.length > 0){
        console.log('--- Example Valid Session ---');
        console.log(`ID: ${validSessions[0]._id}, Price: ${validSessions[0].price}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkPrices();

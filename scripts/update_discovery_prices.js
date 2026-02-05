
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
  },
  { collection: 'discoverysessions' }
);

const DiscoverySession = mongoose.models.DiscoverySession || mongoose.model('DiscoverySession', DiscoverySessionSchema);

async function updatePrices() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await DiscoverySession.updateMany(
      { $or: [{ price: { $exists: false } }, { price: { $lte: 0 } }, { price: null }] },
      { $set: { price: 45 } } // Setting default price to $45
    );

    console.log(`Updated ${result.modifiedCount} sessions with default price $45.`);

  } catch (error) {
    console.error('Error updating prices:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updatePrices();

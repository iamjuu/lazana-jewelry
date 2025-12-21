import mongoose, { Schema, models, model, Document } from "mongoose";

export interface DiscoverySessionType extends Document {
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  format?: string;
  benefits?: string[];
  sessionType: "discovery";
  instructorName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  price?: number;
  totalSeats?: number;
  bookedSeats?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DiscoverySessionSchema = new Schema<DiscoverySessionType>(
  {
    title: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    videoUrl: { type: String },
    format: { type: String },
    benefits: { type: [String], default: [] },
    sessionType: { type: String, default: "discovery", immutable: true },
    instructorName: { type: String },
    date: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    duration: { type: Number },
    price: { type: Number },
    totalSeats: { type: Number, default: 1 },
    bookedSeats: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Delete the cached model if it exists to ensure fresh schema
if (models.DiscoverySession) {
  delete models.DiscoverySession;
}

export default model<DiscoverySessionType>("DiscoverySession", DiscoverySessionSchema);

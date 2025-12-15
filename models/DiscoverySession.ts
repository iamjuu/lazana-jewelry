import mongoose, { Schema, models, model, Document } from "mongoose";

export interface DiscoverySessionType extends Document {
  _id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  format?: string;
  benefits?: string[];
  sessionType: "discovery";
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
  },
  { timestamps: true }
);

// Delete the cached model if it exists to ensure fresh schema
if (models.DiscoverySession) {
  delete models.DiscoverySession;
}

export default model<DiscoverySessionType>("DiscoverySession", DiscoverySessionSchema);

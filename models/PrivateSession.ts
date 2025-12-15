import mongoose, { Schema, models, model, Document } from "mongoose";

export interface PrivateSessionType extends Document {
  _id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  format?: string;
  benefits?: string[];
  sessionType: "private";
  createdAt: Date;
  updatedAt: Date;
}

const PrivateSessionSchema = new Schema<PrivateSessionType>(
  {
    title: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    videoUrl: { type: String },
    format: { type: String },
    benefits: { type: [String], default: [] },
    sessionType: { type: String, default: "private", immutable: true },
  },
  { timestamps: true }
);

// Delete the cached model if it exists to ensure fresh schema
if (models.PrivateSession) {
  delete models.PrivateSession;
}

export default model<PrivateSessionType>("PrivateSession", PrivateSessionSchema);

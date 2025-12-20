import mongoose, { Schema, models, model, Document } from "mongoose";

export interface FreeStudioVisitType extends Document {
  _id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number; // Time in minutes
  sessionType: "freeStudioVisit";
  createdAt: Date;
  updatedAt: Date;
}

const FreeStudioVisitSchema = new Schema<FreeStudioVisitType>(
  {
    title: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    videoUrl: { type: String },
    duration: { type: Number }, // Time in minutes
    sessionType: { type: String, default: "freeStudioVisit", immutable: true },
  },
  { timestamps: true }
);

// Delete the cached model if it exists to ensure fresh schema
if (models.FreeStudioVisit) {
  delete models.FreeStudioVisit;
}

export default model<FreeStudioVisitType>("FreeStudioVisit", FreeStudioVisitSchema);


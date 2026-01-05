import mongoose, { Schema, models, model, Document } from "mongoose";

export interface SubscriberType extends Document {
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SubscriberSchema = new Schema<SubscriberType>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

// Delete the cached model if it exists to ensure fresh schema
if (models.Subscriber) {
  delete models.Subscriber;
}

export default model<SubscriberType>("Subscriber", SubscriberSchema);




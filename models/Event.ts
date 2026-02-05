import mongoose, { Schema, models, model } from "mongoose";

export interface EventType {
  name: string;
  title: string;
  location: string;
  day: string;
  time: string;
  date: string;
  endDate?: string;
  description: string;
  imageUrl?: string;
  totalSeats: number; // Total available slots
  bookedSeats: number; // Number of booked slots
  price: number; // Price per slot/booking
  createdAt?: Date;
  updatedAt?: Date;
}

const EventSchema = new Schema<EventType>(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    location: { type: String, required: true },
    day: { type: String, required: true },
    time: { type: String, required: true },
    date: { type: String, required: true },
    endDate: { type: String },
    description: { type: String, required: true },
    imageUrl: { type: String },
    totalSeats: { type: Number, required: true, default: 1 },
    bookedSeats: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

// Delete the cached model if it exists to ensure fresh schema
if (models.Event) {
  delete models.Event;
}

export default model<EventType>("Event", EventSchema);

import mongoose, { Schema, models, model } from "mongoose";

export interface SessionEnquiryType {
  _id: string;
  fullName: string;
  services: string;
  phone: string;
  email: string;
  comment?: string;
  status: "pending" | "contacted" | "completed";
  sessionType: "discovery" | "private" | "corporate" | "freeStudioVisit";
  sessionId?: string; // Reference to DiscoverySession or PrivateSession
  bookedDate?: string; // Date of the booked session (YYYY-MM-DD)
  bookedTime?: string; // Time of the booked session (HH:mm)
  // Corporate session specific fields
  companyName?: string;
  jobTitle?: string;
  workEmail?: string;
  cityCountry?: string;
  industry?: string;
  companySize?: string;
  enquiryTypes?: string[]; // Array of selected enquiry types
  preferredDates?: string;
  preferredLocation?: string;
  estimatedParticipants?: number;
  preferredDuration?: string;
  sessionObjectives?: string[]; // Array of selected objectives
  createdAt: Date;
  updatedAt: Date;
}

const SessionEnquirySchema = new Schema<SessionEnquiryType>(
  {
    fullName: { type: String, required: true },
    services: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    comment: { type: String },
    status: { 
      type: String, 
      enum: ["pending", "contacted", "completed"], 
      default: "pending" 
    },
    sessionType: { 
      type: String, 
      enum: ["discovery", "private", "corporate", "freeStudioVisit"], 
      default: "discovery" 
    },
    sessionId: { type: String }, // Reference to session
    bookedDate: { type: String }, // Date of booked session
    bookedTime: { type: String }, // Time of booked session
    // Corporate session specific fields
    companyName: { type: String },
    jobTitle: { type: String },
    workEmail: { type: String },
    cityCountry: { type: String },
    industry: { type: String },
    companySize: { type: String },
    enquiryTypes: { type: [String] }, // Array of selected enquiry types
    preferredDates: { type: String },
    preferredLocation: { type: String },
    estimatedParticipants: { type: Number },
    preferredDuration: { type: String },
    sessionObjectives: { type: [String] }, // Array of selected objectives
  },
  { timestamps: true }
);

// Delete the cached model if it exists to ensure fresh schema
if (models.SessionEnquiry) {
  delete models.SessionEnquiry;
}

export default model<SessionEnquiryType>("SessionEnquiry", SessionEnquirySchema);


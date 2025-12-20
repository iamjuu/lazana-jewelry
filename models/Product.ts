import mongoose, { Schema, models, model } from "mongoose";
import type { Product as ProductType } from "@/types";

const ProductSchema = new Schema<ProductType>(
  {
    name: { type: String, required: false }, // Optional for universal products, validated in API
    shortDescription: { type: String, required: false }, // Brief description
    description: { type: String, required: true }, // Long description
    category: { 
      type: Schema.Types.ObjectId, 
      ref: 'Category',
      required: false
    }, // Category reference (ObjectId)
    subcategory: { 
      type: Schema.Types.ObjectId, 
      ref: 'Subcategory',
      required: false
    }, // Subcategory reference (ObjectId)
    price: { type: Number, required: true },
    imageUrl: { type: [String], default: [] } as any, // Array of base64 image strings (max 3)
    videoUrl: { type: Schema.Types.Mixed, default: [] } as any, // Can be string or array of strings (max 2 videos)
    isSet: { type: Boolean, required: false, default: false }, // Checkbox field
    numberOfSets: { type: Number, required: false }, // Number of sets (only if isSet is true)
    newAddition: { type: Boolean, required: false, default: false }, // New addition checkbox
    featured: { type: Boolean, required: false, default: false }, // Featured checkbox
    tuning: { type: Number, required: false }, // Hz value like 20, 30 (number in Hz)
    relativeproduct: { type: Boolean, required: false, default: false }, // For universal products
    
    octave: { 
      type: String, 
      required: false, 
      enum: ['3rd octave', '4th octave'], 
      trim: true 
    }, // Dropdown: 3rd octave or 4th octave
    size: { type: String, required: false, trim: true }, // Size can be range like "5-6", "6-7", "7-8" (between) or single value like "8" (exact inches)
    weight: { 
      type: String, 
      required: false, 
      enum: ['less than 1kg', 'less than 6kg', 'between 1-3kg', '3-5kg'],
      trim: true 
    }, // Weight category
  },
  { timestamps: true }
);

// Clear the model if it exists to force recompilation with new schema
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

export default model<ProductType>("Product", ProductSchema);




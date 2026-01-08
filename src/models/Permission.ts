import mongoose, { Schema, models } from "mongoose";

const permissionSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true ,
      immutable: true
    },
    
    description: { type: String, required: true },
    
    // Grouping field (e.g., "Daily Noon Report")
   resourceId: { 
      type: Schema.Types.ObjectId, 
      ref: "Resource", 
      required: true 
    },

    status: {
      type: String,
     enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);
permissionSchema.index({ slug: 1 });


permissionSchema.index({ resourceId: 1 });


permissionSchema.index({ status: 1 });


permissionSchema.index({ createdAt: -1 });

permissionSchema.index({ resourceId: 1, status: 1 });
export default models.Permission || mongoose.model("Permission", permissionSchema);
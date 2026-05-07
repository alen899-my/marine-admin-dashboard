import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  title: string;
  description: string;
  applicationLink?: string;
  isAccepting: boolean;
  deadline?: Date | null;
  companyId: mongoose.Types.ObjectId;

  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    applicationLink: { type: String, default: "" },
    isAccepting: { type: Boolean, default: true },
    deadline: { type: Date, default: null },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);

import { Schema, model, Document } from "mongoose";

export interface ICK extends Document {
    username: string;
    ckValue: number;
}

const CKSchema = new Schema<ICK>({
    username: { type: String, required: true, unique: true },
    ckValue: { type: Number, default: 0 }
});

export default model<ICK>("CK", CKSchema);

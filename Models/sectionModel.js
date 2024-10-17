import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
    videoUrl: { type: String, required: true },
    videoTitle: { type: String, required: true },
    videoDescription: { type: String, required: true },
    status: { type: String, default: 'draft' },
}, {
    timestamps: true  
});

const sectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    videos: [videoSchema],  
}, {
    timestamps: true  
});

const Section = mongoose.model('Section', sectionSchema);

export default Section;

import mongoose from "mongoose";

const videoProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section.videos', required: true },  // Reference to the specific video
    lastWatched: { type: Number, default: 0 },  // Last watched timestamp in seconds
    completed: { type: Boolean, default: false },  // Whether the user has completed the video
    watchedPercentage: { type: Number, default: 0 }  // Percentage of video watched
}, {
    timestamps: true
});

const VideoProgress = mongoose.model('VideoProgress', videoProgressSchema);

export default VideoProgress;

import mongoose  from "mongoose";


 

const courseSchema =new mongoose.Schema({ 
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverImage:{type:String  },
    previewVideo:{type:String}, 
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    level: { type: String, required: true },
    price: { type: Number, required: true },
    published: { type: Boolean, default: false},
    isLive: { type: Boolean, default: false},
    liveStreamId: { type: String},
      liveStreamStatus: {
        type: String,
        enum: ['not_started', 'live', 'ended'],
        default: 'not_started', // Track the status of the live stream
      },
}, {
    timestamps: true,
})

const Course = mongoose.model('Course',courseSchema);

export default Course;
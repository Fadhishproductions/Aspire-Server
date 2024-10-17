import asyncHandler from 'express-async-handler';
import Revenue from '../Models/revenueModal.js';
import Course from '../Models/courseModel.js';
import User from '../Models/userModel.js'; // Assuming you have a User model for instructors


function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// Get revenue analysis for admin with instructor details
const getAdminRevenueAnalysis = asyncHandler(async (req, res) => {
  try {
    const { search = '', page = 1, limit = 5 } = req.query;
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 5;

    // First, get the total count of matching documents
    const totalResults = await Revenue.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      { $unwind: '$courseDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'courseDetails.instructor',
          foreignField: '_id',
          as: 'instructorDetails',
        },
      },
      { $unwind: '$instructorDetails' },
      {
        $match: {
          $or: [
            { 'courseDetails.title': searchRegex },
            { 'instructorDetails.name': searchRegex },
          ],
        },
      },
      {
        $count: 'totalCount', // Count the total number of matching documents
      },
    ]);

    const totalCount = totalResults.length > 0 ? totalResults[0].totalCount-1 : 0;
    const totalPages = Math.ceil(totalCount / limitNum);
    console.log("totalResults",totalResults)
    console.log(`Total Results: ${totalCount}, Total Pages: ${totalPages}, Current Page: ${pageNum}`);

    // Pagination logic debugging
    const skipValue = (pageNum - 1) * limitNum;
    console.log(`Applying pagination: skip ${skipValue}, limit ${limitNum}`);

    // Fetch paginated results
    const revenueAnalysis = await Revenue.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      { $unwind: '$courseDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'courseDetails.instructor',
          foreignField: '_id',
          as: 'instructorDetails',
        },
      },
      { $unwind: '$instructorDetails' },
      {
        $match: {
          $or: [
            { 'courseDetails.title': searchRegex },
            { 'instructorDetails.name': searchRegex },
          ],
        },
      },
      {
        $group: {
          _id: '$course',
          totalInstructorRevenue: { $sum: '$instructorShare' },
          totalAdminRevenue: { $sum: '$adminShare' },
          lastTransactionDate: { $max: '$date' },
          courseDetails: { $first: '$courseDetails' },
          instructorDetails: { $first: '$instructorDetails' },
        },
      },
      {
        $project: {
          courseName: '$courseDetails.title',
          instructorName: '$instructorDetails.name',
          totalInstructorRevenue: 1,
          totalAdminRevenue: 1,
          lastTransactionDate: 1,
        },
      },
      { $skip: skipValue }, // Apply pagination
      { $limit: limitNum }, // Apply limit
    ]);

    console.log(`Returned ${revenueAnalysis.length} results for page ${pageNum}`);

    res.status(200).json({
      revenueAnalysis,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error('Error fetching revenue analysis:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Helper function to get the aggregation based on granularity
const getAggregationByGranularity = (granularity) => {
  switch (granularity) {
    case 'day':
      return [
        {
          $group: {
            _id: {
              day: { $dayOfMonth: '$date' },
              month: { $month: '$date' },
              year: { $year: '$date' },
            },
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ];
    case 'month':
      return [
        {
          $group: {
            _id: {
              month: { $month: '$date' },
              year: { $year: '$date' },
            },
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ];
    case 'year':
      return [
        {
          $group: {
            _id: { year: { $year: '$date' } },
            totalRevenue: { $sum: '$totalAmount' },
          },
        },
      ];
    default:
      throw new Error('Invalid granularity');
  }
};

// API to get revenue growth over time
const getRevenueGrowth = asyncHandler(async (req, res) => {
  const { granularity = 'month' } = req.query; // Default to month if no granularity is provided

  try {
    const aggregationPipeline = getAggregationByGranularity(granularity);
    const revenueGrowth = await Revenue.aggregate(aggregationPipeline);

    res.status(200).json(revenueGrowth);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching revenue growth data', error });
  }
});

export { getAdminRevenueAnalysis , getRevenueGrowth };

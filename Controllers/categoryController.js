
import Category from '../Models/categorymodel.js';
import asyncHandler from 'express-async-handler'

const addcategory = asyncHandler(async(req,res)=>{
  
     const name = req.body.name.trim().charAt(0).toUpperCase() + req.body.name.trim().slice(1).toLowerCase();
     const description = req.body.description;
    const check = await Category.find({name});
    console.log(check)
    if(check.length===0)
    {
   const category =new Category({name:name,description:description});
   const categorydata =await category.save();
   res.status(201).json({message: "Category created"})
   }
  else{
   res.status(400);
   throw new Error("Catogory exists in this name")
  }

})

const getAllcategory =asyncHandler (async(req,res)=>{ 
 const categories =await Category.find();
 if(!categories){
   res.status(404);
   throw new Error("category not found")
 }
 console.log(categories,"categories")
 res.json(categories)
 })

 const publishedCategories =asyncHandler (async(req,res)=>{ 
  console.log("helllooooooooooooooooo")
  const categories = await Category.find({ isPublished: true });
  if (!categories || categories.length === 0) {
    res.status(404); 
    throw new Error("No published categories found");
  }
 console.log(categories,"categories")
 res.json(categories)
 })

 const getPaginatedCategoriesAdmin = asyncHandler(async (req, res) => {
  try {
    // Extract query parameters for pagination and search
    const { page = 1, limit = 5, search = '' } = req.query;

    // Set up the search filter for name or description based on the search query
    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // Get total count of categories that match the filter
    const totalCategories = await Category.countDocuments(searchFilter);

    // Get the paginated categories
    const categories = await Category.find(searchFilter)
      .limit(Number(limit)) // Set limit for pagination
      .skip((page - 1) * Number(limit)) // Skip documents for pagination
      .exec();

    // Check if categories are found
    if (!categories || categories.length === 0) {
      return res.status(404).json({ message: 'No categories found' });
    }

    // Send the response with categories and pagination data
    res.status(200).json({
      categories,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCategories / limit),
    });
  } catch (error) {
    console.error('Error fetching paginated categories:', error);

    // Check for specific error types and send appropriate messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid query parameters' });
    }

    // Default error handler
    res.status(500).json({
      message: 'Internal server error. Please try again later.',
    });
  }
});


const editCategory = asyncHandler(async (req, res) => {
   const { id } = req.params;
   let { name, description } = req.body;
   console.log(req.body,"req.body") 

   name = name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();

    console.log(name.charAt(0).toUpperCase(),"first letter")
    
   const category = await Category.findById(id);
   
   if (category) {

    const existingCategory = await Category.findOne({ name });
    if (existingCategory && existingCategory._id.toString() !== id) {
        res.status(400);
        throw new Error('Category name already exists');
    }

       category.name = name || category.name;
       category.description = description || category.description;

       const updatedCategory = await category.save();
       res.json({
           message: 'Category updated successfully',
           category: updatedCategory
       });
   } else {
       res.status(404);
       throw new Error('Category not found');
   }
});

const getCategoryById = asyncHandler(async (req, res) => {
   const { id } = req.params;
 
   try {
     const category = await Category.findById(id);
 
     if (category) {
       res.json(category);
     } else {
       res.status(404);
       throw new Error('Category not found');
     }
   } catch (error) {
     res.status(500);
     throw new Error('Server Error');
   }
 });

 const publishCategory = asyncHandler(async (req, res) => {

   const { categoryId } = req.params;
   try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    
    category.isPublished = !category.isPublished;

    await category.save();  
    return res.status(200).json({
      message: 'Category publish status updated',
      category
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
 });

 export {
    addcategory,
    getAllcategory,
    getPaginatedCategoriesAdmin,
    editCategory,
    getCategoryById,
    publishCategory,
    publishedCategories
 } 
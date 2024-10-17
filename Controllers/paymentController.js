import stripe from 'stripe';
import asyncHandler from 'express-async-handler';
import User from '../Models/userModel.js';
import Revenue from '../Models/revenueModal.js';
import Course from '../Models/courseModel.js';
const stripeInstance = stripe(process.env.STRIPE_SECRET);
const YOUR_DOMAIN = process.env.FRONTEND_DOMAIN; // Replace with your actual domain 

const createPaymentSession = asyncHandler(async (req, res) => {
  const { price, imageUrl, title, courseId } = req.body;
 
  try { 
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: title,
              images: [imageUrl],
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/enrolled-courses`,
      cancel_url: `${YOUR_DOMAIN}/canceled`,
      client_reference_id: req.user._id.toString(),
      metadata: {
        course_id: courseId,
      },
    });

     res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const webhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret =  'whsec_YttclpqISq1faEpbukPgUrkZ1Xdkh8eH'


  let event;

  try {
     
    event = stripeInstance.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
        console.log(event.data.object,"event.data.object")
        const session = event.data.object;
      const userId = session.client_reference_id;
      const courseId = session.metadata.course_id;

      if (userId && courseId) {
        try {
          await User.findByIdAndUpdate(userId, {
            $addToSet: { courses: courseId }
          });
          console.log(`Added course ${courseId} to user ${userId}`);
           
          

          // 2. Fetch course details and instructor for revenue calculation
          const course = await Course.findById(courseId).populate('instructor');
          if (!course) throw new Error('Course not found');

          const instructorId = course.instructor._id;
          const totalAmount = session.amount_total / 100; // Stripe uses the smallest currency unit (paise/cents)

          // 3. Calculate admin and instructor shares
          const adminShare = totalAmount * 0.10; // 10% to admin
          const instructorShare = totalAmount * 0.90; // 90% to instructor

          // 4. Save revenue in the Revenue model
          const newRevenue = new Revenue({
            course: courseId,
            instructor: instructorId,
            student: userId,
            totalAmount: totalAmount,
            adminShare: adminShare,
            instructorShare: instructorShare,
            status: 'completed',
          });

          await newRevenue.save();
          console.log(`Revenue recorded: Admin Share - ${adminShare}, Instructor Share - ${instructorShare}`);

        } catch (error) {
          console.error(`Error updating user with course ${courseId}:`, error);
        }
      }

      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export { createPaymentSession, webhook };

        const Razorpay = require('razorpay');

        // Initialize Razorpay instance with your Razorpay key ID and secret
        const razorpay = new Razorpay({
            key_id: 'rzp_test_l0JN45NspADoRo',
            key_secret: 'bRhaVuy5fdvjABsEcAPA71IX'
        });
        
        // Create Razorpay order
        async function createRazorpayOrder(amount) {
            try {
                const options = {
                    amount: amount * 100, // Amount in smallest currency unit (paisa for INR)
                    currency: 'INR',
                    receipt: 'order_rcptid_' + Date.now(), // Replace with your receipt ID logic
                    payment_capture: 1 // Auto-capture payment after order creation
                };
        
                const response = await razorpay.orders.create(options);
                return response;
            } catch (error) {
                console.error('Error creating Razorpay order:', error);
                throw error;
            }
        }
        
        module.exports = createRazorpayOrder;
        
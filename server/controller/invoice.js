const fs = require('fs');
const path = require('path');
const os = require('os');
const PDFDocument = require('pdfkit');
const Orderdb = require('../model/ordermodel');

exports.generateOrderInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Orderdb.findById(orderId)
      .populate('items.productId')
      .populate('shippingAddress');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const doc = new PDFDocument();
    const downloadsFolder = path.join(os.homedir(), 'Downloads'); 
    const filePath = path.join(downloadsFolder, `${orderId}.pdf`);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream); 

    doc.fontSize(24).text('LOOM & LACE', { align: 'center' }).moveDown(2);

    doc.fontSize(16).text('Order Invoice', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`).moveDown();
    doc.fontSize(12).text(`Order Date: ${order.orderedDate}`).moveDown();
    doc.fontSize(12).text(`Shipping Address: ${order.shippingAddress.name}, ${order.shippingAddress.address}, ${order.shippingAddress.locality}, ${order.shippingAddress.state}, ${order.shippingAddress.pincode}`).moveDown();
    doc.fontSize(12).text('Items:').moveDown();
    order.items.forEach(item => {
      doc.fontSize(13).text(`Product: ${item.productId.product_name}\nQuantity: ${item.quantity}\nPrice: Rs.${item.productId.price * item.quantity}`).moveDown();
    });
    doc.fontSize(14).text(`Total Amount: Rs.${order.totalAmount}`).moveDown();


    doc.fontSize(16).text('Thank You for Shopping at LOOM & LACE!', { align: 'center' }).moveDown(2);

    doc.end(); 

    stream.on('finish', () => {
      
      res.download(filePath, `${orderId}.pdf`, () => {
     
        fs.unlinkSync(filePath);
      });
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

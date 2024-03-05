const { query } = require('express');
const Categorydb =require('../model/categorymodel');
const Productdb =require('../model/productmodel');
const Cartdb =require('../model/cartmodel');
const multer = require('multer');
const sharp = require('sharp');
const path= require('path');
const Userdb = require('../model/model');
const Orderdb = require('../model/ordermodel');
const { startOfWeek, endOfWeek } = require('date-fns');
const ExcelJS = require('exceljs');  
const PDFDocument = require('pdfkit');

exports.monthlysales= async (req, res) => {
    try {
        // Query to get monthly sales data (grouping by the month of orderedDate)
        const monthlySalesData = await Orderdb.aggregate([
            {
                $group: {
                    _id: { $month: "$orderedDate" },
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);
        // Formatting data for chart
        const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const salesAmount = Array(12).fill(0); // Initialize with 0 sales for each month
        monthlySalesData.forEach(item => {
            salesAmount[item._id - 1] = item.totalAmount; // Update sales amount array with fetched data
        });
        res.json({ labels, salesAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
  };
  // Route to fetch sales data for the first chart
  exports.weeklysales=async (req, res) => {
    try {
      // Calculate start and end dates for the current week
      const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Assuming Monday is the start of the week
      const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
  
      // Query to get sales data per day for the current week
      const salesData = await Orderdb.aggregate([
        {
          $match: {
            orderedDate: { $gte: startDate, $lte: endDate } // Filter orders for the current week
          }
        },
        {
          $group: {
            _id: { $dayOfWeek: "$orderedDate" },
            totalSales: { $sum: 1 }
          }
        }
      ]);
  
      // Formatting data for chart
      const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const sales = [0, 0, 0, 0, 0, 0, 0]; // Initialize with 0 sales for each day
      salesData.forEach(item => {
        sales[item._id - 1] = item.totalSales; // Update sales array with fetched data
      });
  
      res.json({ labels, sales });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  exports.salesreport= async (req, res) => {
      res.render('salesreport')
  }


  exports.generatereport = async (req, res) => {
      try {
          const { filterType, startDate, endDate } = req.query;
  
          let salesData;
          let reportTitle;
  
          if (filterType === 'daily') {
              salesData = await getDailySales();
              reportTitle = 'Today';
          } else if (filterType === 'weekly') {
              salesData = await getWeeklySales();
              reportTitle = `This Week`;
          } else if (filterType === 'monthly') {
              salesData = await getMonthlySales();
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              reportTitle = monthNames[new Date().getMonth()]; // Use current month if no startDate provided
          } else if (filterType === 'yearly') {
              salesData = await getYearlySales();
              reportTitle = `Yearly Sales Report (${new Date().getFullYear()})`;
          } else if (filterType === 'custom') {
              if (!startDate || !endDate) {
                  throw new Error('Custom date range requires both start date and end date.');
              }
              salesData = await getCustomRangeSales(startDate, endDate);
              reportTitle = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
          }
  
          // Create a new PDF document
          const doc = new PDFDocument();
  
          // Set response headers
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
  
          // Pipe the PDF document to the response
          doc.pipe(res);
  
          // Add report title
          doc.fontSize(20).text(`LOOM & LACE`, { align: 'center' });
          doc.fontSize(18).text(`Sales Report (${reportTitle})`, { align: 'center' });
          doc.moveDown();
  
          // Add sales data
          salesData.forEach(({ date, totalSales, totalOrderAmount, totalDiscount }) => {
              doc.fontSize(14).text('Date: ' + date);
              doc.fontSize(12).text('Total Sales: ' + totalSales);
              doc.fontSize(12).text('Total Order Amount: Rs.' + totalOrderAmount);
              doc.fontSize(12).text('Total Discount: Rs.' + totalDiscount);
              doc.moveDown();
          });
  
          // Finalize the PDF document
          doc.end();
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Internal server error' });
      }
  };
  
// Add the following function for yearly sales data retrieval
async function getYearlySales() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    return await getOrderData(startOfYear, endOfYear);
}


  
  // Helper functions to retrieve sales data based on different filter types
  async function getDailySales() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return await getOrderData(startOfDay, endOfDay);
  }
  
  async function getWeeklySales() {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
    return await getOrderData(startOfWeek, endOfWeek);
  }
  
  async function getMonthlySales() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return await getOrderData(startOfMonth, endOfMonth);
  }
  
  async function getCustomRangeSales(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return await getOrderData(start, end);
  }
  
  async function getOrderData(startDate, endDate) {
    const orders = await Orderdb.find({
        orderedDate: { $gte: startDate, $lt: endDate }
    }).populate('items.productId');

    let totalSales = 0;
    let totalOrderAmount = 0;
    let totalDiscount = 0;

    orders.forEach(order => {
        totalSales += order.items.reduce((acc, item) => acc + item.quantity, 0);
        totalOrderAmount += order.totalAmount;
        order.items.forEach(item => {
            // Calculate product price after discount
            const productPrice = item.productId.price * item.quantity;
            const discountedPrice = productPrice * (1 - (item.productId.discount / 100));
            const discountAmount = productPrice - discountedPrice;
            totalDiscount += discountAmount;
        });
    });

    return [{
        date: startDate, // Assuming startDate represents the date of the report
        totalSales,
        totalOrderAmount,
        totalDiscount
    }];
}

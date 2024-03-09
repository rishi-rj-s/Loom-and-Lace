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

exports.salesdata = async (req, res) => {
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
                $unwind: "$items" // Unwind the items array to get separate documents for each item
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$orderedDate" }, // Group by day of the week
                    totalSales: { $sum: "$items.quantity" } // Sum up the quantity of each product sold per day
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

  exports.salesamountdata = async (req, res) => {
    try {
        const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); 
        const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        const weeklySalesAmountData = await Orderdb.aggregate([
            {
                $match: {
                    orderedDate: { $gte: startDate, $lte: endDate } 
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$orderedDate" }, // Group by day of the week
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);

        const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; 
        const salesAmount = Array(7).fill(0); 

        // Assign total sales amount for each day of the week
        weeklySalesAmountData.forEach(item => {
            salesAmount[item._id - 1] = item.totalAmount;
        });

        res.json({ labels, salesAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.monthlysalesdata = async (req, res) => {
    try {
        // Query to get monthly sales data (grouping by the month of orderedDate)
        const monthlySalesData = await Orderdb.aggregate([
            {
                $group: {
                    _id: { $month: "$orderedDate" },
                    totalSales: { $sum: 1 } // Counting the number of orders per month
                }
            }
        ]);
        // Formatting data for chart
        const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const sales = Array(12).fill(0); // Initialize with 0 sales for each month
        monthlySalesData.forEach(item => {
            sales[item._id - 1] = item.totalSales; // Update sales array with fetched data
        });
        res.json({ labels, sales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.monthlysalesamountdata = async (req, res) => {
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
}
exports.yearlysalesdata = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 4;

        // Query to get yearly sales data for the last 4 years along with the current year
        const yearlySalesData = await Orderdb.aggregate([
            {
                $match: {
                    orderedDate: { $gte: new Date(startYear, 0, 1) } // Start from January 1st of the start year
                }
            },
            {
                $group: {
                    _id: { $year: "$orderedDate" },
                    totalSales: { $sum: 1 } // Counting the number of orders per year
                }
            }
        ]);

        const labels = Array.from({ length: 5 }, (_, i) => startYear + i); // Generate labels for the last 4 years and the current year
        const sales = Array(5).fill(0); // Initialize with 0 sales for each year

        // Update sales data for each year
        yearlySalesData.forEach(item => {
            const index = item._id - startYear;
            if (index >= 0 && index < 5) {
                sales[index] = item.totalSales;
            }
        });

        res.json({ labels, sales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.yearlysalesamountdata = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 4;

        // Query to get yearly sales amount data for the last 4 years along with the current year
        const yearlySalesAmountData = await Orderdb.aggregate([
            {
                $match: {
                    orderedDate: { $gte: new Date(startYear, 0, 1) } // Start from January 1st of the start year
                }
            },
            {
                $group: {
                    _id: { $year: "$orderedDate" },
                    totalAmount: { $sum: "$totalAmount" } // Summing up total amount of orders per year
                }
            }
        ]);

        const labels = Array.from({ length: 5 }, (_, i) => startYear + i); // Generate labels for the last 4 years and the current year
        const salesAmount = Array(5).fill(0); // Initialize with 0 sales amount for each year

        // Update sales amount data for each year
        yearlySalesAmountData.forEach(item => {
            const index = item._id - startYear;
            if (index >= 0 && index < 5) {
                salesAmount[index] = item.totalAmount;
            }
        });

        res.json({ labels, salesAmount });
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
        const { filterType, startDate, endDate, reportType } = req.query;

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

        if (reportType === 'pdf') {
            generatePDFReport(res, reportTitle, salesData);
        } else if (reportType === 'excel') {
            generateExcelReport(res, reportTitle, salesData);
        } else {
            res.status(400).json({ message: 'Invalid report type' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

async function generatePDFReport(res, reportTitle, salesData) {
    try {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
        doc.pipe(res);
        doc.fontSize(20).text(`LOOM & LACE`, { align: 'center' });
        doc.fontSize(18).text(`Sales Report (${reportTitle})`, { align: 'center' });
        doc.moveDown();
        salesData.forEach(({ date, totalSales, totalOrderAmount, totalDiscount, totalCouponDiscount }) => {
            doc.fontSize(14).text('Date: ' + date);
            doc.fontSize(12).text('Total Sales: ' + totalSales);
            doc.fontSize(12).text('Total Order Amount: Rs.' + totalOrderAmount);
            doc.fontSize(12).text('Total Discount: Rs.' + totalDiscount);
            doc.fontSize(12).text('Total Coupon Discount : Rs.' + totalCouponDiscount);
            doc.moveDown();
        });
        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating PDF report' });
    }
}
async function generateExcelReport(res, reportTitle, salesData) {
  try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');
      worksheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Total Sales', key: 'totalSales', width: 15 },
          { header: 'Total Order Amount', key: 'totalOrderAmount', width: 20 },
          { header: 'Total Discount', key: 'totalDiscount', width: 15 },
          { header: 'Total Coupon Discount', key: 'totalCouponDiscount', width: 20 }
      ];
      worksheet.mergeCells('A1:E1');
      worksheet.getCell('A1').value = `LOOM & LACE (${reportTitle})`;
      worksheet.addRow(['Date', 'Total Sales', 'Total Order Amount', 'Total Discount', 'Total Coupon Discount']);
      salesData.forEach(({ date, totalSales, totalOrderAmount, totalDiscount, totalCouponDiscount }) => {
          worksheet.addRow({ date, totalSales, totalOrderAmount, totalDiscount, totalCouponDiscount });
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error generating Excel report' });
  }
}
  
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
    const orders = await Orderdb.find({ orderedDate: { $gte: startDate, $lt: endDate }}).populate('items.productId').populate('couponused'); // Populate the couponused field
    console.log(orders)

    let totalSales = 0;
    let totalOrderAmount = 0;
    let totalDiscount = 0;
    let totalCouponDiscount = 0;

    orders.forEach(order => {
        totalSales += order.items.reduce((acc, item) => acc + item.quantity, 0);
        totalOrderAmount += order.totalAmount;
        order.items.forEach(item => {
            const productPrice = item.productId.price * item.quantity;
            const discountedPrice = productPrice * (1 - (item.productId.discount / 100));
            const discountAmount = productPrice - discountedPrice;
            totalDiscount += discountAmount;
        });

        if (order.couponused) {
           
            totalCouponDiscount += order.couponused.discount;
        }
    });

    return [{
        date: startDate,
        totalSales,
        totalOrderAmount,
        totalDiscount,
        totalCouponDiscount
    }];
}

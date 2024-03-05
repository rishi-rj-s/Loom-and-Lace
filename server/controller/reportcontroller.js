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
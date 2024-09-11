const PROTO_PATH = "./restaurant.proto";
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const mongoose = require('mongoose');
require('dotenv').config();

const Menu = require('./models/Menu'); // Import the Menu model

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.error("Failed to connect to MongoDB", err);
    });


var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

var restaurantProto = grpc.loadPackageDefinition(packageDefinition);

// Create gRPC server
const server = new grpc.Server();

// Define gRPC service
server.addService(restaurantProto.RestaurantService.service, {
    // Get all menu items from MongoDB
    getAllMenu: async (_, callback) => {
        try {
            const menu = await Menu.find();
            callback(null, { menu });
        } catch (err) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Error retrieving menu"
            });
        }
    },

    // Get a specific menu item by ID
    get: async (call, callback) => {
        try {
            const menuItem = await Menu.findById(call.request.id);
            if (menuItem) {
                callback(null, menuItem);
            } else {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "Menu item not found"
                });
            }
        } catch (err) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Error retrieving menu item"
            });
        }
    },

    // Insert a new menu item into MongoDB
    insert: async (call, callback) => {
        try {
            const menuItem = new Menu({
                name: call.request.name,
                price: call.request.price
            });
            await menuItem.save();
            callback(null, menuItem);
        } catch (err) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Error inserting menu item"
            });
        }
    },

    // Update an existing menu item by ID
    update: async (call, callback) => {
        try {
            const menuItem = await Menu.findById(call.request.id);
            if (menuItem) {
                menuItem.name = call.request.name;
                menuItem.price = call.request.price;
                await menuItem.save();
                callback(null, menuItem);
            } else {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "Menu item not found"
                });
            }
        } catch (err) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Error updating menu item"
            });
        }
    },

    // Remove a menu item by ID from MongoDB
    remove: async (call, callback) => {
        try {
            const menuItem = await Menu.findByIdAndDelete(call.request.id);
            if (menuItem) {
                callback(null, {});
            } else {
                callback({
                    code: grpc.status.NOT_FOUND,
                    details: "Menu item not found"
                });
            }
        } catch (err) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Error deleting menu item"
            });
        }
    }
});

// Bind and start the server
server.bindAsync("127.0.0.1:30043", grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log("Server running at http://127.0.0.1:30043");
});

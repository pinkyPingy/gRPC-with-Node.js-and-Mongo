const mongoose = require('mongoose');

// Define the schema for the Menu
const MenuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
});

// Create the model from the schema and export it
const Menu = mongoose.model('Menu', MenuSchema);

module.exports = Menu;

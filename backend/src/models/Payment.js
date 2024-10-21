const { default: mongoose } = require("mongoose");
const Product = require("./Product");

const paymentSchema = mongoose.Schema(
    {
        user: {
            type: Object,
        },
        data: {
            type: Array,
            default: [],
        },
        Product: {
            type: Array,
            default: [],
        },
    },
    { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;

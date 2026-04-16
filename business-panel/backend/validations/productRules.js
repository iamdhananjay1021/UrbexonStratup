// validations/productRules.js

export const createProductRules = {
    name: { required: true, type: "string", minLength: 2, maxLength: 120 },
    price: { required: true, type: "number", min: 1 },
    category: { required: true, type: "string" },
    brand: { type: "string", maxLength: 50 },
    stock: { type: "number", min: 0 },
    tags: { type: "array" },
    isFeatured: { type: "boolean" },
    isDeal: { type: "boolean" },
};
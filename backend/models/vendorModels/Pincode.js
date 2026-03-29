import mongoose from "mongoose";

const waitlistEntrySchema = new mongoose.Schema(
    {
        name: { type: String, trim: true },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: { type: String, trim: true },
    },
    { timestamps: true, _id: false }
);

const pincodeSchema = new mongoose.Schema(
    {
        // ── Core ─────────────────────────────────────────────
        code: {
            type: String,
            required: [true, "Pincode is required"],
            unique: true,
            trim: true,
            match: [/^\d{6}$/, "Pincode must be exactly 6 digits"],
            index: true,
        },
        status: {
            type: String,
            enum: ["active", "coming_soon", "blocked"],
            default: "coming_soon",
            index: true,
        },

        // ── Location Info ────────────────────────────────────
        area: { type: String, trim: true },
        city: { type: String, trim: true, index: true },
        district: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, default: "India" },

        // ── Geo Coordinates ──────────────────────────────────
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: undefined,
            },
        },

        // ── Assigned Vendors ─────────────────────────────────
        assignedVendors: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Vendor",
            },
        ],

        // ── Launch Info ──────────────────────────────────────
        expectedLaunchDate: { type: Date, default: null },
        launchedAt: { type: Date, default: null },

        // ── Waitlist ─────────────────────────────────────────
        waitlist: [waitlistEntrySchema],
        waitlistCount: { type: Number, default: 0 },

        // ── Stats ─────────────────────────────────────────────
        totalOrders: { type: Number, default: 0 },
        isServicable: { type: Boolean, default: false },

        // ── Admin Meta ───────────────────────────────────────
        note: { type: String, trim: true },
        priority: { type: Number, default: 0, index: true },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ── Indexes ──────────────────────────────────────────────────
pincodeSchema.index({ location: "2dsphere" });
pincodeSchema.index({ status: 1, priority: -1 });

// ── Virtual: waitlist emails for notification ─────────────────
pincodeSchema.virtual("waitlistEmails").get(function () {
    return this.waitlist.map((w) => w.email);
});

// ── Pre-save: sync isServicable with status ──────────────────
pincodeSchema.pre("save", function (next) {
    this.isServicable = this.status === "active";
    if (this.status === "active" && !this.launchedAt) {
        this.launchedAt = new Date();
    }
    next();
});

// ── Static: get all active pincodes (for frontend dropdown) ──
pincodeSchema.statics.getActiveCodes = function () {
    return this.find({ status: "active" }).select("code area city").lean();
};

const Pincode = mongoose.model("Pincode", pincodeSchema);
export default Pincode;

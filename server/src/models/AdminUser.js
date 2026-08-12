import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required."],
      trim: true,
      minlength: [2, "Admin name must contain at least 2 characters."],
      maxlength: [100, "Admin name cannot exceed 100 characters."],
    },

    email: {
      type: String,
      required: [true, "Admin email is required."],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [150, "Admin email cannot exceed 150 characters."],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address.",
      ],
      index: true,
    },

    password: {
      type: String,
      required: [true, "Admin password is required."],
      minlength: [8, "Admin password must contain at least 8 characters."],
      maxlength: [128, "Admin password cannot exceed 128 characters."],
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ["super-admin", "admin", "editor"],
        message: "Invalid admin role.",
      },
      default: "admin",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    failedLoginAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "admin_users",
  },
);

adminUserSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
});

adminUserSchema.methods.comparePassword = async function comparePassword(
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminUserSchema.methods.isAccountLocked = function isAccountLocked() {
  return Boolean(this.lockUntil && this.lockUntil > new Date());
};

adminUserSchema.methods.registerFailedLogin =
  async function registerFailedLogin() {
    const maximumAttempts = 5;
    const lockDurationInMinutes = 15;
    const now = new Date();
    const nextLockUntil =
      new Date(
        now.getTime() +
          lockDurationInMinutes *
            60 *
            1000,
      );

    /*
     * This update is atomic so concurrent failed-login
     * requests cannot create multiple "new lock"
     * transitions from the same stale document state.
     *
     * An already-active lock is not extended here.
     */
    const updatedAdmin =
      await this.constructor
        .findOneAndUpdate(
          {
            _id: this._id,
            $or: [
              {
                lockUntil: null,
              },
              {
                lockUntil: {
                  $lte: now,
                },
              },
            ],
          },
          [
            {
              $set: {
                failedLoginAttempts: {
                  $add: [
                    {
                      $ifNull: [
                        "$failedLoginAttempts",
                        0,
                      ],
                    },
                    1,
                  ],
                },
              },
            },
            {
              $set: {
                lockUntil: {
                  $cond: [
                    {
                      $gte: [
                        "$failedLoginAttempts",
                        maximumAttempts,
                      ],
                    },
                    nextLockUntil,
                    "$lockUntil",
                  ],
                },
              },
            },
          ],
          {
            new: true,
          },
        )
        .select(
          "_id failedLoginAttempts lockUntil",
        );

    if (!updatedAdmin) {
      const currentAdmin =
        await this.constructor
          .findById(this._id)
          .select(
            "_id failedLoginAttempts lockUntil",
          );

      if (currentAdmin) {
        this.failedLoginAttempts =
          currentAdmin.failedLoginAttempts;
        this.lockUntil =
          currentAdmin.lockUntil;
      }

      return {
        lockedNow: false,
        isLocked:
          this.isAccountLocked(),
      };
    }

    this.failedLoginAttempts =
      updatedAdmin.failedLoginAttempts;
    this.lockUntil =
      updatedAdmin.lockUntil;

    const lockedNow = Boolean(
      updatedAdmin.lockUntil &&
        updatedAdmin.lockUntil >
          now &&
        updatedAdmin.failedLoginAttempts >=
          maximumAttempts,
    );

    return {
      lockedNow,
      isLocked:
        this.isAccountLocked(),
    };
  };

adminUserSchema.methods.registerSuccessfulLogin =
  async function registerSuccessfulLogin() {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    this.lastLoginAt = new Date();

    await this.save({
      validateBeforeSave: false,
    });
  };

adminUserSchema.index({
  email: 1,
  isActive: 1,
});

const AdminUser = mongoose.model("AdminUser", adminUserSchema);

export default AdminUser;

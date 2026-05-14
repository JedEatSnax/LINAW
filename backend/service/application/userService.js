const userDao = require("../../dao/userDao");
const { userSchema } = require("../../validators/user");
const AppError = require("../../utils/AppError");
const disposableService = require("./disposableEmailService");
const logger = require("../../utils/logger");
const db = require("../../db/db");

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.details = details;
  }
}

class UserService {
  constructor() {
    this.schemas = userSchema;
  }

  async createDefaultTenant(user_email) {
    const baseName = (user_email || 'tenant').split('@')[0];
    const tenantName = `${baseName}-tenant`;

    const [tenant] = await db('tenants')
      .insert({ tenant_name: tenantName })
      .returning(['tenant_id']);

    return tenant.tenant_id;
  }

  validate(schemaKey, data) {
    const schema = this.schemas[schemaKey];

    if (!schema) {
      throw new Error(`Validation schema not found for key: ${schemaKey}`);
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new ValidationError(
        "Validation failed",
        error.details.map((d) => ({
          field: (d.context && (d.context.label || (d.path && d.path[0]))) || null,
          message: d.message,
        }))
      );
    }

    return value;
  }

  async signup(body) {
    const validated = this.validate("signupSchema", { body });
    const { email } = validated.body;

    let disposableCheck = null;
    try {
      disposableCheck = await disposableService.checkEmail(email);
    } catch (err) {
      logger.warn("Disposable email check failed", {
        message: err?.message || String(err),
      });
    }

    if (disposableCheck?.is_disposable) {
      throw new AppError(
        "Disposable email addresses are not allowed",
        400,
        "DISPOSABLE_EMAIL_NOT_ALLOWED"
      );
    }

    const existingByEmail = await userDao.findUserByEmail(email);
    if (existingByEmail) {
      throw new AppError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
    }

    const tenant_id = await this.createDefaultTenant(email);

    return {
      email,
      tenant_id,
      message: "Signup request accepted",
    };
  }

  async syncAuthenticatedUser({ email, firebase_uid, tenant_id = null }) {
    if (!firebase_uid) {
      throw new AppError("User not authenticated", 401, "UNAUTHORIZED");
    }

    if (!email) {
      throw new AppError("Email is required", 400, "EMAIL_REQUIRED");
    }

    const existingByFirebaseUid = await userDao.findByFirebaseUid(firebase_uid);
      if (existingByFirebaseUid) {
        return {
          created: false,
          user: existingByFirebaseUid,
        };
      }

    const existingByEmail = await userDao.findUserByEmail(email);
      if (existingByEmail) {
        throw new AppError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
      }

    const createdUser = await userDao.signup({
      email,
      firebase_uid,
      tenant_id,
    });

    return {
      created: true,
      user: createdUser,
    };
  }

  async login(email, user = {}) {
    // validate email format via existing schema
    this.validate("loginSchema", { body: { email } });

    const userRow = await userDao.login({
      email,
      firebase_uid: user?.uid,
    });

    return userRow;
  }
}

module.exports = new UserService();
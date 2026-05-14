const db = require("../db/db");
const AppError = require("../utils/AppError");

class UserDao {
  async signup(data) {
    try {
      const { email, firebase_uid, tenant_id } = data;

      const insertObj = {
        user_email: email,
        firebase_uid,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      };

      if (tenant_id) insertObj.tenant_id = tenant_id;

      const [user] = await db("users")
        .insert(insertObj)
        .returning([
          "user_id",
          "user_email",
          "firebase_uid",
          "tenant_id",
          "created_at",
          "updated_at",
        ]);

      return user;
    } catch (err) {
      if (err.code === "23505") {
        throw new AppError("Email already exists", 409, "EMAIL_ALREADY_EXISTS");
      }
      throw err;
    }
  }

  async login(data) {
    try {
      const { email } = data;

      const user = await db("users")
        .where("user_email", email)
        .select("user_id", "user_email", "tenant_id", "created_at", "updated_at")
        .first();

      return user || null;
    } catch (err) {
      console.error("DAO login error:", err);
      throw err;
    }
  }

  async findByFirebaseUid(firebase_uid) {
    const user = await db("users")
      .where({ firebase_uid })
      .select("user_id", "user_email", "firebase_uid", "tenant_id", "created_at", "updated_at")
      .first();

    return user || null;
  }

  async findUserByEmail(email) {
    const user = await db("users")
      .where("user_email", email)
      .select("user_id", "user_email", "firebase_uid", "tenant_id", "created_at", "updated_at")
      .first();

    return user || null;
  }

  async findById(user_id) {
    const user = await db("users")
      .where({ user_id })
      .select("user_id", "user_email", "firebase_uid", "tenant_id", "created_at", "updated_at")
      .first();

    return user || null;
  }
}

module.exports = new UserDao();
const db = require('../db/db')
const knex = require('../db/knex');


class userDao {
    async signup (userData) {
        try {
            const { email, firebase_uid } = userData;
            const [users] = await db('users')
            .insert ({
                email: email,
                firebase_uid: firebase_uid,
            })
            .returning (['user_id', 'username']);
            console.log('Inserted users row:', users);

        return users;
        } catch (err) {
            if (err.code == "23505") throw Error("EMAIL_ALREADY_EXISTS")
            throw err
        }
    }

    async login (loginData) {
        try {
            const { email, firebase_uid } = loginData
    
            const users = await db('users')
                .where({ 'firebase_uid': firebase_uid }) 
                .orWhere('email', email)
                .select('user_id', 'email')
                .first()
    
            return users ? users.email : null;
        } catch (err) {
            console.error('DAO login error:', err);
            throw err;
        }
    }

    async findByFirebaseUid(firebase_uid) {
        const users = await knex('users')
            .where ({ 'firebase_uid': firebase_uid })
            .select('firebase_uid')
            .first();
        return users || null;
    }

    async findUserByEmail(email) {
        const user = await knex('users')
            .where ({ 'email': email })
            .select('user_id', 'email', 'username')
            .first();
        return user || null;
    }
}

module.exports = new userDao();






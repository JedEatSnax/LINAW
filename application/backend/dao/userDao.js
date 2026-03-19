const db = require('../db/db')

class userDao {
    async signup (userData) {
        try {
            const { email, firebase_uid } = userData;
            const [user] = await db('user')
            .insert ({
                email,
                firebase_uid: firebase_uid,
            })
            .returning (['id', 'username']);
            console.log('Inserted user row:', user);

        return user;
        } catch (err) {
            if (err.code == "23505") throw Error("EMAIL_ALREADY_EXISTS")
            throw err
        }
    }

    async login (loginData) {
        try {
            const { email, firebase_uid } = loginData
    
            const user = await db('user')
                .where({ firebase_uid }) 
                .orWhere('email', email)
                .select('id', 'email')
                .first()
    
            return user ? user.email : null;
        } catch (err) {
            console.error('DAO login error:', err);
            throw err;
        }
    }

    async findByFirebaseUid(firebase_uid) {
        const user = await knex('users')
            .where ({ firebase_uid })
            .select('firebase_uid')
            .first();
        return user || null;
    }


}

module.exports = new userDao();






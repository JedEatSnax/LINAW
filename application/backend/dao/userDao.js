const db = require('../db/db')

class userDao {
    async signup (userData) {
        try {
            const { email, firebaseUID } = userData;
            const [user] = await db('users')
            .insert ({
                email,
                firebaseUID: firebaseUID,
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
            const { email, firebaseUID } = loginData
    
            const user = await db('users')
                .where({ firebaseUID }) 
                .orWhere('email', email)
                .select('id', 'email')
                .first()
    
            return user ? user.email : null;
        } catch (err) {
            console.error('DAO login error:', err);
            throw err;
        }
    }

    // async findUserByEmail(email) {
    //     const user = await knex('users')
    //         .where ({ email })
    //         .select('id', 'email', 'username')
    //         .first();
    //     return user || null;
    // }


}

module.exports = new userDao();






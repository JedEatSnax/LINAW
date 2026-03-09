const db = require('../db/db')
const knex = require('../db/knex');

class userDao {
    async signup (userData) {
        try {
            const { email, username, firebaseUID } = userData;
            console.log('DAO.signup called with:', { email, username, firebaseUID });
            const [user] = await db('users')
            .insert ({
                email,
                username: username,
                firebaseUID: firebaseUID,
            })
            .returning (['id', 'username']);
            console.log('Inserted user row:', user);

        return user;
        } catch (err) {
            if (err.code == "23505") throw Error("EMAIL_ALREADY_EXISTS")
        }
    }

    async login (email, firebaseUID) {
        let query = knex('user').where('email', email)
        if (firebaseUID) query.andWhere('firebaseUID', firebaseUID)
            .where ({ email, firebaseUID })
            .select('id', 'email', 'username')
            .first();
        return user
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






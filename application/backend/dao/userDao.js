const db = require('../db/db')
<<<<<<< HEAD
=======
const knex = require('../db/knex');
>>>>>>> 5fa4339 (refactors the old database implementation to postgres docker)

class userDao {
    async signup (userData) {
        try {
<<<<<<< HEAD
            const { email, firebase_uid } = userData;
            const [users] = await db('users')
            .insert ({
                email,
                firebase_uid: firebase_uid,
            })
            .returning (['id', 'username']);
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
                .where({ firebase_uid }) 
                .orWhere('email', email)
                .select('id', 'email')
                .first()
    
            return users ? users.email : null;
        } catch (err) {
            console.error('DAO login error:', err);
            throw err;
        }
    }

    async findByFirebaseUid(firebase_uid) {
        const users = await knex('users')
            .where ({ firebase_uid })
            .select('firebase_uid')
            .first();
        return users || null;
    }

=======
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

>>>>>>> 5fa4339 (refactors the old database implementation to postgres docker)

}

module.exports = new userDao();






const db = require('../db/db')

class networkDao {

       async networkCreation (networkData){
        try {
            const {name} = networkData

            const [network] = await db('network')
            .insert({
                name
            })
            .returning(['network_id', 'name'])
            console.log("Inserted network row: ", network)
        
        return network
        } catch (error) {
            if (error.code == "23505") throw Error("Orgnization with that name exist")
            throw error
        }
    }

    async organizationCreation (organizationData){
        try {
            const { organization_name, network_id, users_id } = organizationData;
            const [ ornaization] = await db('organization')
            .insert({
                organization_name,
                network_id,
                users_id
            })
            .returning(['organization_id', 'organization_name'])
            console.log('Inserted ornganization row: ', ornaization)
        
        return ornaization;
        } catch (error) {
            if (error.code == "23505") throw Error("Name already exist")
            throw error
        }
    }


    async networkMemberAddition (networkMemberData){
        try {
            const { name, email, role } = networkMemberData
            const [network_member] = await db('network_members')
            .insert({
                name,
                email,
                role
            })
            .returning(['member_name', 'member_email', 'role'])
            console.log("Inserted member in row: ", network_member)

        return network_member
        } catch (error) {
            if(error.code == "23505") throw Error('users is already a member')
            throw error
        }
    }

}

module.exports = new networkDao();
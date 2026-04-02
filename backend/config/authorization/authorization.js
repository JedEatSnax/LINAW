const role = require('./roles')
const permission = require('./permissions')

const authorization = Object.freeze({
    [role.USER]: [
        permission.CREATE_NETWORK,
        permission.CREATE_ORGANIZATION,
        permission.ADD_ORGANIZATION,
        permission.CREATE_CHANNEL,
        permission.ADD_MEMBER
    ],

    [role.NETWORK_ADMIN]: [
        permission.MANAGE_NETWORK,
        permission.CREATE_ORGANIZATION,
        permission.ADD_ORGANIZATION,
        permission.CREATE_CHANNEL,
        
    ],

    [role.ORGANIZATION_ADMIN]: [
        permission.ADD_MEMBER,
        permission.CREATE_CHANNEL
    ],

    [role.CHANNEL_ADMIN]: [],

    [role.NODE_ADMIN]: [],

    [role.MEMBER]: [
        permission.VIEW_CHANNEL,
        permission.SUBMIT_TRANSACTION
    ]

})

module.exports = authorization
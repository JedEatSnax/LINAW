const permission = Object.freeze({

    CREATE_NETWORK: 'create_network',
    MANAGE_NETWORK: 'manage_network',

    CREATE_ORGANIZATION: 'create_organization',
    ADD_ORGANIZATION: 'add_organization',
    MANAGE_ORGANIZATION: 'manage_organization',
    MANAGE_NODE: 'manage_node',

    CREATE_CHANNEL: 'create_channel',
    MANAGE_CHANNEL: 'manage_channel',
    JOIN_CHANNEL: 'join_channel',


    ADD_MEMBER: 'add_member',
    VIEW_CHANNEL: 'view_channel',
    CREATE_ASSET: 'create_asset',
    DELETE_ASSET: 'delete_asset',
    UPDATE_ASSET: 'update_asset',
    TRANSFER_ASSET: 'transfer_asset',
    READ_ASSET: 'read_asset',
    READ_ALL_ASSETS: 'read_all_assets',

    DELETE_NETWORK: 'delete_network',
    DELETE_ORGANIZATION: 'delete_organization',
    REMOVE_ORGANIZATION: 'remove_organization',
    DELETE_CHANNEL: 'delete_channel',
    LEAVE_CHANNEL: 'leave_channel',
    DELETE_NODE: 'delete_node',
    REMOVE_MEMBER: 'remove_member',
    REMOVE_NETWORK_ADMIN: 'remove_network_admin',
    REMOVE_ORGANIZATION_ADMIN: 'remove_organization_admin',
    REMOVE_CHANNEL_ADMIN: 'remove_channel_admin',

})

module.exports = permission
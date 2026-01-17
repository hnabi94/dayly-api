const getKnexInstance = require('../db/knex');

const addUser = async user => {
    const knex = await getKnexInstance();
    return await knex('users').insert(user);
};

const retrieveEmail = async username => {
    const knex = await getKnexInstance();
    const result = await knex('users')
        .select('email')
        .where('username', username)
        .first();

    return result;
};

const searchUsers = async query => {
    const knex = await getKnexInstance();

    return await knex('users')
        .select('id', 'username')
        .whereILike('username', `%${query}%`)
        .limit(10);
};

const getUserInfo = async userId => {
    const knex = await getKnexInstance()

    return await knex('users')
                 .select('id', 'username', 'followers_count', 'following_count')
                 .where('id', userId)
                 .first()
}

const followUser = async (followerId, followedId) => {
    const knex = await getKnexInstance();

    await knex.transaction(async trx => {
        const result = await trx('follows')
            .insert({ follower_id: followerId, followed_id: followedId })
            .onConflict(['follower_id', 'followed_id'])
            .ignore();

        if (result.rowCount > 0) {
            await trx('users').where('id', followerId).increment('following_count', 1);
            await trx('users').where('id', followedId).increment('followers_count', 1);
        }
    });
};

const unfollowUser = async (followerId, unfollowedId) => {
    const knex = await getKnexInstance();

    await knex.transaction(async trx => {
        const numOfDeletedRows = await trx('follows')
            .where({ follower_id: followerId, followed_id: unfollowedId })
            .del();

        if (numOfDeletedRows > 0) {
            await trx('users').where('id', followerId).decrement('following_count', 1);
            await trx('users').where('id', unfollowedId).decrement('followers_count', 1);
        }
    });
}

const checkIfFollowing = async (followerId, followingId) => {
    const knex = await getKnexInstance();

    return await knex('follows')
                 .select('follower_id')
                 .where({ follower_id: followerId, followed_id: followingId });
}

const getFollowers = async (userId) => {
    const knex = await getKnexInstance();

    return await knex
                 .select('id', 'username')
                 .from('follows')
                 .join('users', 'follows.follower_id', '=', 'users.id')
                 .where('followed_id', userId)
}

const getFollowing = async (userId) => {
    const knex = await getKnexInstance();

    return await knex
                .select('id', 'username')
                .from('follows')
                .join('users', 'follows.followed_id', '=', 'users.id')
                .where('follower_id', userId)

}

module.exports = { addUser, retrieveEmail, searchUsers, followUser, unfollowUser, 
                   checkIfFollowing, getFollowers, getFollowing, getUserInfo };
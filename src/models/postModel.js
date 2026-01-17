const getKnexInstance = require('../db/knex');
const path = require('path');
const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
    keyFilename: path.join(__dirname, "../../config/gcs-service-account-key.json")
});
const bucketName = "socialmediaapp_imagebucket";
const bucket = storage.bucket(bucketName);


const createPostWithFeedEntriesAndImage = async (userId, imageFile) => {
    const knex = await getKnexInstance();

    return await knex.transaction(async (trx) => {
        const fileName = `${userId}/${imageFile.originalname}`;

        //Retrieve username
        const user = await trx('users')
            .select('username')
            .where('id', userId)
            .first();
        
        //Insert the new post
        const [newPostId] = await trx('posts')
            .insert({
                user_id: userId,
                username: user.username,
                content: fileName,
                created_at: new Date()
            })
            .returning('post_id');

        //Retrieve followers
        const followers = await trx('follows')
            .where({ followed_id: userId })
            .select('follower_id');

        //Insert feed entries for each follower
        if (followers.length > 0) {
            const feedEntries = followers.map((follower) => ({
                user_id: follower.follower_id,
                post_id: newPostId.post_id,
                created_at: new Date()
            }));
            await trx('feeds').insert(feedEntries)
        }

        await uploadImage(fileName, imageFile);

        return newPostId;
    });
}

async function uploadImage(fileName, imageFile) {
    return new Promise((resolve, reject) => {
        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: imageFile.mimetype
            }
        });

        blobStream.on("error", (err) => {
            reject(err);
        });

        blobStream.on("finish", () => {
            resolve();
        });

        blobStream.end(imageFile.buffer);
    });
}

const getPosts = async (userId) => {
    const knex = await getKnexInstance();

    return await knex('feeds as f')
        .join('posts as p', 'f.post_id', 'p.post_id')
        .select('p.post_id', 'p.user_id as author_id', 'p.username as author', 'p.content', 'p.created_at', 'p.num_likes', 'p.num_comments')
        .where('f.user_id', userId)
        .orderBy('p.created_at', 'desc');
}

const likePost = async (userId, postId) => {
    const knex = await getKnexInstance();

    return await knex.transaction(async (trx) => {
        const result = await trx('likes')
            .insert({
                user_id: userId,
                likeable_id: postId,
                likeable_type: 'post',
                created_at: new Date()
            });
        
        await trx('posts').where('post_id', postId).increment('num_likes', 1)

        return result
    });
}

const unlikePost = async (userId, postId) => {
    const knex = await getKnexInstance();

    return await knex.transaction(async (trx) => {
        const numOfDeletedRows = await trx('likes')
            .where({ user_id: userId, likeable_id: postId, likeable_type: 'post' })
            .del();
        
        await trx('posts').where('post_id', postId).decrement('num_likes', 1);

        return numOfDeletedRows;
    });
}

const addComment = async (comment) => {
    const knex = await getKnexInstance();

    return await knex.transaction(async (trx) => {
        const [newCommentId] =  await trx('comments').insert(comment).returning('comment_id');
        await trx('posts').where('post_id', comment.post_id).increment('num_comments', 1); //increment comments counter in posts table
        return newCommentId;
    });
}

const getComments = async (postId) => {
    const knex = await getKnexInstance();

    return await knex('comments')
        .select('comment_id', 'username', 'comment', 'created_at')
        .where('post_id', postId);
}

module.exports = { createPostWithFeedEntriesAndImage, getPosts, addComment, getComments, likePost, unlikePost }
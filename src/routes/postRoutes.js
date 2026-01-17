const express = require('express');
const multer = require('multer');
const { createPostWithFeedEntriesAndImage, getPosts, addComment, getComments, likePost, unlikePost } = require('../models/postModel');
const { Storage } = require("@google-cloud/storage");
const path = require('path');

const router = express.Router();
var jsonParser = express.json()

const storage = new Storage({
    keyFilename: path.join(__dirname, "../../config/gcs-service-account-key.json")
});
const bucketName = "socialmediaapp_imagebucket";
const bucket = storage.bucket(bucketName);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.post("/post", upload.single("file"), async (req, res) => {
    const userId = req.user.user_id;
    const imageData = req.file;

    if(!userId || !imageData) {
        console.error('Invalid request');
        return res.status(400).send({ error: 'Invalid request' });
    }
    try {
        const newPostId = await createPostWithFeedEntriesAndImage(userId, imageData);
        return res.status(201).json(newPostId); //newPostId is object with postId: { 'post_id': 1 }
    } catch(error) {
        console.error('Error creating post: ', error);
        res.status(500).json({ error: 'Failed to create post.'});
    }
});

router.get("/feed", async (req, res) => {
    const userId = req.user.user_id;

    try {
        const posts = await getPosts(userId);
        res.status(200).json(posts);
    } catch(error) {
        console.error('Error retrieving posts: ', error);
        res.status(500).json({ error: 'Failed to retrieve posts'});
    }
});

router.get('/download-image', async (req, res) =>{
    const fileName = req.query.file

    if(!fileName) {
        console.error('Invalid request: empty query');
        res.status(400).send({ error: 'Invalid request' });
        return
    }

  // TODO: Add additional authorization checks
  // For example, check if req.user.user_id is allowed to see this file

    try {
        const file = bucket.file(fileName);
        const [exists] = await file.exists();
        if(!exists) {
            res.status(400).json({ error: 'File not found'} );
            return
        }

        const [fileData] = await file.download();

        res.setHeader('Content-Type', 'image/jpeg');
        
        res.send(fileData);
    } catch(error) {
        console.error('Error fetching image file: ', error);
        res.status(500).json({ error: 'Error fetching image file'} );
    }
});

router.post('/comment', jsonParser, async (req, res) =>{
    const userId = req.user.user_id;
    const { postId, username, comment } = req.body;

    if(!postId || !username || !comment) {
        console.error('Invalid request');
        return res.status(400).send({ error: 'Invalid request' });
    }

    const commentToCreateDb = {
        user_id: userId,
        post_id: postId,
        username: username,
        comment: comment,
        created_at: new Date()
    };

    try { 
        const commentId = await addComment(commentToCreateDb);
        return res.status(201).json(commentId)
    } catch(error) {
        console.error('Error creating comment: ', error);
        res.status(500).json({ error: 'Error adding comment'} );
    }
});

router.get('/comments', async (req, res) => {
    const postId = req.query.post_id;
    
    if (!postId) {
        console.error('Invalid request: empty query');
        res.status(400).send({ error: 'Invalid request' });
        return
    }

    try {
        const comments = await getComments(postId)
        res.status(200).json(comments)
    } catch(error) {
        console.error('Error retrieving comments: ', error);
        res.status(500).json({ error: 'Error retrieving comments'} );
    }
});

router.post('/like-post', jsonParser, async (req, res) => {
    const userId = req.user.user_id;
    const postId = req.body.post_id

    try {
        const result = await likePost(userId, postId);
        console.log(result)
        res.status(200).json(result)
    } catch(error) {
        console.error('Error liking post: ', error);
        res.status(500).json({ error: 'Error liking post'} );
    }
});

router.post('/unlike-post', jsonParser, async (req, res) => {
    const userId = req.user.user_id;
    const postId = req.body.post_id

    try {
        const deletedRows = await unlikePost(userId, postId)
        res.status(200).json(deletedRows)
    } catch(error) {
        console.error('Error unliking post: ', error);
        res.status(500).json({ error: 'Error unliking post'} );
    }
});

module.exports = router;
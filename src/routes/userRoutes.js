const express = require('express');
const { searchUsers, followUser, unfollowUser, checkIfFollowing, getFollowers, getFollowing, getUserInfo } = require('../models/userModel');

const router = express.Router()

router.get('/search-users', async (req, res) => {
    try {
        const searchQuery = req.query.q;

        if (!searchQuery) {
            return;
        }

        const users = await searchUsers(searchQuery);
        res.json(users)

    } catch(error) {
        console.error('Error searching users: ', error);
        res.status(500).send('Error searching users');
    }
});

router.get('/user-info', async (req, res) => {
    try {
        const userId = req.query.id;

        if(!userId) {
            console.error('Invalid request: empty query');
            res.status(400).send({ error: 'Invalid request' });
            return
        }

        const userInfo = await getUserInfo(userId);

        res.status(200).json(userInfo);

    } catch(error) {
        console.error('Error retrieving user info: ', error);
        res.status(500).send('Error retrieving user info');
    }
});

router.get('/follow-user', async (req, res) => { 
    try {
        const followedId = req.query.followed_id;

        if (!followedId) {
            console.error('Invalid request: empty query');
            res.status(400).send({ error: 'Invalid request' });
            return
        }

        await followUser(req.user.user_id, followedId);

        res.status(200).send('User followed');

    } catch(error) {
        console.error('Error following user: ', error);
        res.status(500).send('Error following user');
    }
});

router.get('/unfollow-user', async (req, res) => {
    try {
        const unfollowedId = req.query.unfollowed_id;

        if (!unfollowedId) {
            console.error('Invalid request: empty query');
            res.status(400).send({ error: 'Invalid request' });
            return
        }

        await unfollowUser(req.user.user_id, unfollowedId);

        res.status(200).send('User unfollowed')

    } catch(error) {
        console.error('Error unfollowing user: ', error)
        res.status(500).send('Error unfollowing user')
    }
});

router.get('/check-if-following', async (req, res) => {
    try {
        const followingId = req.query.following_id;

        if (!followingId) {
            console.error('Invalid request: empty query');
            res.status(400).send({ error: 'Invalid request' });
            return
        }

        const result = await checkIfFollowing(req.user.user_id, followingId);

        var isFollowing;
        if(result.length > 0) {
            isFollowing = true
        } else {
            isFollowing = false
        }

        res.status(200).json(isFollowing);

    } catch(error) {
        console.error('Error checking if following: ', error);
        res.status(500).send('Error checking if following user');
    }
});

router.get('/followers', async (req, res) => {
    try {
        const userId = req.query.id;
    
        if (!userId) {
            console.error('Invalid request: empty query');
            res.status(400).send({ error: 'Invalid request' });
            return
        }

        const followers = await getFollowers(userId);

        res.status(200).json(followers);

    } catch(error) {
        console.error('Error retrieving followers: ', error);
        res.status(500).send('Error retrieving followers');
    }
});

router.get('/following', async (req, res) => {
    try {
        const userId = req.query.id;
    
        if (!userId) {
            console.error('Invalid request: empty query');
            res.status(400).send({ error: 'Invalid request' });
            return
        }

        const following = await getFollowing(userId);

        res.status(200).json(following);

    } catch(error) {
        console.error('Error retrieving following: ', error);
        res.status(500).send('Error retrieving following');
    }
});

module.exports = router;
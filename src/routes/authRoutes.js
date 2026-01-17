const express = require('express');
const admin = require('firebase-admin');
const { addUser, retrieveEmail } = require('../models/userModel');

var router = express.Router();
var jsonParser = express.json()

router.post('/register-user', jsonParser, async (req, res) =>{
    const { email, password, username } = req.body;
    var userRecord;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    try {
        userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: username.toLowerCase()
        });

        const userToCreateDb = {
            id: userRecord.uid,
            email: email,
            username: username.toLowerCase()
        };

        const user = await addUser(userToCreateDb);
        console.log(user);

        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        res.status(201).json({
            message: 'User registered successfully',
            token: customToken
        });

    } catch (error) {
        console.error('Error creating new user: ', error);

        //If error occurs and user was created (likely meaning user insertion in db failed), delete user
        if(userRecord) {
            admin.auth().deleteUser(userRecord.uid);
        }

        var errorMessage;
        if (error.code === 'auth/email-already-exists') {
          errorMessage = 'Email is already registered';
        } else if (error.code === 'auth/invalid-password') {
          errorMessage = 'Invalid password';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email format';
        }
        
        if (errorMessage) {
            res.status(400).send(errorMessage);
        } else {
            res.status(500).send('Error during registration');
        }
    }
});

router.get('/get-email-from-username', async (req, res) => {
    try {
        const username = req.query.username;

        const result = await retrieveEmail(username);

        if(!result) {
            return res.status(404).json({ error: "User not found" })
        }

        res.status(200).json({ email: result.email });

    } catch(error) {
        console.error("Error fetching email from username: ", error)
        res.status(500).json({ error: "Internal server error" })
    }
});

module.exports = router;


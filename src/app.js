require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-service-account-key.json');
const getKnexInstance = require('./db/knex.js');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const app = express();
const PORT = process.env.PORT || 8080;

//Middleware to verify Firebase ID token
const authenticateFirebase = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; //Attach user info to request object
        next();
    } catch(error) {
        console.error("Error verifying Firebases ID token: ", error);
        return res.status(403).json({ error: 'Forbidden' });
    }
};

app.use('/api', authenticateFirebase);

//Routes
const authRoutes = require('./routes/authRoutes.js');
app.use('/auth', authRoutes);

const postRoutes = require('./routes/postRoutes.js');
app.use('/api', postRoutes);

const userRoutes = require('./routes/userRoutes.js');
app.use('/api', userRoutes);


app.listen(PORT, () => {
    console.log("Server listening on port: ", PORT);
});

process.on('SIGINT', async () => {
    const knex = await getKnexInstance();
    await knex.destroy();
    console.log('Database connection closed');
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    const knex = await getKnexInstance();
    await knex.destroy();
    console.log('Database connection closed');
    process.exit(0);
  });
const { Router } = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const validateUserAuth = require('./helpers/loginGoogleHelper');

const jwt = require('jsonwebtoken')

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, URL } = process.env;

const router = Router();

const { URL_ALLOWED, SECRET_KEY } = process.env

passport.use("authGoogle", new GoogleStrategy(
    {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${URL}login/auth/google/redirect`,
    },
    async (request, accessToken, refreshToken, profile, done) => {
        const user = await validateUserAuth(profile)
        return done(null, user);
    }
));

router.get('/google/redirect',
    passport.authenticate('authGoogle', {
        session: false
    }),
    async (req, res) => {
        if (req.user) {
            const body = { id: req.user.id, email: req.user.email }
            console.log(body)
            const token = jwt.sign({ user: body }, SECRET_KEY, {
                expiresIn: '60s'
            })
            res.cookie('token', token);
            res.redirect('https://e-commerce-videogames.vercel.app/home')
        } else {

            res.redirect(URL + '/auth/google/failure')
            // res.redirect('http://localhost:3001/auth/google/failure')

        }
    }
);

router.get('/google', passport.authenticate('authGoogle',
    { scope: ['email', 'profile'] }
));

router.get('/google/failure', (req, res) => {
    res.send('Failed to authenticate..');
});


module.exports = router;

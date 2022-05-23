const mongoose = require('mongoose');
const User = require('../../../models/user.model');
const Token = require('../../../models/token.model');
const crypto = require('../../../utils/crypto');
const mail = require('../../../utils/nodemailer');
const jwt = require('jsonwebtoken');
const mongodbHelper = require('../../../utils/mongodbHelper');

const secretKey = process.env.SECRET_KEY;
const refreshSecretKey = process.env.REFRESH_SECRET_KEY;

const requestVerifyTokenLife = process.env.REQUEST_VERIFY_TOKEN_LIFE;
const requestResetTokenLife = process.env.REQUEST_RESET_TOKEN_LIFE;
const tokenLife = process.env.ACCESS_TOKEN_LIFE;
const refreshTokenLife = process.env.REFRESH_TOKEN_LIFE;

module.exports = {
    // [POST] /auth/signup
    async signup(req, res) {
        await mongodbHelper.executeTransactionWithRetry({
            async executeCallback(session) {
                const { username, email, password, name } = req.body;
                if (!(username && email && password && name)) throw new Error('400');
                // Check username exists
                let user = await User.findOne({ username }).lean();
                if (user) throw new Error('Username already exists');

                // Check email is used ?
                user = await User.findOne({ email }).lean();
                if (user) throw new Error('User with given email already exist');

                // Save account to database
                user = await new User({
                    username,
                    email,
                    auth: {
                        password: crypto.hash(password),
                        remainingTime: Date.now()
                    },
                    name
                }).save({
                    session
                });

                let token = jwt.sign(
                    {
                        username,
                        email
                    },
                    secretKey,
                    {
                        expiresIn: requestVerifyTokenLife,
                        subject: 'verify-email'
                    }
                );

                // Send mail
                mail.sendVerify({
                    to: email,
                    username,
                    token
                });
            },
            successCallback() {
                return res.status(201).json({
                    status: 'success',
                    message: 'Account is created'
                });
            },
            errorCallback(error) {
                console.log(error);
                if (error?.message == 400)
                    return res.status(400).json({ message: 'Missing parameters' });
                if (error?.name === 'Error')
                    return res.status(200).json({
                        status: 'error',
                        message: error.message
                    });
                res.status(500).json({
                    status: 'error',
                    message: error.message
                });
            }
        });
    },

    // [POST] /auth/request/verify-email
    async requestVerifyEmail(req, res) {
        try {
            let { username, email, newEmail } = req.body;
            if (!(username || email))
                return res.status(400).json({ message: 'Missing parameters' });

            let user = await User.findOne({
                $or: [{ username }, { email }]
            })
                .select('auth')
                .lean();

            if (!user)
                return res.status(200).json({
                    status: 'error',
                    message: 'Not contain account using this username or email'
                });

            if (user.auth.isVerified && req.originalUrl.includes('auth/request/verify-email'))
                return res.status(200).json({
                    status: 'warning',
                    message: 'Email is verified already before'
                });

            let token = jwt.sign(
                {
                    username,
                    email: req.originalUrl.includes('auth/request/verify-email') ? email : newEmail
                },
                secretKey,
                {
                    expiresIn: requestVerifyTokenLife,
                    subject: 'verify-email'
                }
            );

            // Send mail
            mail.sendVerify({
                to: req.originalUrl.includes('auth/request/verify-email') ? email : newEmail,
                username: username,
                token
            });
            res.status(201).json({
                status: 'success',
                message: 'Verification email is send'
            });
        } catch (error) {
            console.log(error.message);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // [PATCH] /auth/verify-email
    async verifyEmail(req, res) {
        try {
            const { token } = req.body;

            if (!token) return res.status(400).json({ message: 'Missing parameters' });

            // Check token is valid
            let tokenErr;
            await jwt.verify(
                token,
                secretKey,
                {
                    subject: 'verify-email'
                },
                async (err, decoded) => {
                    if (err) tokenErr = err;
                    else {
                        let user = await User.findOne({
                            username: decoded.username
                        });
                        if (
                            !user ||
                            (user.auth.isVerified && req.originalUrl.includes('/auth/verify-email'))
                        )
                            tokenErr = {
                                name: 'AccountError',
                                message: 'Account is not found or is already verified'
                            };
                        else {
                            user.auth.isVerified = true;
                            user.auth.remainingTime = undefined;
                            user.email = decoded.email;
                            await user.save();
                        }
                    }
                }
            );
            if (tokenErr)
                return res.status(400).json({
                    status: 'error',
                    message: 'Token is invalid'
                });
            return res.status(200).json({
                status: 'success',
                message: 'Email is verified'
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // [POST] /auth/login
    async login(req, res) {
        try {
            // Find user with id or email
            const { username, email, password } = req.body;

            if (!((username || email) && password))
                return res.status(400).json({ message: 'Missing parameters' });

            let user = await User.findOne({
                $or: [{ username }, { email }]
            })
                .select('username name email auth')
                .lean();

            if (!user)
                return res.status(401).json({
                    status: 'error',
                    message: 'Username or email is not found'
                });

            // Check password
            if (!crypto.match(user.auth.password, password))
                return res.status(401).json({
                    status: 'error',
                    message: 'Password is wrong'
                });

            if (user.auth.isVerified === false) {
                let token = jwt.sign(
                    {
                        username: user.username,
                        email: user.email
                    },
                    secretKey,
                    {
                        expiresIn: requestVerifyTokenLife,
                        subject: 'verify-email'
                    }
                );
                // Send mail
                mail.sendVerify({
                    to: user.email,
                    username: user.username,
                    token
                });
                return res.status(307).json({
                    status: 'error',
                    message: 'Verify email of account',
                    email: user.auth.email
                });
            }

            let payload = {
                userId: user._id,
                isAdmin: user.auth.isAdmin
            };

            let accessToken = jwt.sign(payload, secretKey, {
                expiresIn: tokenLife
            });
            let refreshToken = jwt.sign(payload, refreshSecretKey, {
                expiresIn: refreshTokenLife
            });

            await Token.create([
                {
                    refreshToken,
                    payload
                }
            ]);

            if (user.auth.isAdmin) user.isAdmin = true;
            user.auth = undefined;

            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                accessToken,
                refreshToken,
                data: user
            });
        } catch (error) {
            console.log(error.message);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // [POST] /auth/request/reset-password
    async requestResetPassword(req, res) {
        try {
            const { username, email } = req.body;

            if (!(username || email))
                return res.status(400).json({ message: 'Missing parameters' });

            let user = await User.findOne({
                $or: [{ username }, { email }]
            }).lean();

            if (!user)
                return res.status(200).json({
                    status: 'error',
                    message: 'Not found an account with this username (or email)'
                });

            let token = jwt.sign(
                {
                    username: user.username,
                    email: user.email
                },
                secretKey,
                {
                    expiresIn: requestResetTokenLife,
                    subject: 'reset-password'
                }
            );

            mail.sendResetPassword({
                to: user.email,
                username: user.username,
                token
            });

            res.status(200).json({
                status: 'success',
                message: 'Reset password email is send',
                email: user.email
            });
        } catch (error) {
            console.log(error.message);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // [PATCH] /auth/reset-password
    async resetPassword(req, res) {
        try {
            let { token, newPassword } = req.body;

            if (!(token && newPassword))
                return res.status(400).json({ message: 'Missing parameters' });

            let tokenErr;
            await jwt.verify(
                token,
                secretKey,
                {
                    subject: 'reset-password'
                },
                async (err, decoded) => {
                    if (err) tokenErr = err;
                    else {
                        let user = await User.findOne({
                            username: decoded.username
                        });
                        user.auth.password = crypto.hash(newPassword);
                        let savedUser = await user.save();
                        if (savedUser !== user) tokenErr = new Error('Password is not updated');
                    }
                }
            );
            if (tokenErr) {
                if (tokenErr.name === 'Error') throw tokenErr;
                return res.status(200).json({
                    status: 'error',
                    message: 'Token is invalid or expired'
                });
            }
            res.status(200).json({
                status: 'success',
                message: 'Password is updated'
            });
        } catch (error) {
            console.log(error.message);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // [POST] /v1/auth/refresh-token
    async refreshToken(req, res) {
        try {
            let { refreshToken } = req.body;

            if (!refreshToken) return res.status(400).json({ message: 'Missing parameters' });

            let token = await Token.findOne({
                refreshToken
            }).lean();
            if (!token)
                return res.status(200).json({
                    status: 'error',
                    message: 'Refresh token does not exist'
                });

            let errorMessage;
            jwt.verify(refreshToken, refreshSecretKey, (err, decoded) => {
                if (err) {
                    if (err.name === 'TokenExpiredError')
                        errorMessage = 'Expired refresh token. Login again to create new one';
                    else errorMessage = 'Invalid refresh token. Login again';
                }
            });
            if (errorMessage) {
                Token.deleteOne({
                    refreshToken
                });
                return res.status(200).json({
                    status: 'error',
                    message: errorMessage
                });
            }

            let newAccessToken = jwt.sign(token.payload, secretKey, {
                expiresIn: tokenLife
            });

            res.status(201).json({
                status: 'success',
                accessToken: newAccessToken,
                refreshToken
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
};

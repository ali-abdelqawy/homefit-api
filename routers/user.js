const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../email/account');
const router = new express.Router();

router.post('/users', async(req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/login', async(req, res) => {
    try {
        const user = await User.findByCredentials(
            req.body.email,
            req.body.password
        );
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send(e.message);
    }
});

router.post('/users/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            return token.token !== req.token;
        });
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async(req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users/me', auth, async(req, res) => {
    res.send(req.user);
});

router.get('/users', async(req, res) => {
    try {
        const users = await User.find();

        if (!users) {
            return res.status(404).send();
        }

        res.send(users);
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/totalusers', async(req, res) => {
    try {
        await User.countDocuments({}, function(err, count) {
            if (!count) {
                return res.status(404).send(err);
            } else {
                res.json(count);
            }
        });
    } catch (e) {
        res.status(500).send(e);
    }
});

//Switch account Type
router.patch('/switchAcc/:id', auth, async(req, res) => {
    if (req.user.accType === 'admin') {
        const user = await User.findOne({ _id: req.params.id });
        if (user.accType === 'customer') {
            user.accType = 'admin';
        } else {
            user.accType = 'customer';
        }
        try {
            await user.save();
            res.send(user);
        } catch (e) {
            res.status(400).send(e);
        }
    } else {
        res.status(401).send({ error: 'Please authenticate as Admin.' });
    }
});

//Make Account type Admin
router.patch('/makeAdmin/:id', auth, async(req, res) => {
    if (req.user.accType === 'admin') {
        const user = await User.findOne({ _id: req.params.id });
        user.accType = 'admin';
        try {
            await user.save();
            res.send(user);
        } catch (e) {
            res.status(400).send(e);
        }
    } else {
        res.status(401).send({ error: 'Please authenticate as Admin.' });
    }
});

router.patch('/users/me', auth, async(req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password'];
    const isValidOperation = updates.every(update =>
        allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach(update => (req.user[update] = req.body[update]));
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Delete Profile
router.delete('/deleteuser/:id', auth, async(req, res) => {
    if (req.user.accType === 'admin') {
        await User.deleteOne({ _id: req.params.id })
            .exec()
            .then(result => {
                return res.status(200).json({ message: 'User deleted' });
            })
            .catch(err => {
                return res.status(500).json({ error: err });
            });
    } else {
        res.status(401).send({ error: 'Please authenticate as an admin.' });
    }
});

// Delete my own profile
router.delete('/users/me', auth, async(req, res) => {
    try {
        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        res.status(500).send();
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'));
        }

        cb(undefined, true);
    },
});

router.post(
    '/users/me/avatar',
    auth,
    upload.single('avatar'),
    async(req, res) => {
        const buffer = await sharp(req.file.buffer)
            .resize({ width: 250, height: 250 })
            .png()
            .toBuffer();
        req.user.avatar = buffer;
        await req.user.save();
        res.send();
    },
    (error, req, res, next) => {
        res.status(400).send({ error: error.message });
    }
);

router.delete('/users/me/avatar', auth, async(req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
});

module.exports = router;
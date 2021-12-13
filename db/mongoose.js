const mongoose = require('mongoose');

mongoose
    .connect(
        'mongodb+srv://user:' +
        process.env.MONGOPASS +
        '@cluster0-ddq7s.mongodb.net/test?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then(() => {
        console.log('connected to th db');
    })
    .catch(err => {
        console.log(err);
    });
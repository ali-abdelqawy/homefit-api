const express = require('express');
require('dotenv').config();
const mongo = require('./db/mongoose');
const userRouter = require('./routers/user');
const productRouter = require('./routers/product');
const categoryRouter = require('./routers/category');
var cors = require('cors');
const app = express();

const port = process.env.PORT || 3000;
console.log(process.env.PORT);
app.use(cors());

app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
        req.header(
            'Access-Control-Allow-Methods',
            'PUT, POST, PATCH, DELETE, GET'
        );
        return res.status(200).json();
    }
    next();
});

const bodyParser = require('body-parser');

// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
app.use(userRouter);
app.use(productRouter);
app.use(categoryRouter);

app.listen(port, () => {
    console.log('Server is up on port ' + port);
});
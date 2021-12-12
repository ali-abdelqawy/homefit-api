const express = require('express');
const Category = require('../models/category');
const multer = require('multer');
const sharp = require('sharp');
const Product = require('../models/product');
const router = new express.Router();

router.post('/categories', async (req, res) => {
	const category = new Category({
		...req.body,
	});

	try {
		await category.save();
		res.status(201).send(category);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.get('/categories', async (req, res) => {
	try {
		const categories = await Category.find();

		if (!categories) {
			return res.status(404).send();
		}

		res.send(categories);
	} catch (e) {
		res.status(500).send();
	}
});

router.get('/categories/:id', async (req, res) => {
	const _id = req.params.id;

	try {
		const category = await Category.findOne({ _id });

		if (!category) {
			return res.status(404).send();
		}

		res.send(category);
	} catch (e) {
		res.status(500).send();
	}
});

router.get('/totalcategories', async (req, res) => {
	try {
		await Category.countDocuments({}, function(err, count) {
			if (!count) {
				return res.status(404).send(err);
			}
			else {
				res.json(count)
			}
		})
	}
	catch (e) {
		res.status(500).send(e)
	}
})

router.patch('/categories/:id', async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'image'];
	const isValidOperation = updates.every(update =>
		allowedUpdates.includes(update)
	);

	if (!isValidOperation) {
		return res.status(400).send({ error: 'Invalid updates!' });
	}

	try {
		const category = await Category.findOne({ _id: req.params.id });

		if (!category) {
			return res.status(404).send();
		}

		updates.forEach(update => (category[update] = req.body[update]));
		await category.save();
		res.send(category);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.delete('/categories/:id', async (req, res) => {
	try {
		// Delete category Products when category is removed
		const product = await Product.deleteMany({ categoryId: req.params.id });
		const category = await Category.findOneAndDelete({
			_id: req.params.id,
		});

		if (!category) {
			res.status(404).send();
		}

		res.send(category);
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
	'/categories/:id/image',
	upload.single('image'),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer();
		const category = await Category.findOne({ _id: req.params.id });
		category.image = buffer;
		await category.save();
		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

router.delete('/categories/:id/image', async (req, res) => {
	const category = await Category.findOne({ _id: req.params.id });
	category.image = undefined;
	await category.save();
	res.send();
});

router.get('/categories/:id/image', async (req, res) => {
	try {
		const category = await Category.findById(req.params.id);

		if (!category || !category.image) {
			throw new Error();
		}

		res.set('Content-Type', 'image/png');
		res.send(category.image);
	} catch (e) {
		res.status(404).send();
	}
});

module.exports = router;

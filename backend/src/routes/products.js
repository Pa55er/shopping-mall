const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "uploads/");
    },
    filename: function (req, file, callback) {
        callback(null, `${Date.now()}_${file.originalname}`);
    },
});

const upload = multer({ storage: storage }).single("file");

// 이미지 업로드
router.post("/image", auth, async (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return req.status(500).send(err);
        }
        return res.json({ fileName: res.req.file.filename });
    });
});

// 상품 리스트 가져오기
router.get("/", async (req, res, next) => {
    // asc 오름차순  , desc 내림차순
    const order = req.query.order ? req.query.order : "desc";
    const sortBy = req.query.sortBy ? req.query.sortBy : "_id";
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const term = req.query.searchTerm;

    let findArgs = {};
    for (let key in req.query.filters) {
        if (req.query.filters[key].length > 0) {
            if (key === "price") {
                findArgs[key] = {
                    //Greater than equal
                    $gte: req.query.filters[key][0],
                    //Less than equal
                    $lte: req.query.filters[key][1],
                };
            } else {
                findArgs[key] = req.query.filters[key];
            }
        }
    }

    // 스키마의 모든 텍스트 인덱스에서 검색할 수 있음.
    if (term) {
        findArgs["$text"] = { $search: term };
    }

    console.log(findArgs);

    try {
        const products = await Product.find(findArgs)
            .populate("writer")
            .sort([[sortBy, order]])
            .skip(skip)
            .limit(limit);

        const productsTotal = await Product.countDocuments(findArgs);
        const hasMore = skip + limit < productsTotal ? true : false;

        return res.status(200).json({
            products,
            hasMore,
        });
    } catch (error) {
        next(error);
    }
});

// 상품 업로드
router.post("/", auth, async (req, res, next) => {
    try {
        const product = new Product(req.body);
        product.save();
        return res.sendStatus(201);
    } catch (error) {
        next(error);
    }
});

module.exports = router;

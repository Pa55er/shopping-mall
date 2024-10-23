const express = require("express");
const User = require("../models/User");
const router = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const async = require("async");
const crypto = require("crypto");

// 토큰 유효성 검사
router.get("/auth", auth, async (req, res, next) => {
    return res.json({
        _id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        image: req.user.image,
        cart: req.user.cart,
        history: req.user.history,
    });
});

// 회원가입
router.post("/register", async (req, res, next) => {
    try {
        const user = new User(req.body);
        await user.save();
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

// 로그인
router.post("/login", async (req, res, next) => {
    try {
        // 존재하는 유저인지 체크
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).send("Auth failed, email not found");
        }

        // 비밀번호가 올바른 것인지 체크
        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) {
            return res.status(400).send("Wrong password");
        }

        const payload = {
            userId: user._id.toHexString(),
        };

        // token을 생성
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        return res.json({ user, accessToken });
    } catch (error) {
        next(error);
    }
});

// 로그아웃
router.post("/logout", auth, async (req, res, next) => {
    try {
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
});

// 장바구니 담기
router.post("/cart", auth, async (req, res, next) => {
    try {
        // 먼저 User Collection에 해당 유저의 정보를 가져오기
        const userInfo = await User.findOne({ _id: req.user._id });

        // 가져온 정보에서 카트에다 넣으려 하는 상품이 이미 들어 있는지 확인
        let duplicate = false;
        userInfo.cart.forEach((item) => {
            if (item.id === req.body.productId) {
                duplicate = true;
            }
        });

        // 상품이 이미 있을 때
        if (duplicate) {
            const user = await User.findOneAndUpdate(
                { _id: req.user._id, "cart.id": req.body.productId },
                { $inc: { "cart.$.quantity": 1 } },
                { new: true }
            );

            return res.status(201).send(user.cart);
        }
        // 상품이 이미 있지 않을 때
        else {
            const user = await User.findOneAndUpdate(
                { _id: req.user._id },
                {
                    $push: {
                        cart: {
                            id: req.body.productId,
                            quantity: 1,
                            date: Date.now(),
                        },
                    },
                },
                { new: true }
            );

            return res.status(201).send(user.cart);
        }
    } catch (error) {
        next(error);
    }
});

// 장바구니 상품 삭제
router.delete("/cart", auth, async (req, res, next) => {
    try {
        // 먼저 cart안에 지우려고 한 상품을 지워주기
        const userInfo = await User.findOneAndUpdate(
            { _id: req.user._id },
            {
                $pull: { cart: { id: req.query.productId } },
            },
            { new: true }
        );

        const cart = userInfo.cart;
        const array = cart.map((item) => {
            return item.id;
        });

        const productInfo = await Product.find({
            _id: { $in: array },
        }).populate("writer");

        return res.json({
            productInfo,
            cart,
        });
    } catch (error) {
        next(error);
    }
});

// 장바구니 결제
router.post("/payment", auth, async (req, res) => {
    // User Collection 안에 History 필드 안에 간단한 결제 정보 넣어주기
    let history = [];
    let transactionData = {};

    req.body.cartDetail.forEach((item) => {
        history.push({
            // ISO, 날짜와 시간의 표기에 관한 국제 표준 규격
            dateOfPurchase: new Date().toISOString(),
            name: item.title,
            id: item._id,
            price: item.price,
            quantity: item.quantity,
            paymentId: crypto.randomUUID(),
        });
    });

    // Payment Collection 안에 자세한 결제 정보들 넣어주기
    transactionData.user = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
    };

    transactionData.product = history;

    // user collection
    // history 정보 저장
    // $each 가 있어야지 history 배열 안에 객체로 들어가게 됨
    // { $push: { history: history }} 이렇게 하면 배열 안에 배열이 들어감
    await User.findOneAndUpdate(
        { _id: req.user._id },
        { $push: { history: { $each: history } }, $set: { cart: [] } }
    );

    // payment collection
    // payment 에다가 transactionData 정보 저장
    const payment = new Payment(transactionData);
    const paymentDocs = await payment.save();

    // Product Collection 안에 있는 sold 필드 정보 업데이트 시켜주기
    // 상품 당 몇 개의 quantity를 샀는지
    let products = [];
    paymentDocs.product.forEach((item) => {
        products.push({ id: item.id, quantity: item.quantity });
    });

    // eachSeries(coll, iteratee, callbackapt)
    // coll || A collection to iterate over.
    // iteratee || An async function to apply to each item in coll.
    // callback || A callback which is called when all iteratee functions have finished,
    //              or an error occurs.
    async.eachSeries(
        products,
        async (item) => {
            await Product.updateOne(
                { _id: item.id },
                {
                    $inc: {
                        sold: item.quantity,
                    },
                }
            );
        },
        (err) => {
            if (err) return res.status(500).send(err);
            return res.sendStatus(200);
        }
    );
});

module.exports = router;

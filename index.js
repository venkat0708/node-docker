const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const redis = require("redis");
const cors = require("cors");
const {
    MONGO_IP,
    MONGO_PASSWORD,
    MONGO_PORT,
    MONGO_USER,
    REDIS_URL,
    REDIS_PORT,
    SESSION_SECRET
} = require("./config/config");

const redisURL = `redis://${REDIS_URL}:${REDIS_PORT}`
let RedisStore = require("connect-redis")(session);

let redisClient = redis.createClient({
    //host: REDIS_URL,
    //port: REDIS_PORT,
    url: redisURL,
    legacyMode: true
})
redisClient.connect().catch(console.error)

const postRouter = require("./routes/postRoutes");
const userRoter = require("./routes/userRoutes");



const app = express();
app.enable("trust proxy")
app.use(cors({}));
app.use(
    session({
        store: new RedisStore({client:redisClient}),
        secret: SESSION_SECRET,
        cookie: {
            secure: false,
            resave: false,
            saveUninitialized: false,
            httpOnly: true,
            maxAge: 60000
        }
    })
)

app.use(express.json())
const PORT = process.env.PORT || 3000;

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

const connectWithRetry = () => {
    mongoose.connect(mongoURL, {
        useNewUrlParser: true,
    })
    .then(() => {console.log("Connected Successfully to Mongo DB");})
    .catch((e) => {
        console.log(e)
        console.log("Retrying connection with Mongo DB");
        setTimeout(connectWithRetry, 5000);
    });
}

connectWithRetry();

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRoter);
app.get("/", (req, res) => {
    console.log("Yeah it worked");
    res.send("<h2>Hi There!!!!</h2>");
})


app.listen(PORT, () => {
    console.log(`listening on port : ${PORT}`);
})
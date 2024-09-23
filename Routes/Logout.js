import api from "../Modules/Api.js";
import Config from "../Utils/Config.js";

const { SHOPTRACKER_API_HTTPSECURE } = Config;

api.post("/logout", async function (req, res) {
    res.clearCookie('jwt', { httpOnly: true, secure: SHOPTRACKER_API_HTTPSECURE, sameSite: 'lax' });
    res.status(200).json({ data: null, msg: "User successfully logged out." });
});

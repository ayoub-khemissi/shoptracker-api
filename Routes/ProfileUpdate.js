import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import { validateAddress, validateBoolean, validateName, validateZipcode } from "../Modules/DataValidation.js";
import { cleanData } from "../Modules/DataTransformation.js";

api.patch("/profile/update/", async function (req, res) {
    const jwt = verifyAuthJwt(extractJwt(req.headers.authorization));

    if (!jwt) {
        res.status(401).json({ data: null, msg: "Unauthorized." });
        return;
    }

    const firstname = cleanData(req.body.firstname);
    const lastname = cleanData(req.body.lastname);
    const country = cleanData(req.body.country);
    const city = cleanData(req.body.city);
    const address = cleanData(req.body.address);
    const zipcode = cleanData(req.body.zipcode);
    const alertEmail = req.body.alertEmail;
    const alertText = req.body.alertText;
    const alertBrowserNotification = req.body.alertBrowserNotification;
    const alertPushNotification = req.body.alertPushNotification;

    if (firstname && !validateName(firstname)) {
        res.status(400).json({ data: null, msg: "Invalid firstname format." });
        return;
    }

    if (lastname && !validateName(lastname)) {
        res.status(400).json({ data: null, msg: "Invalid lastname format." });
        return;
    }

    if (country && !validateName(country)) {
        res.status(400).json({ data: null, msg: "Invalid country format." });
        return;
    }

    if (city && !validateName(city)) {
        res.status(400).json({ data: null, msg: "Invalid city format." });
        return;
    }

    if (address && !validateAddress(address)) {
        res.status(400).json({ data: null, msg: "Invalid address format." });
        return;
    }

    if (zipcode && !validateZipcode(zipcode)) {
        res.status(400).json({ data: null, msg: "Invalid zipcode format." });
        return;
    }

    if (!validateBoolean(alertEmail)) {
        res.status(400).json({ data: null, msg: "Invalid alertEmail format." });
        return;
    }

    if (!validateBoolean(alertText)) {
        res.status(400).json({ data: null, msg: "Invalid alertText format." });
        return;
    }

    if (!validateBoolean(alertBrowserNotification)) {
        res.status(400).json({ data: null, msg: "Invalid alertBrowserNotification format." });
        return;
    }

    if (!validateBoolean(alertPushNotification)) {
        res.status(400).json({ data: null, msg: "Invalid alertPushNotification format." });
        return;
    }

    const valuesA = [firstname, lastname, country, city, address, zipcode, alertEmail, alertText, alertBrowserNotification, alertPushNotification, Date.now(), jwt.id];
    const queryA = "UPDATE user SET firstname=?, lastname=?, country=?, city=?, address=?, zipcode=?, alert_email=?, alert_text=?, alert_browser_notification=?, alert_push_notification=?, updated_at=? WHERE id=?";
    await Database.execute(queryA, valuesA);

    res.status(200).json({ data: null, msg: "User successfully updated." });
});

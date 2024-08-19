import api from "../Modules/Api.js";
import { extractJwt, verifyAuthJwt } from "../Modules/Auth.js";
import Database from "../Modules/Database.js";
import {
    validateAddress,
    validateName,
    validateZipcode
} from "../Modules/DataValidation.js";
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

    const valuesA = [
        firstname,
        lastname,
        country,
        city,
        address,
        zipcode,
        Date.now(),
        jwt.id,
    ];
    const queryA =
        "UPDATE user SET firstname=?, lastname=?, country=?, city=?, address=?, zipcode=?, updated_at=? WHERE id=?";
    await Database.execute(queryA, valuesA);

    res.status(200).json({ data: null, msg: "User profile successfully updated." });
});

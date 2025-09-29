"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.badRequest = badRequest;
exports.conflict = conflict;
exports.notFound = notFound;
exports.validation = validation;
exports.ok = ok;
function badRequest(res, message, code = 400) {
    res.status(code).json({ error: { code, message } });
}
function conflict(res, message = "Conflict") {
    res.status(409).json({ error: { code: 409, message } });
}
function notFound(res, message = "Not Found") {
    res.status(404).json({ error: { code: 404, message } });
}
function validation(res, fields) {
    res.status(422).json({ error: { code: 422, message: "Validation Failed", fields } });
}
function ok(res, body, code = 200) {
    res.status(code).json(body);
}

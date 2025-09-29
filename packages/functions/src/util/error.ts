
export function badRequest(res: any, message: string, code = 400) {
  res.status(code).json({ error: { code, message }});
}
export function conflict(res: any, message = "Conflict") {
  res.status(409).json({ error: { code: 409, message }});
}
export function notFound(res: any, message = "Not Found") {
  res.status(404).json({ error: { code: 404, message }});
}
export function validation(res: any, fields: any[]) {
  res.status(422).json({ error: { code: 422, message: "Validation Failed", fields }});
}
export function ok(res: any, body: any, code=200) {
  res.status(code).json(body);
}

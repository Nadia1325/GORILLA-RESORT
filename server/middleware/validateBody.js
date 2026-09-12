// Validates req.body against a zod schema. On success, req.body is replaced
// with the parsed (trimmed/defaulted) data so controllers and services can
// trust its shape instead of re-checking it.
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0]?.message || "Invalid request.";
      return res.status(400).json({ message });
    }
    req.body = result.data;
    next();
  };
}

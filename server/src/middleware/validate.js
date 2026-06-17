export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(", ");
      return res.status(400).json({ message });
    }

    req.validated = result.data;
    return next();
  };
}

export function getValidatorOptions(inputSchema) {
  return {
    inputSchema,
    ajvOptions: {
      useDefaults: true,
      strict: false,
    },
  };
}

export const renderTemplate = (
  template: string,
  variables: Record<string, string>,
): string => {
  return Object.entries(variables).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`\\{\\{\\s*\\$${key}\\s*\\}\\}`, 'g'), value),
    template,
  );
};

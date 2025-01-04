export const encoding_for_model = (model: string) => {
  return {
    encode: (text: string) => {
      // Simplified token count: Each word is one token
      const tokens = text.split(/\s+/).filter(Boolean).length;
      // Return an array with 'tokens' number of dummy tokens
      return new Array(tokens).fill('token');
    },
    free: () => {
      // No operation needed for the mock
    },
  };
};

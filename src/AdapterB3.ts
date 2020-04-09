export const createAdapter = config => {
  console.log("functional");
  return {
    init: () => {
      console.log("functional init");
    },
  };
};

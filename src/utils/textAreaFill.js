const {
  noteAddBtnFn,
  textAreafn,
  sendBtnfn,
} = require("./selectors/allSelectors");

async function textAreaFill(page) {
  const noteAddBtn = await noteAddBtnFn(page);

  await noteAddBtn[0].click();

  const textArea = await textAreafn(page);

  await textArea[0].type(
    `Hey there! I came across your profile and was impressed by your experience. Let's connect and explore our shared interests.`
  );

  const sendButton = await sendBtnfn(page);

  await sendButton[0].click();

  return true;
}

module.exports = {
  textAreaFill,
};

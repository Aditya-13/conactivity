const {
  connectButtonInFrontfn,
  threeDotsfn,
  connectBtnInDotsFn,
  inviteMessageModalfn,
  noteAddBtnFn,
  textAreafn,
  sendBtnfn,
} = require("./selectors/allSelectors");

const findConnectBtn = async (page, name) => {
  try {
    const frontConnect = await connectButtonInFrontfn(page, name);

    if (!frontConnect.length) {
      const threeDots = await threeDotsfn(page);

      if (threeDots.length) {
        await threeDots[1].click();

        const connectBtn = await connectBtnInDotsFn(page, name);

        if (connectBtn.length) {
          await connectBtn[1].click();

          const msgModal = await inviteMessageModalfn(page);

          if (msgModal.length) {
            const noteAddBtn = await noteAddBtnFn(page);

            await noteAddBtn[0].click();

            const textArea = await textAreafn(page);

            await textArea[0].type(
              `Hey there! I came across your profile and was impressed by your experience. Let's connect and explore our shared interests.`
            );

            const sendButton = await sendBtnfn(page);

            await sendButton[0].click();

            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      await frontConnect[1].click();

      const msgModal = await inviteMessageModalfn(page);

      if (msgModal.length) {
        const noteAdd = await page.$$(`button[aria-label="Add a note"]`);

        await noteAdd[0].click();

        const textArea = await textAreafn(page);

        await textArea[0].type(
          `Hey there! I came across your profile and was impressed by your experience. Let's connect and explore our shared interests.`
        );

        const sendButton = await sendBtnfn(page);

        await sendButton[0].click();

        return true;
      } else {
        return false;
      }
    }
  } catch (error) {
    return false;
  }
};

module.exports = {
  findConnectBtn,
};

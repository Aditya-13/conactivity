const {
  connectButtonInFrontfn,
  threeDotsfn,
  connectBtnInDotsFn,
  inviteMessageModalfn,
} = require("./selectors/allSelectors");
const { textAreaFill } = require("./textAreaFill");

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
            const result = await textAreaFill(page);

            return result;
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
        const result = await textAreaFill(page);

        return result;
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

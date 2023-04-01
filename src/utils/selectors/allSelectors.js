const alreadySentfn = async (page, name) => {
  const alreadySent = await page.$$(
    `button[aria-label="Pending, click to withdraw invitation sent to ${name}"]`
  );

  return alreadySent;
};

const connectButtonInFrontfn = async (page, name) => {
  const connectButtonInFront = await page.$$(
    `button[aria-label="Invite ${name} to connect"]`
  );

  return connectButtonInFront;
};

const threeDotsfn = async (page) => {
  const threeDots = await page.$$(`button[aria-label="More actions"]`);

  return threeDots;
};

const connectBtnInDotsFn = async (page, name) => {
  const connectBtn = await page.$$(
    `div[aria-label="Invite ${name} to connect"]`
  );

  return connectBtn;
};

const inviteMessageModalfn = async (page) => {
  const inviteMessageModal = await page.$$(
    `div[aria-labelledby="send-invite-modal"]`
  );

  return inviteMessageModal;
};

const noteAddBtnFn = async (page) => {
  const noteAddBtn = await page.$$(`button[aria-label="Add a note"]`);

  return noteAddBtn;
};

const textAreafn = async (page) => {
  const textArea = await page.$$('textarea[id="custom-message"]');

  return textArea;
};

const sendBtnfn = async (page) => {
  const sendButton = await page.$$(`button[aria-label="Send now"]`);

  return sendButton;
};

module.exports = {
  alreadySentfn,
  connectButtonInFrontfn,
  threeDotsfn,
  connectBtnInDotsFn,
  inviteMessageModalfn,
  noteAddBtnFn,
  textAreafn,
  sendBtnfn,
};

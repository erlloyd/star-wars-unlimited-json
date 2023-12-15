var axios = require("axios");
var path = require("path");
var fs = require("fs");
const { exit } = require("process");

const swudbBaseUrl = "https://api.swu-db.com/cards/";

const allSets = [
  {
    apiSetName: "sor",
    englishSetName: "Spark of Rebellion",
    maxCardNumber: 252,
  },
];

const axiosCache = {};

const axiosGet = async (url, options) => {
  if (!!axiosCache[url]) {
    return axiosCache[url];
  }

  const response = await axios.get(url, options).catch((e) => {
    errored = true;
    // console.log("got an axios error for url " + url + ": " + e.message);
    throw new Error("AxiosError");
  });

  axiosCache[url] = response;

  return response;
};

const axiosPost = async (url, setName) => {
  const payload = {
    ...DEFAULT_SEARCH_PAYLOAD,
    sets: [setName],
  };

  const response = await axios
    .post(url, payload, { headers: { "Content-Type": "application/json" } })
    .catch((e) => {
      errored = true;
      console.log("got an axios error for url " + url + ": " + e.message);
      exit(-1);
    });

  return response.data;
};

const DRY_RUN = false;

const doImport = async () => {
  const rootDir = path.join(__dirname, "..");
  const setsDir = path.join(__dirname, "..", "sets");

  if (!fs.existsSync(setsDir)) {
    throw new Error("sets directory missing");
  }

  console.log("*********SETS***********");

  // First, store all packs for later use
  for (let [index, set] of allSets.entries()) {
    console.log(
      `Working with set ${set.englishSetName} (${index + 1} of ${
        allSets.length
      })`
    );

    const cards = [];

    let successfulCardCount = 0;

    for (let i = 1; i <= set.maxCardNumber; i++) {
      // for (let i = 1; i <= 10; i++) {
      //get the card info
      console.log("***Getting card " + i);
      try {
        const cardResponse = await axiosGet(
          `${swudbBaseUrl}${set.apiSetName}/${i}`
        );
        console.log(
          `Got ${cardResponse.data.Name}${
            cardResponse.data.Subtitle ? " - " + cardResponse.data.Subtitle : ""
          }`
        );
        cards.push(cardResponse.data);
        successfulCardCount = successfulCardCount + 1;
      } catch (e) {
        if (e.message == "AxiosError") {
          console.log("\t***Problem getting card. Likely not in db yet");
        } else {
          throw e;
        }
      }
      console.log("\n");
    }

    console.log("SUCCESSFULLY GOT " + successfulCardCount + " CARDS");

    fs.writeFileSync(
      path.join(setsDir, set.englishSetName + ".json"),
      JSON.stringify(cards, null, 4)
    );
  }

  //   for (let [index, pack] of hobSets.data.entries()) {
  //     console.log(
  //       `Working with pack ${pack.Name} (${index + 1} of ${hobSets.data.length})`
  //     );
  //     if (index < LAST_PACK_COMPLETED) {
  //       console.log("Skipping..");
  //       continue;
  //     }

  //     // get all the player cards for the pack
  //     if (!DRY_RUN) {
  //       const cardsUrl = `${hallOfBeorn}?CardSet=${encodeURIComponent(
  //         pack.Name
  //       )}&CardType=Player`;
  //       console.log("\tgetting the cards...");
  //       const cards = await axios
  //         .get(cardsUrl, {
  //           headers: { Cookie: hob_cookies },
  //         })
  //         .catch((e) => {
  //           console.log("got an axios error" + ": " + e.message);
  //         });
  //       console.log("\tgot all cards. Saving json...");
  //       pack.cards = cards.data instanceof Array ? cards.data : [];
  //       fs.writeFileSync(
  //         path.join(packDir, pack.Name + ".json"),
  //         JSON.stringify(pack, null, 4)
  //       );
  //       console.log("\tSaved json.");
  //     }
  //   }

  console.log("*********** SETS COMPLETE *****");
};

try {
  doImport();
} catch (e) {
  console.log(`ERROR`);
}

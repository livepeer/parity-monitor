const fetch = require("isomorphic-fetch");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");

const REJECT_THRESH = 10 * 60 * 1000; // 10 mins
const CACHE_FILE = path.resolve(os.homedir(), "parity-monitor.json");
const LOG_FILE = path.resolve(os.homedir(), "log");

const log = text => {
  console.log(text);
  fs.appendFileSync(LOG_FILE, `${text}\n`);
};

(async () => {
  const res = await fetch("http://localhost:8545", {
    method: "POST",
    body: JSON.stringify({
      method: "eth_blockNumber",
      params: [],
      id: 1,
      jsonrpc: "2.0"
    }),
    headers: {
      "content-type": "application/json"
    }
  });
  const { result } = await res.json();
  const time = Date.now();
  const current = { result, time };
  log(JSON.stringify({ current }));
  if (await fs.pathExists(CACHE_FILE)) {
    const previous = JSON.parse(await fs.readFile(CACHE_FILE));
    log(JSON.stringify({ previous }));
    if (current.result !== previous.result) {
      log("Node is progressing. Carry on.");
    } else {
      const delta = current.time - previous.time;
      if (delta < REJECT_THRESH) {
        log(`Node hasn't changed, but it's only been ${delta}ms. Carry on.`);
        process.exit(0);
      }
      log(`Node has been stuck for ${delta}ms. Triggering error.`);
      process.exit(1);
    }
  } else {
    log(`Writing first ${CACHE_FILE}`);
  }
  await fs.writeFile(CACHE_FILE, JSON.stringify(current));
})().catch(err => {
  log(err.message);
  process.exit(1);
});

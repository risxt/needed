import { ethers } from "ethers";
import ora from "ora";
import readlineSync from "readline-sync";
import cfonts from "cfonts";
import axios from "axios";

const RPC_URL = "https://testnet-rpc.monad.xyz";
const ROUTER_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
const ROUTER_ABI = ["function deposit() payable"];

async function getGasPrice() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const gasPrice = await provider.getGasPrice();
    return gasPrice;
  } catch (error) {
    console.error("\u274C Failed to fetch gas price, using default.");
    return ethers.parseUnits("52.5", "gwei");
  }
}

async function wrapMON(wallet, index, total) {
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
  const amount = ethers.parseEther("0.0001");
  const gasPrice = await getGasPrice();

  const spinner = ora(`(${index}/${total}) Wrapping ${ethers.formatEther(amount)} MON to WMON...`).start();

  try {
    const tx = await router.deposit({
      value: amount,
      gasLimit: 30000,
      gasPrice: gasPrice,
    });

    spinner.text = `(${index}/${total}) Transaction sent! Waiting for confirmation...\nHash: ${tx.hash}`;
    await tx.wait();

    spinner.succeed(`(${index}/${total}) Transaction confirmed!`);
  } catch (error) {
    spinner.fail(`(${index}/${total}) Error: ${error.message}`);
  }
}

async function main() {
  cfonts.say("NT Exhaust", {
    font: "block",
    align: "center",
    colors: ["cyan", "magenta"],
    background: "black",
    letterSpacing: 1,
    lineHeight: 1,
    space: true,
    maxLength: "0",
  });

  console.log("=== Telegram Channel\ud83d\ude80 : NT Exhaust (@NTExhaust) ===", "\x1b[36m");

  let privateKey;
  while (true) {
    privateKey = readlineSync.question("Enter your private key: ", { hideEchoBack: true }).trim();
    if (ethers.isHexString(privateKey, 32)) break;
    console.log("\u274C Invalid private key. Please enter a valid one.");
  }

  console.log("\n[Private Key Entered: ********]");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  let loopCount, waitTime;
  while (true) {
    loopCount = readlineSync.question("How many times should the script run before pausing? ");
    if (!isNaN(loopCount) && parseInt(loopCount) > 0) break;
    console.log("\u274C Please enter a valid number.");
  }

  while (true) {
    waitTime = readlineSync.question("How long should the script wait before restarting? (Enter time in minutes) ");
    if (!isNaN(waitTime) && parseInt(waitTime) >= 0) break;
    console.log("\u274C Please enter a valid time.");
  }

  const waitMilliseconds = parseInt(waitTime) * 60 * 1000;

  while (true) {
    console.log(`\n\ud83d\ude80 Starting batch of ${loopCount} transactions...\n`);

    for (let i = 1; i <= parseInt(loopCount); i++) {
      await wrapMON(wallet, i, loopCount);
    }

    console.log(`\n\u23f3 Waiting ${waitTime} minutes before starting the next batch...\n`);
    await new Promise((resolve) => setTimeout(resolve, waitMilliseconds));
  }
}

main();

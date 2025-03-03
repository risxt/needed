import "dotenv/config";
console.log("Loaded PRIVATE_KEYS:", process.env.PRIVATE_KEYS);
import "dotenv/config";
import { ethers } from "ethers";
import ora from "ora";
import inquirer from "inquirer";
import cfonts from "cfonts";
import axios from "axios";

const RPC_URL = "https://testnet-rpc.monad.xyz";
const ROUTER_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
const RUBIC_API_URL = "https://testnet-api.rubic.exchange/api/v2/trades/onchain/new_extended";
const RUBIC_REWARD_URL = "https://testnet-api.rubic.exchange/api/v2/rewards/tmp_onchain_reward_amount_for_user?address=";
const ROUTER_ABI = ["function deposit() payable"];

const PRIVATE_KEYS = process.env.PRIVATE_KEYS.split(",");

async function getGasPrice(provider) {
    try {
        const feeData = await provider.getFeeData();
        return feeData.gasPrice.mul(110).div(100); // Add 10% buffer
    } catch (error) {
        console.error("Failed to fetch gas price:", error);
        return ethers.parseUnits("52.5", "gwei");
    }
}

function getRandomAmountInEther(min, max) {
    return ethers.parseEther((Math.random() * (max - min) + min).toFixed(6));
}

async function wrapMON(index, total, wallet) {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
    const amount = getRandomAmountInEther(0.001, 0.005);
    const gasPrice = await getGasPrice(provider);
    
    const spinner = ora(`(${index}/${total}) Wrapping ${ethers.formatEther(amount)} MON...`).start();
    
    try {
        const tx = await router.deposit({ value: amount, gasLimit: 30000, gasPrice });
        spinner.text = `(${index}/${total}) Waiting for confirmation...`;
        await tx.wait();
        spinner.succeed(`(${index}/${total}) Confirmed! Hash: ${tx.hash}`);
    } catch (error) {
        spinner.fail(`(${index}/${total}) Error: ${error.message}`);
    }
}

async function main() {
    cfonts.say("Monad Script", { font: "block", align: "center", colors: ["cyan", "magenta"] });
    console.log("\n=== NT Exhaust (@NTExhaust) ===\n");
    
    const answers = await inquirer.prompt([
        { type: "input", name: "loopCount", message: "How many transactions per wallet?", validate: Number },
        { type: "input", name: "waitTime", message: "Wait time before next batch (minutes)?", validate: Number }
    ]);
    
    const waitMilliseconds = parseInt(answers.waitTime) * 60 * 1000;
    
    while (true) {
        for (const key of PRIVATE_KEYS) {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const wallet = new ethers.Wallet(key, provider);
            console.log(`\n🚀 Running transactions for wallet: ${wallet.address}\n`);
            for (let i = 1; i <= parseInt(answers.loopCount); i++) {
                await wrapMON(i, answers.loopCount, wallet);
            }
        }
        console.log(`\n⏳ Waiting ${answers.waitTime} minutes...\n`);
        await new Promise((resolve) => setTimeout(resolve, waitMilliseconds));
    }
}

main();

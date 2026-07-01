import { chromium } from "playwright";
import * as A from "./actions.mjs";
const b = await chromium.launch();
const c = await b.newContext({ viewport:{width:1600,height:900}});
const p = await c.newPage();
p.setDefaultTimeout(15000);
const log = (k,v)=>console.log(`\n### ${k}\n`, JSON.stringify(v));

await A.gamruLogin(p); console.log("gamru url:", p.url());
log("createMission", await A.createMission(p));
// verify row exists
await p.goto(A.BASES.gamru + "/gamification/missions",{waitUntil:"domcontentloaded"}); await A.sleep(1500);
console.log("mission row visible:", await p.locator(`tr:has-text("${A.MISSION_NAME}")`).count());
log("editMission", await A.editMission(p));
console.log("updated row visible:", await p.locator(`tr:has-text("${A.MISSION_NAME}")`).count());
log("createRewardProduct", await A.createRewardProduct(p));
await p.goto(A.BASES.gamru + "/gamification/reward-shop",{waitUntil:"domcontentloaded"}); await A.sleep(1500);
console.log("product row visible:", await p.locator(`tr:has-text("${A.PRODUCT_NAME}")`).count());
log("createUser", await A.createUser(p));

await A.gamesLogin(p); console.log("games url:", p.url());
log("joinMission", await A.joinMission(p));
log("playClickStorm", await A.playClickStorm(p));
log("doDeposit", await A.doDeposit(p));
await b.close();
console.log("\nPROBE DONE");

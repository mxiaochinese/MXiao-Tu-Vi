"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { sampleInputs } = require("../tests/synthesis.test.cjs");

const root = path.resolve(__dirname, "..");
const target = path.join(root, "regression", "whole-person");
const endpoint = process.env.SYNTHESIS_REGRESSION_ENDPOINT || "";

async function main() {
  const inputs = sampleInputs();
  fs.mkdirSync(path.join(target, "inputs"), { recursive: true });
  for (const input of inputs) {
    fs.writeFileSync(path.join(target, "inputs", `${input.system}.json`), `${JSON.stringify(input, null, 2)}\n`);
  }

  if (!endpoint) {
    console.log("Đã tạo 3 regression input. Chưa tạo Gemini output vì SYNTHESIS_REGRESSION_ENDPOINT chưa được cấu hình.");
    return;
  }

  fs.mkdirSync(path.join(target, "outputs"), { recursive: true });
  for (const input of inputs) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!response.ok) throw new Error(`${input.system}: endpoint trả HTTP ${response.status}`);
    const payload = await response.json();
    fs.writeFileSync(path.join(target, "outputs", `${input.system}.json`), `${JSON.stringify(payload.profile, null, 2)}\n`);
  }
  console.log("Đã tạo 3 Gemini regression output để đánh giá WholePersonProfile.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

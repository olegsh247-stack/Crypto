#!/usr/bin/env node
import { collectBtcObservationCandidates } from "../vps/worker/dist/btc-observations.js";

const result = await collectBtcObservationCandidates();
console.log(JSON.stringify(result, null, 2));
if (result.failures.length > 0) process.exitCode = 1;

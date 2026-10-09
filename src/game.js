import { createGame } from "./core/bootstrap.mjs";
const app = await createGame();
void app; // The test-only harness inspects this instance; production exposes only copied snapshots.

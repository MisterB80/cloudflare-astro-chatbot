/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@clerk/astro/env" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime { }
}

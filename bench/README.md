# Ajo Benchmark

Self-contained browser benchmark suite for comparing Ajo with local implementations of fast and common UI libraries.

`js-framework-benchmark` is only a reference for workload shape and implementation ideas. This suite does not import, serve, build, or read files from that repository.

## Setup

Install benchmark dependencies separately from Ajo's package dependencies:

```sh
pnpm --dir bench install
```

The benchmark uses `playwright-core` and launches the system Chrome channel by default. Override when needed:

```sh
$env:PLAYWRIGHT_CHANNEL="msedge"
$env:PLAYWRIGHT_EXECUTABLE="C:\path\to\chrome.exe"
```

## Usage

Quick smoke run:

```sh
pnpm bench:quick
```

Fast Ajo feedback loop:

```sh
pnpm bench:ajo
```

Use `pnpm --dir bench bench:ajo -- --samples 5 --warmups 1` when a change needs a less noisy read.

Full default run:

```sh
pnpm bench -- --samples 9 --warmups 2
```

Run a narrower set:

```sh
pnpm bench -- --frameworks ajo,vanilla,solid --ops create,update,select,swap,remove,clear
```

## Subjects

Current local subjects:

- `ajo`
- `vanilla`
- `solid`
- `inferno`
- `svelte`
- `mikado`
- `preact`
- `react`
- `lit`

The quick preset runs the fast set: `ajo`, `vanilla`, `solid`, `inferno`, `svelte`, and `mikado`.
The full default preset adds `preact` and `react`. `lit` is available via `--frameworks lit` but stays out of the default preset because its 10k-row clear path is too slow for regular local runs.

All subject apps live under `bench/subjects/` and are bundled locally into `bench/.dist/` before each run.
Ajo and Inferno subjects are written in JSX and compiled with their local factories. The Ajo subject uses `memo` by default for keyed rows.

## What It Measures

The runner measures keyed table operations inspired by js-framework-benchmark:

- create 1,000 rows
- replace 1,000 rows
- create 10,000 rows
- append 1,000 rows to 10,000 rows
- update every 10th row
- select one row
- swap rows
- remove one row
- clear rows

Each sample runs inside the page with `performance.now()`. The runner measures from click until the expected DOM state is visible, then waits one frame. Results print median milliseconds per operation and a geometric score normalized to the fastest subject per operation. Full runs write JSON and Markdown reports under `bench/results/`, including `bench/results/latest.md`; quick and Ajo feedback runs stay console-only unless passed `--save`.

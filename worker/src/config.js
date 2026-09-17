/* ==========================================================================
   What the indexer watches — $PURR on Base.
   --------------------------------------------------------------------------
   Every address here was read from the network by .github/workflows/
   discover.yml (scripts/discover-token.mjs) rather than carried over from the
   token this site was copied from.

   ⚠ Which on-chain flow is "fees collected" versus "distributed" is still not
   self-evident: reconcile against what thestonks.exchange and
   stockify.finance publish for $PURR before trusting a number —
   scripts/panel-probe.mjs prints both side by side. On $BLUE they agreed to
   five decimal places, which is the bar.
   ========================================================================== */

export const CHAIN_ID = 8453;                    // Base

export const TOKENS = {
  // The token people buy
  STR: '0x5D55Cf4E75f942eFf7817b5d6bB9a343188D5CE4',
  // The reward token holders are paid in — $BASECAT, the quote side of the
  // pair. symbol() "Basecat", name() "Basecat", read on chain.
  KEX: '0xB2000000000000000000004c27f6523082f41D01',
};

export const CONTRACTS = {
  // The trading pair — PURR/Basecat on Uniswap v3.
  pool: '0xA7B17145150bC4715259DB393dF766540a12933E',
  // Where trading fees accrue. SHARED BY EVERY COIN on the platform — the
  // same address $BOX and $BLUE use — so no stream may sum it: doing so
  // reports the whole platform's fees as this token's.
  feeLocker: '0x71D1D363176723f85d98B8B430DF33cde89f0A7f',
  // The distributor holders are paid from, from /api/fee-routing, which
  // reports this token's routing as "rewards". Per token — which is what makes
  // summing it this token's flows rather than the platform's.
  rewardsIndex: '0xC4970d4C7D34efa79C45f1B828acD71D978CA891',
};

// The block $PURR launched at, from /api/coins — and independently from a
// timestamp search for the pool's own pairCreatedAt, which lands on the same
// block. Nothing relevant happened before it, so the scan starts here rather
// than at genesis.
export const START_BLOCK = 51433918;

/* Decimals, per token, READ FROM EACH CONTRACT rather than assumed. Two
   constants, never one: on $BOX they differed — its reward token's decimals()
   returns 8 — and sharing a constant there published 25.244695737 as
   2.5244695737e-9, every digit right and the scale out by ten billion. A
   token that is "obviously 18" is exactly the one nobody checks. */
export const STR_DECIMALS = 18;
export const KEX_DECIMALS = 18;   // Basecat's own decimals(), read on chain

/* Everything that has to be real before a scan means anything. index-rewards
   and the worker both refuse to run while this list is non-empty, because the
   alternative is a run that sums nothing and publishes nulls on a schedule —
   which looks, on the page, exactly like a site that is broken. */
export const MISSING = Object.entries({
  'TOKENS.KEX': TOKENS.KEX,
  'CONTRACTS.pool': CONTRACTS.pool,
  'CONTRACTS.rewardsIndex': CONTRACTS.rewardsIndex,
  START_BLOCK,
  KEX_DECIMALS,
}).filter(([, v]) => v === null || v === undefined || v === '').map(([k]) => k);

/* The three flows the totals are built from:

     `feesIn`   reward tokens ARRIVING at the distributor — "fees collected"
     `paidOut`  everything LEAVING it: holder payments plus the protocol's cut,
                so it is not the "distributed" figure on its own
     `holders`  every token transfer folded into a running balance per address;
                addresses left holding something are the holder count

   Verify these against the platform's own panel before trusting them. */
export const STREAMS = [
  { id: 'feesIn', kind: 'sum', token: TOKENS.KEX, to: CONTRACTS.rewardsIndex, decimals: KEX_DECIMALS },
  { id: 'paidOut', kind: 'sum', token: TOKENS.KEX, from: CONTRACTS.rewardsIndex, decimals: KEX_DECIMALS },
  { id: 'holders', kind: 'balances', token: TOKENS.STR, decimals: STR_DECIMALS },
];

/* Share of the outflow that reaches holders — the rest is the protocol's cut.

   ⚠ NOT YET VERIFIED FOR THIS TOKEN. 0.9 is the platform's usual split and
   what both $BLUE's and $BOX's panels read, but it is a per-token setting and
   the one multiplier between the measured outflow and the figure on the tile.
   scripts/panel-probe.mjs prints this token's own Stockify panel beside what
   this site publishes; on $BLUE those agreed to five decimals, which is the
   bar. Until then the distributed figure is provisional.

   Better still, set PROTOCOL_ADDRESS if the protocol's address turns up — the
   cut is then subtracted exactly and survives the percentage changing. */
export const HOLDER_SHARE = 0.9;
export const PROTOCOL_ADDRESS = null;

if (PROTOCOL_ADDRESS) {
  STREAMS.push({
    id: 'protocolOut', kind: 'sum', token: TOKENS.KEX,
    from: CONTRACTS.rewardsIndex, to: PROTOCOL_ADDRESS, decimals: KEX_DECIMALS,
  });
}

/** Tokens that actually reached holders. */
export function holderPayout(totals) {
  const paidOut = totals.paidOut ?? 0;
  if (PROTOCOL_ADDRESS) return Math.max(0, paidOut - (totals.protocolOut ?? 0));
  return paidOut * HOLDER_SHARE;
}

/* Addresses that hold supply but are not holders in the sense the tile means:
   the pool itself, the fee locker, the rewards contract. */
export const EXCLUDE_FROM_HOLDERS = [
  CONTRACTS.pool,
  CONTRACTS.feeLocker,
  CONTRACTS.rewardsIndex,
].filter(Boolean).map((a) => a.toLowerCase());

/* Scan pacing. A Worker run is short, so it takes bites and resumes. Raise
   MAX_CHUNKS_PER_RUN to backfill faster; lower CHUNK_SIZE if the RPC complains
   (it halves automatically anyway). */
export const CHUNK_SIZE = 2000;
export const MAX_CHUNKS_PER_RUN = 60;
export const CONFIRMATIONS = 5;

// Price the token totals in USD. Public, no key.
export const DEXSCREENER_PAIR =
  'https://api.dexscreener.com/latest/dex/pairs/base/' + CONTRACTS.pool;
export const DEXSCREENER_KEX_TOKEN =
  'https://api.dexscreener.com/latest/dex/tokens/' + TOKENS.KEX;

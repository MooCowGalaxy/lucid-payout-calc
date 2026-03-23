export type AccountType = "flex" | "pro" | "direct"
export type AccountSize = 25000 | 50000 | 100000 | 150000

export const ACCOUNT_SIZES: AccountSize[] = [25000, 50000, 100000, 150000]

export const FLEX_DATA: Record<
  AccountSize,
  { maxPayout: number; minDailyProfit: number }
> = {
  25000: { maxPayout: 1000, minDailyProfit: 100 },
  50000: { maxPayout: 2000, minDailyProfit: 150 },
  100000: { maxPayout: 2500, minDailyProfit: 200 },
  150000: { maxPayout: 3000, minDailyProfit: 250 },
}

export const PRO_DATA: Record<
  AccountSize,
  {
    bufferAboveStart: number
    minProfitGoal: number
    maxPayout1: number
    maxPayout2Plus: number
  }
> = {
  25000: {
    bufferAboveStart: 1100,
    minProfitGoal: 250,
    maxPayout1: 1000,
    maxPayout2Plus: 1500,
  },
  50000: {
    bufferAboveStart: 2100,
    minProfitGoal: 500,
    maxPayout1: 2000,
    maxPayout2Plus: 2500,
  },
  100000: {
    bufferAboveStart: 3100,
    minProfitGoal: 750,
    maxPayout1: 2500,
    maxPayout2Plus: 3000,
  },
  150000: {
    bufferAboveStart: 4600,
    minProfitGoal: 1000,
    maxPayout1: 3000,
    maxPayout2Plus: 3500,
  },
}

export const DIRECT_DATA: Record<
  AccountSize,
  {
    profitGoal1: number
    profitGoal2Plus: number
    maxPayout1to3: number
    maxPayout4Plus: number
  }
> = {
  25000: {
    profitGoal1: 1500,
    profitGoal2Plus: 1250,
    maxPayout1to3: 1000,
    maxPayout4Plus: 1000,
  },
  50000: {
    profitGoal1: 3000,
    profitGoal2Plus: 2500,
    maxPayout1to3: 2000,
    maxPayout4Plus: 2500,
  },
  100000: {
    profitGoal1: 6000,
    profitGoal2Plus: 3500,
    maxPayout1to3: 2500,
    maxPayout4Plus: 3000,
  },
  150000: {
    profitGoal1: 9000,
    profitGoal2Plus: 4500,
    maxPayout1to3: 3000,
    maxPayout4Plus: 3500,
  },
}

export const SLIDER_MAX: Record<AccountType, Record<AccountSize, number>> = {
  flex: { 25000: 4000, 50000: 8000, 100000: 12000, 150000: 15000 },
  pro: { 25000: 5000, 50000: 8000, 100000: 12000, 150000: 15000 },
  direct: { 25000: 5000, 50000: 8000, 100000: 12000, 150000: 18000 },
}

export type PayoutResult = {
  eligible: boolean
  reasons: string[]
  maxPayout: number
  youReceive: number
  balanceAfterPayout: number
  drawdownRoom: number
  consistencyPercent: number | null
  consistencyLimit: number | null
  profitAboveBuffer: number | null
}

export function calculatePayout(params: {
  accountType: AccountType
  accountSize: AccountSize
  profit: number
  highestDay: number
  payoutTier: "first" | "later"
}): PayoutResult {
  const { accountType, accountSize, profit, highestDay, payoutTier } = params

  const reasons: string[] = []
  let maxPayout = 0
  let consistencyPercent: number | null = null
  let consistencyLimit: number | null = null
  let profitAboveBuffer: number | null = null

  if (profit <= 0) {
    return {
      eligible: false,
      reasons: ["You need positive profit to be eligible for a payout."],
      maxPayout: 0,
      youReceive: 0,
      balanceAfterPayout: accountSize + profit,
      drawdownRoom: profit - 100,
      consistencyPercent: null,
      consistencyLimit: null,
      profitAboveBuffer: null,
    }
  }

  if (accountType === "flex") {
    const data = FLEX_DATA[accountSize]
    maxPayout = Math.min(profit * 0.5, data.maxPayout)

    if (maxPayout < 500) {
      reasons.push(
        "Your maximum payout would be below the $500 minimum. You need at least $1,000 in profit."
      )
    }
  } else if (accountType === "pro") {
    const data = PRO_DATA[accountSize]
    consistencyLimit = 40
    profitAboveBuffer = profit - data.bufferAboveStart
    consistencyPercent = (highestDay / profit) * 100

    const cap = payoutTier === "first" ? data.maxPayout1 : data.maxPayout2Plus
    maxPayout = Math.min(Math.max(profitAboveBuffer, 0), cap)

    if (profit < data.minProfitGoal) {
      reasons.push(
        `Minimum profit goal not met. You need at least $${data.minProfitGoal.toLocaleString()} in profit this cycle.`
      )
    }

    if (consistencyPercent > 40) {
      reasons.push(
        `Consistency rule not met: your highest day is ${consistencyPercent.toFixed(1)}% of your total profit, which exceeds the 40% limit.`
      )
    }

    if (profitAboveBuffer <= 0) {
      reasons.push(
        `Your profit has not exceeded the buffer balance. You need more than $${data.bufferAboveStart.toLocaleString()} in profit to withdraw.`
      )
    } else if (maxPayout < 500) {
      reasons.push(
        "Your profit above the buffer is not enough for the $500 minimum payout."
      )
    }
  } else if (accountType === "direct") {
    const data = DIRECT_DATA[accountSize]
    consistencyLimit = 20
    consistencyPercent = (highestDay / profit) * 100

    const profitGoal =
      payoutTier === "first" ? data.profitGoal1 : data.profitGoal2Plus
    const cap =
      payoutTier === "first" ? data.maxPayout1to3 : data.maxPayout4Plus
    maxPayout = Math.min(profit, cap)

    if (profit < profitGoal) {
      reasons.push(
        `Profit goal not met. You need at least $${profitGoal.toLocaleString()} in profit this cycle.`
      )
    }

    if (consistencyPercent > 20) {
      reasons.push(
        `Consistency rule not met: your highest day is ${consistencyPercent.toFixed(1)}% of your total profit, which exceeds the 20% limit.`
      )
    }

    if (maxPayout < 500 && profit >= profitGoal) {
      reasons.push(
        "Your maximum payout would be below the $500 minimum."
      )
    }
  }

  maxPayout = Math.floor(maxPayout)
  const eligible = reasons.length === 0 && maxPayout >= 500

  if (!eligible) {
    maxPayout = 0
  }

  const youReceive = Math.floor(maxPayout * 0.9)
  const balanceAfterPayout = accountSize + profit - maxPayout
  const drawdownRoom = profit - maxPayout - 100

  return {
    eligible,
    reasons,
    maxPayout,
    youReceive,
    balanceAfterPayout,
    drawdownRoom,
    consistencyPercent,
    consistencyLimit,
    profitAboveBuffer,
  }
}

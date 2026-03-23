import { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import {
  calculatePayout,
  SLIDER_MAX,
  FLEX_DATA,
  PRO_DATA,
  DIRECT_DATA,
  ACCOUNT_SIZES,
} from "@/lib/payout-data"
import type { AccountType, AccountSize } from "@/lib/payout-data"

function fmt(n: number): string {
  if (Number.isInteger(n)) {
    return `$${n.toLocaleString("en-US")}`
  }
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatSize(size: AccountSize): string {
  return `$${size / 1000}K`
}

export function PayoutCalculator() {
  const [accountType, setAccountType] = useState<AccountType>("flex")
  const [accountSize, setAccountSize] = useState<AccountSize>(50000)
  const [profit, setProfit] = useState(0)
  const [profitInput, setProfitInput] = useState("")
  const [highestDay, setHighestDay] = useState(0)
  const [highestDayInput, setHighestDayInput] = useState("")
  const [payoutTier, setPayoutTier] = useState<"first" | "later">("first")

  const resetInputs = useCallback(() => {
    setProfit(0)
    setProfitInput("")
    setHighestDay(0)
    setHighestDayInput("")
  }, [])

  useEffect(() => {
    resetInputs()
    setPayoutTier("first")
  }, [accountType, resetInputs])

  useEffect(() => {
    resetInputs()
  }, [accountSize, resetInputs])

  // Clamp highest day to profit when profit decreases
  useEffect(() => {
    if (highestDay > profit) {
      setHighestDay(profit)
      setHighestDayInput(profit > 0 ? String(profit) : "")
    }
  }, [profit, highestDay])

  const sliderMax = SLIDER_MAX[accountType][accountSize]

  const result = calculatePayout({
    accountType,
    accountSize,
    profit,
    highestDay,
    payoutTier,
  })

  const handleProfitSlider = (value: number[]) => {
    const v = value[0]
    setProfit(v)
    setProfitInput(v > 0 ? String(v) : "")
  }

  const handleProfitInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setProfitInput(raw)
    const val = raw === "" ? 0 : Number(raw)
    if (!isNaN(val)) {
      setProfit(Math.max(0, Math.round(val)))
    }
  }

  const handleHighestDaySlider = (value: number[]) => {
    const v = value[0]
    setHighestDay(v)
    setHighestDayInput(v > 0 ? String(v) : "")
  }

  const handleHighestDayInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setHighestDayInput(raw)
    const val = raw === "" ? 0 : Number(raw)
    if (!isNaN(val)) {
      setHighestDay(Math.max(0, Math.round(val)))
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 p-4 pb-12">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Payout Calculator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimate your maximum payout based on your Lucid Trading account.
        </p>
      </div>

      {/* Account Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Account Type</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={accountType}
          onValueChange={(v) => {
            if (v) setAccountType(v as AccountType)
          }}
          className="w-full"
        >
          <ToggleGroupItem value="flex" className="flex-1">
            Flex
          </ToggleGroupItem>
          <ToggleGroupItem value="pro" className="flex-1">
            Pro
          </ToggleGroupItem>
          <ToggleGroupItem value="direct" className="flex-1">
            Direct
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Account Size */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Account Size</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={String(accountSize)}
          onValueChange={(v) => {
            if (v) setAccountSize(Number(v) as AccountSize)
          }}
          className="w-full"
        >
          {ACCOUNT_SIZES.map((size) => (
            <ToggleGroupItem key={size} value={String(size)} className="flex-1">
              {formatSize(size)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Payout Tier (Pro & Direct only) */}
      {accountType !== "flex" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Payout Number</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={payoutTier}
            onValueChange={(v) => {
              if (v) setPayoutTier(v as "first" | "later")
            }}
            className="w-full"
          >
            {accountType === "pro" ? (
              <>
                <ToggleGroupItem value="first" className="flex-1">
                  1st Payout
                </ToggleGroupItem>
                <ToggleGroupItem value="later" className="flex-1">
                  2nd+ Payout
                </ToggleGroupItem>
              </>
            ) : (
              <>
                <ToggleGroupItem value="first" className="flex-1">
                  1st - 3rd Payout
                </ToggleGroupItem>
                <ToggleGroupItem value="later" className="flex-1">
                  4th+ Payout
                </ToggleGroupItem>
              </>
            )}
          </ToggleGroup>
        </div>
      )}

      <Separator />

      {/* Profit Slider + Input */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Current Profit</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your total profit since your last payout, not including starting
            balance.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Slider
            value={[Math.min(profit, sliderMax)]}
            min={0}
            max={sliderMax}
            step={50}
            onValueChange={handleProfitSlider}
            className="flex-1"
          />
          <div className="relative w-28 shrink-0">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              min={0}
              value={profitInput}
              placeholder="0"
              onChange={handleProfitInput}
              className="pl-7 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Highest Day (Pro & Direct only) */}
      {accountType !== "flex" && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">
              Highest Day's Profit
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The most profit you made in a single trading day since your last
              payout. The consistency rule applies to all trading days since your
              last payout and resets with each new payout.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[Math.min(highestDay, Math.max(profit, 0))]}
              min={0}
              max={Math.max(profit, 0)}
              step={50}
              onValueChange={handleHighestDaySlider}
              className="flex-1"
            />
            <div className="relative w-28 shrink-0">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                min={0}
                value={highestDayInput}
                placeholder="0"
                onChange={handleHighestDayInput}
                className="pl-7 text-sm"
              />
            </div>
          </div>
          {profit > 0 && result.consistencyPercent !== null && (
            <p
              className={`text-xs font-medium ${
                result.consistencyPercent <= result.consistencyLimit!
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              }`}
            >
              Consistency: {result.consistencyPercent.toFixed(1)}%{" "}
              <span className="font-normal text-muted-foreground">
                (must be {result.consistencyLimit}% or less)
              </span>
            </p>
          )}
        </div>
      )}

      <Separator />

      {/* Eligibility Info */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Eligibility Requirements
        </p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {accountType === "flex" && (
            <>
              <li>
                &bull; 5 profitable trading days with at least{" "}
                {fmt(FLEX_DATA[accountSize].minDailyProfit)} profit per day
              </li>
              <li>&bull; Positive net profit during the payout cycle</li>
              <li>&bull; Minimum payout request: $500</li>
              <li>
                &bull; Maximum payout: 50% of profit, up to{" "}
                {fmt(FLEX_DATA[accountSize].maxPayout)}
              </li>
            </>
          )}
          {accountType === "pro" && (
            <>
              <li>
                &bull; Minimum profit goal:{" "}
                {fmt(PRO_DATA[accountSize].minProfitGoal)} per cycle
              </li>
              <li>
                &bull; Consistency: highest single day must not exceed 40% of
                total profit
              </li>
              <li>
                &bull; Profit must exceed buffer balance (
                {fmt(PRO_DATA[accountSize].bufferAboveStart)} above starting
                balance)
              </li>
              <li>&bull; Minimum payout request: $500</li>
              <li>
                &bull; Maximum payout:{" "}
                {fmt(
                  payoutTier === "first"
                    ? PRO_DATA[accountSize].maxPayout1
                    : PRO_DATA[accountSize].maxPayout2Plus
                )}
              </li>
            </>
          )}
          {accountType === "direct" && (
            <>
              <li>
                &bull; Profit goal:{" "}
                {fmt(
                  payoutTier === "first"
                    ? DIRECT_DATA[accountSize].profitGoal1
                    : DIRECT_DATA[accountSize].profitGoal2Plus
                )}{" "}
                per cycle
              </li>
              <li>
                &bull; Consistency: highest single day must not exceed 20% of
                total profit
              </li>
              <li>&bull; Minimum payout request: $500</li>
              <li>
                &bull; Maximum payout:{" "}
                {fmt(
                  payoutTier === "first"
                    ? DIRECT_DATA[accountSize].maxPayout1to3
                    : DIRECT_DATA[accountSize].maxPayout4Plus
                )}
              </li>
            </>
          )}
        </ul>
      </div>

      <Separator />

      {/* Results */}
      {profit > 0 ? (
        result.eligible ? (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">
                Payout Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Maximum withdrawal
                </span>
                <span className="font-medium">{fmt(result.maxPayout)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  You receive (90%)
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {fmt(result.youReceive)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Lucid keeps (10%)
                </span>
                <span>{fmt(result.maxPayout - result.youReceive)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Balance after payout
                </span>
                <span className="font-medium">
                  {fmt(result.balanceAfterPayout)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Drawdown room remaining
                </span>
                <span className="font-medium">
                  {fmt(result.drawdownRoom)}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">
                Not Eligible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {result.reasons.map((reason, i) => (
                  <li key={i}>&bull; {reason}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Enter your profit above to see your payout estimate.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

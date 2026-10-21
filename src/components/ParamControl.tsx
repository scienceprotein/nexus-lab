import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { formatNumber } from '@/lib/format'

interface ParamControlProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  tooltip?: string
  onChange: (v: number) => void
  disabled?: boolean
  /** Decimal places shown in the numeric input */
  precision?: number
}

/**
 * Scientific parameter control: label, slider, direct numeric input,
 * units, valid range and an explanatory tooltip.
 */
export function ParamControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  tooltip,
  onChange,
  disabled,
  precision,
}: ParamControlProps) {
  const decimals =
    precision ?? Math.max(0, Math.min(4, -Math.floor(Math.log10(step)) + (step * 10 ** -Math.floor(Math.log10(step)) % 1 !== 0 ? 1 : 0)))

  const clamp = (v: number) => Math.min(max, Math.max(min, v))

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          {tooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground/60 hover:text-primary transition-colors" aria-label={`About ${label}`}>
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="readout w-20 rounded border border-input bg-background px-1.5 py-0.5 text-right text-xs focus:border-primary focus:outline-none disabled:opacity-40"
            value={Number(value.toFixed(decimals))}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-label={`${label} value`}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (Number.isFinite(v)) onChange(clamp(v))
            }}
          />
          {unit && <span className="w-10 text-[10px] text-muted-foreground">{unit}</span>}
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        onValueChange={([v]) => onChange(clamp(v))}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/50">
        <span className="readout">{formatNumber(min)}</span>
        <span className="readout">{formatNumber(max)}</span>
      </div>
    </div>
  )
}

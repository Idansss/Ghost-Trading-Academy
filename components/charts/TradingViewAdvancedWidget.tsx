"use client"

import { useEffect, useRef, memo } from "react"
import { useTheme } from "next-themes"
import { ChartSkeleton } from "@/components/charts/ChartSkeleton"

interface TradingViewAdvancedWidgetProps {
  symbol: string
  interval?: string
  height?: number
  hideTopToolbar?: boolean
  hideSideToolbar?: boolean
  allowSymbolChange?: boolean
  studies?: string[]
  containerId?: string
}

function TradingViewAdvancedWidgetBase({
  symbol,
  interval = "240",
  height = 500,
  hideTopToolbar = false,
  hideSideToolbar = false,
  allowSymbolChange = true,
  studies = [],
  containerId,
}: TradingViewAdvancedWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme, resolvedTheme } = useTheme()
  const isDark = (resolvedTheme ?? theme) === "dark"

  const tvInterval = (() => {
    if (interval === "15m") return "15"
    if (interval === "1h" || interval === "60") return "60"
    if (interval === "4h" || interval === "240") return "240"
    if (interval === "1d" || interval === "D") return "D"
    if (interval === "1W" || interval === "W") return "W"
    return interval
  })()

  const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9:]/g, "")
  const fullSymbol = cleanSymbol.includes(":") ? cleanSymbol : `BINANCE:${cleanSymbol}`

  const widgetId = containerId ?? `tv_adv_${symbol.replace(/[^a-zA-Z0-9]/g, "")}_${interval}`

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ""

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.async = true
    script.type = "text/javascript"
    script.innerHTML = JSON.stringify({
      symbol: fullSymbol,
      interval: tvInterval,
      timezone: "Etc/UTC",
      theme: isDark ? "dark" : "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: hideTopToolbar,
      hide_side_toolbar: hideSideToolbar,
      allow_symbol_change: allowSymbolChange,
      studies,
      container_id: widgetId,
      autosize: true,
      backgroundColor: isDark ? "rgba(10, 10, 10, 1)" : "rgba(255, 255, 255, 1)",
      gridColor: isDark ? "rgba(40, 40, 40, 1)" : "rgba(240, 240, 240, 1)",
      hide_legend: false,
      save_image: false,
      withdateranges: true,
      details: false,
      calendar: false,
    })

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [fullSymbol, tvInterval, isDark, hideTopToolbar, hideSideToolbar, allowSymbolChange, widgetId])

  return (
    <div
      className="rounded-lg overflow-hidden border bg-card"
      style={{ height, width: "100%" }}
    >
      <div
        ref={containerRef}
        id={widgetId}
        className="tradingview-widget-container"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  )
}

export const TradingViewAdvancedWidget = memo(TradingViewAdvancedWidgetBase)

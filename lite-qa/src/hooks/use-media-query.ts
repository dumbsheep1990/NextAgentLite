import * as React from "react"

export function useMediaQuery(query?: string) {
  // If no query provided, return breakpoint helpers
  if (!query) {
    const isMobile = useMediaQueryInternal("(max-width: 768px)")
    const isTablet = useMediaQueryInternal("(max-width: 1024px)")
    const isDesktop = useMediaQueryInternal("(min-width: 1025px)")

    return {
      isMobile,
      isTablet,
      isDesktop,
    }
  }

  // If query provided, return specific query result
  return useMediaQueryInternal(query)
}

function useMediaQueryInternal(query: string) {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener('change', onChange)
    setValue(result.matches)

    return () => result.removeEventListener('change', onChange)
  }, [query])

  return value
}
"use client"

import { createContext, useContext } from "react"

type LocaleContextValue = {
	currentLocale: string
	defaultLocale: string
	hasLocales: boolean
}

export const LocaleContext = createContext<LocaleContextValue>({
	currentLocale: "",
	defaultLocale: "",
	hasLocales: false,
})

export const useLocale = () => useContext(LocaleContext)

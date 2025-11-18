declare module "countries-db" {
	export interface Country {
		id: string
		name: string
		officialName?: string
		emoji?: string
		emojiUnicode?: string
		iso2?: string
		iso3?: string
		isoNumeric?: string
		geonameId?: number
		continentId?: string
		population?: number
		elevation?: number
		areaSqKm?: number
		coordinates?: { latitude: number; longitude: number }
		timezones?: string[]
		domain?: string
		currencyCode?: string
		currencyName?: string
		postalCodeFormat?: string
		postalCodeRegex?: string
		phoneCode?: string
		neighborCountryIds?: string[]
		languages?: string[]
		locales?: string[]
	}

	// Type for the object returned by getAllCountries()
	export interface CountriesDBObject {
		[countryCode: string]: Country
	}

	// Interface for the main module export
	interface CountriesDBModule {
		getCountry(id: string): Country | null
		getAllCountries(): CountriesDBObject | null // Returns an object of countries or null
	}

	const countriesDb: CountriesDBModule
	export default countriesDb
}

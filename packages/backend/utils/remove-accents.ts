export function removeAccents(str: string): string {
	return str.normalize("NFD").replace(/\p{Mn}/gu, "")
}

export function flattenObject(
    obj: Record<string, any>,
    prefix = '',
    delim = '.'
): Record<string, any> {
    return Object.entries(obj ?? {}).reduce<Record<string, any>>(
        (acc, [k, v]) => {
            const key = prefix ? `${prefix}${delim}${k}` : k
            if (v && typeof v === 'object' && !Array.isArray(v)) {
                Object.assign(acc, flattenObject(v, key, delim))
            } else {
                acc[key] = v
            }
            return acc
        },
        {}
    )
}

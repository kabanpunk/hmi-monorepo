export function getByPath(obj: any, path: string) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

export function buildInputPayload(fullPath: string, value: any) {
    const parts = fullPath.split('.')

    if (parts[0] === 'outputs' && parts[1] === 'inputs') {
        return {[parts.slice(2).join('.')]: value}   // ⇒ { hands: true }
    }

    console.warn('[buildInputPayload] unsupported path', full)
    return {}
}

export function resolveStorePath(
    ss: ReturnType<typeof useSessionStore>,
    fullPath: string
) {
    if (!fullPath.includes('.')) fullPath = `outputs.${fullPath}`

    const [dataset, ...rest] = fullPath.split('.')

    const root =
        dataset === 'plant_outputs'
            ? ss.plant
            : ss.plc

    return getByPath(root, rest.join('.'))
}


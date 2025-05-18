import {defineStore} from 'pinia'
import {flattenObject} from '@/utils/flatten'
import {deepMerge} from '@/utils/deepMerge'
import {api} from '@/api'

interface RawSnapshot {
    inputs?: Record<string, any>
    outputs?: Record<string, any>
    global_inputs?: Record<string, any>
    plant_inputs?: Record<string, any>
    global_vars?: Record<string, any>
}

const empty: RawSnapshot = {
    inputs: {},
    outputs: {},
    global_inputs: {},
    plant_inputs: {},
}

async function fetchJsonWithRetry(
    url: string,
    attempts = 5,
): Promise<any | undefined> {
    for (let i = 0; i < attempts; i++) {
        try {
            const r = await fetch(url, {cache: 'no-store'})
            if (!r.ok) throw new Error(`HTTP ${r.status}`)

            const txt = (await r.text()).replace(/^\uFEFF/, '').trim()
            if (!txt) throw new Error('empty response')

            return JSON.parse(txt)
        } catch {
            // silent retry
        }
    }
    return undefined
}

export const useSessionStore = defineStore('session', {
    state: () => ({
        sessionId: '' as string,
        plc: {...empty} as RawSnapshot,
        plant: {...empty} as RawSnapshot,
    }),
    getters: {
        backendInputs(state) {
            const merged = {
                ...state.plc.inputs,
                ...state.plant.inputs,
                ...state.plc.global_inputs,
                ...state.plant.global_inputs,
            }
            return flattenObject(merged)
        },
        backendOutputs(state) {
            const merged = {
                ...state.plc.outputs,
                ...state.plant.outputs,
            }
            return flattenObject(merged)
        },
    },
    actions: {
        setSession(id: string) {
            this.sessionId = id
            this.fetchNow()
            setInterval(() => this.fetchNow(), 1000)
        },

        async fetchNow() {
            if (!this.sessionId) return

            const [plcRes, plantRes] = await Promise.all([
                fetchJsonWithRetry(
                    api(`/sessions/${this.sessionId}/outputs`)
                ),
                fetchJsonWithRetry(
                    api(`/sessions/${this.sessionId}/plant_outputs`)
                ),
            ])

            const isMeaningful = (obj: any) =>
                Object.keys(obj ?? {}).length > 0

            if (plcRes !== undefined && isMeaningful(plcRes)) {
                deepMerge(this.plc, plcRes)
            }
            if (plantRes !== undefined && isMeaningful(plantRes)) {
                deepMerge(this.plant, plantRes)
            }
        },

        async sendInputs(toSend: Record<string, any>) {
            const frm = new FormData()
            frm.append('action', 'loadInputs')
            frm.append('inputs', JSON.stringify(toSend))
            frm.append('plant_inputs', JSON.stringify({}))
            frm.append('global_inputs', JSON.stringify({}))

            await fetch(
                api(`/sessions/${this.sessionId}/load_inputs`),
                {method: 'POST', body: frm}
            )
        },
    },
})

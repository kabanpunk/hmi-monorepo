import {defineStore} from 'pinia'
import {flattenObject} from '../utils/flatten'
import {deepMerge} from '../utils/deepMerge'
import {api} from '../api'

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
            // retry
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
            return {
                /* ───── PLC ───── */
                ...flattenObject(state.plc.inputs ?? {},        'outputs.inputs'),
                ...flattenObject(state.plc.global_inputs ?? {}, 'outputs.global_inputs'),
                ...flattenObject(state.plc.global_vars ?? {},   'outputs.global_vars'),

                /* ──── PLANT ──── */
                ...flattenObject(state.plant.inputs ?? {},        'plant_outputs.inputs'),
                ...flattenObject(state.plant.global_inputs ?? {}, 'plant_outputs.global_inputs'),
                ...flattenObject(state.plant.global_vars ?? {},   'plant_outputs.global_vars'),
            }
        },
        backendOutputs(state) {
            return {
                // читаем ПЛК
                ...flattenObject(state.plc, 'outputs'),
                // читаем модель (plant)
                ...flattenObject(state.plant, 'plant_outputs'),
            }
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
                fetchJsonWithRetry(api(`/sessions/${this.sessionId}/outputs`)),
                fetchJsonWithRetry(api(`/sessions/${this.sessionId}/plant_outputs`)),
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

        async sendInputs(toSend: {
            inputs?: Record<string, any>
            plant_inputs?: Record<string, any>
            global_inputs?: Record<string, any>
        }) {
            const frm = new FormData()
            frm.append('action', 'loadInputs')
            frm.append('inputs', JSON.stringify(toSend.inputs ?? {}))
            frm.append('plant_inputs', JSON.stringify(toSend.plant_inputs ?? {}))
            frm.append('global_inputs', JSON.stringify(toSend.global_inputs ?? {}))

            await fetch(api(`/sessions/${this.sessionId}/load_inputs`), {
                method: 'POST',
                body: frm,
            })
        }
    },
})

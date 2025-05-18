import { fabric } from 'fabric'

export interface ElementMeta {
    inputs: string[]
    outputs: string[]
}

interface SavedBindings {
    inputs: Record<string, string>
    outputs: Record<string, string>
}

/**
 * Base class for runtime‑only elements shown in the Viewer.
 * Unlike the Editor, the Viewer is *always* in «runtime» mode, so we expose
 * `isRuntime` as a simple getter that always returns `true`.
 */
export abstract class BaseElement<
    TProps = Record<string, any>,
    TMeta extends ElementMeta = ElementMeta,
> extends fabric.Group {
    static elementType: string
    static meta: TMeta

    customProps!: TProps
    bindings: SavedBindings = { inputs: {}, outputs: {} }

    public id: any

    constructor(
        canvas: fabric.Canvas,
        x: number,
        y: number,
        children: fabric.Object[],
        props: TProps,
    ) {
        super(children, {
            left: x,
            top: y,
            selectable: false,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
        })

        this.customProps = props
        ;(this as any).elementType = (this.constructor as any).elementType
        ;(this as any).meta = (this.constructor as any).meta
        ;(this as any).bindings = this.bindings

        canvas.add(this)
    }

    /**
     * The Viewer never switches to a design mode, so this is always `true`.
     * Having the getter here prevents undefined‑access errors in child classes
     * that were copied from the Editor codebase.
     */
    protected get isRuntime(): boolean {
        return true
    }

    /** Sub‑classes may override this to react to PLC/plant updates. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setState(_: Record<string, any>): void {
        /* noop */
    }
}

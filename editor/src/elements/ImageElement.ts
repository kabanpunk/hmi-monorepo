import {fabric} from 'fabric'
import {BaseElement} from './BaseElement'

export interface ImageProps {
    src: string
}

export class ImageElement extends BaseElement<ImageProps> {
    static elementType = 'image'
    static meta = {inputs: [] as string[], outputs: [] as string[]}

    constructor(
        canvas: fabric.Canvas,
        x: number,
        y: number,
        props: ImageProps
    ) {
        super(canvas, x, y, [], props)

        fabric.Image.fromURL(
            props.src,
            (img) => {
                this.addWithUpdate(img)
                this.canvas?.requestRenderAll()
            },
            {crossOrigin: ''}
        )
    }
}

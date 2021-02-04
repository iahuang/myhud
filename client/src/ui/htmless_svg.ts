/* An extension for htmless that adds svg support */

class HLVectorElement extends HLElement {
    svgData: string;
    constructor(data: string) {
        super("svg");
        this.svgData = data;
    }

    render() {
        /* Slightly modified version of HLElement.render() */
        
        if (this.flexboxStyle) {
            this.appendStyleRule(this.flexboxStyle.getStylesheetObject());
        }

        let tmp = document.createElement('div');
        tmp.innerHTML = this.svgData;
        let htmlElement = tmp.firstChild as HTMLElement;
        if (!htmlElement) {
            throw new Error("Invalid SVG data");
        }
         // Set element class(es)
        if (this.classes.length > 0) {
            htmlElement.classList.add(...this.classes);
        }

        // Set HTML attributes
        for (let [attr, e] of this.attrs.entries()) {
            htmlElement.setAttribute(attr, e);
        }

        // Set element style
        for (let [attr, value] of this.inlineStyle.entries()) {
            (htmlElement.style as any)[attr] = value;
        }

        // Add event listeners
        for (let listener of this.eventListeners) {
            htmlElement.addEventListener(
                listener.type as any,
                listener.callback,
                listener.capture
            );
        }

        return htmlElement
    }
}

export default function svg(data: string) {
    return new HLVectorElement(data);
}
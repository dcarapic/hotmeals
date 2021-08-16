import { DependencyList, useEffect, useState } from "react";

/**
 * React hook which returns an abort signal which is automatically raised if a component has been dismounted.
 */
 const useAbortable = (): AbortSignal => {
    let [controller] = useState(new AbortController());
    useEffect(() => {
        return () => controller.abort();
    }, [controller]);
    return controller.signal;
};


/**
 * React effect hook where the effect gets a signal which is aborted if the component is unmounted or the effect needs to be re-executed.
 */
 const useAbortableLoad = (effect: (signal : AbortSignal) => Promise<void>, deps: DependencyList) => {
    useEffect(() => {
        const controller = new AbortController();
        effect(controller.signal)
        return () => controller.abort();
        // eslint-disable-next-line
    }, deps);
};


export { useAbortable, useAbortableLoad };
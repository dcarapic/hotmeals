import React, { DependencyList, Fragment,  useContext, useEffect, useRef, useState } from "react";
import { Alert, Toast, ToastContainer } from "react-bootstrap";
import { Variant } from "react-bootstrap/esm/types";
import { FunctionComponent } from "react-dom/node_modules/@types/react";
import * as api from "../util/api";

/**
 * User message definition.
 */
export type Message = {
    caption: string;
    description?: string;
    variant?: Variant;
};

/**
 * Description of a service which can display messages to the user.
 */
export type MessageService = {
    setMessage: (message: Message) => void;
    setMessageFromResponse: (response: api.ServerResponse, caption?: string) => void;
    showToast: (message: Message) => void;
    clearMessage: () => void;
};

/**
 * React context for the message service.
 */
const MessageServiceContext = React.createContext<MessageService>({
    setMessage: () => {},
    setMessageFromResponse: () => {},
    showToast: () => {},
    clearMessage: () => {},
});

/**
 * Helper function which generates a message from a server response of a request which is not successful.
 * In case there is no error then null is returned.
 */
const generateMessageFromServerResponse = (response: api.ServerResponse, caption?: string): Message | null => {
    if (response.ok || response.isAborted) return null;
    let msg: Message;
    if (response.isBadRequest)
        msg = {
            caption: caption || `${response.requestDescription} - failed`,
            description: response.errorDetails || "An error occurred while processing your request",
            variant: "warning",
        };
    else if (response.isNetworkError)
        msg = {
            caption: caption || `${response.requestDescription} - failed`,
            description:
                response.errorDetails ||
                "Server is not available or you are having connection issues. Please try again.",
            variant: "danger",
        };
    else
        msg = {
            caption: caption || `${response.requestDescription} - failed`,
            description: "An error occurred while processing your request",
            variant: "danger",
        };
    return msg;
};

/**
 * Message service container which can display a message.
 * It also provides the message service context so that a nested child component can also use the context to display a message.
 */

const MessageServiceContainer = (
    props: React.PropsWithChildren<{ message?: Message | null; serverResponse?: api.ServerResponse | null }>
) => {
    const [msg, setMsg] = useState<Message | null>(null);
    const [toasts, setToasts] = useState<Message[]>([]);
    const [msgService] = useState<MessageService>({
        setMessage: (message: Message) => {
            setMsg(message);
        },
        showToast: (message: Message) => {},
        setMessageFromResponse: (response: api.ServerResponse, caption?: string) =>
            setMsg(generateMessageFromServerResponse(response, caption)),
        clearMessage: () => setMsg(null),
    });

    let finalMessage: Message | null = msg;
    if (props.message) finalMessage = props.message;
    if (props.serverResponse) finalMessage = generateMessageFromServerResponse(props.serverResponse);

    const alertRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (alertRef.current) alertRef.current.scrollIntoView();
    });

    const onToastClose = (toast: Message) => {
        let index = toasts.indexOf(toast);
        let newToasts = [...toasts];
        newToasts.splice(index,index)
        setToasts(newToasts);
    };

    return (
        <MessageServiceContext.Provider value={msgService}>
            <Fragment>
                {props.children}
                {finalMessage && (
                    <Alert variant={finalMessage.variant || "danger"}>
                        <Alert.Heading>{finalMessage.caption}</Alert.Heading>
                        <p>{finalMessage.description}</p>
                    </Alert>
                )}
                {toasts.length > 0 && (
                    <ToastContainer position="bottom-center">
                        {toasts.map((t) => (
                            <Toast bg={t.variant || "danger"} onClose={() => onToastClose(t)} autohide >
                                <Toast.Header>
                                    <strong className="me-auto">{t.caption}</strong>
                                </Toast.Header>
                                <Toast.Body>{t.description}</Toast.Body>
                            </Toast>
                        ))}
                    </ToastContainer>
                )}
            </Fragment>
        </MessageServiceContext.Provider>
    );
};

/**
 * Higher order component which wraps the given component with MessageServiceContainer.
 * Makes it easy to provide error display UI per component.
 * @param WrappedComponent
 * @returns
 */
const withMessageContainer = (WrappedComponent: React.ComponentType) => {
    let wrapped: FunctionComponent = (props) => (
        <MessageServiceContainer>
            <WrappedComponent {...props} />
        </MessageServiceContainer>
    );
    return wrapped;
};

/**
 * Hook for consuming AppErrorUI context. Enables child controls to display an error on the AppErrorUI component.
 */
const useMessageService = () => useContext(MessageServiceContext);

export { MessageServiceContext, MessageServiceContainer, useMessageService, withMessageContainer };


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
 * React effect hook which provides abort signal which is automatically raised if a component has been dismounted.
 */
const useAbortableEffect = (effect: (signal: AbortSignal) => void, deps?: DependencyList) => {
    useEffect(() => {
        let controller = new AbortController();
        effect(controller.signal);
        return () => controller.abort();
    }, deps);
};

export { useAbortableEffect, useAbortable };

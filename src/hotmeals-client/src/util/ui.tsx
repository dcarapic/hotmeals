import React, { DependencyList, Fragment, FunctionComponent, useContext, useEffect, useRef, useState } from "react";
import { Alert, Toast, ToastContainer } from "react-bootstrap";
import { Variant } from "react-bootstrap/esm/types";
import * as api from "../util/api";

/**
 * User message definition.
 */
export type Message = {
    caption: string;
    description?: string;
    variant?: Variant;
    createdAt: Date;
};

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
            createdAt: new Date(),
        };
    else if (response.isNetworkError)
        msg = {
            caption: caption || `${response.requestDescription} - failed`,
            description:
                response.errorDetails ||
                "Server is not available or you are having connection issues. Please try again.",
            variant: "danger",
            createdAt: new Date(),
        };
    else
        msg = {
            caption: caption || `${response.requestDescription} - failed`,
            description: response.errorDetails || "An error occurred while processing your request",
            variant: "danger",
            createdAt: new Date(),
        };
    return msg;
};

/**
 * Description of a service which can display alert messages to the user.
 */
export type AlertService = {
    setMessage: (message: Message) => void;
    setMessageFromResponse: (response: api.ServerResponse, caption?: string) => void;
    clearMessage: () => void;
};

/**
 * React context for the alert message service.
 */
const AlertServiceContext = React.createContext<AlertService>({
    setMessage: () => {},
    setMessageFromResponse: () => {},
    clearMessage: () => {},
});

/**
 * Message service container which can display a message.
 * It also provides the message service context so that a nested child component can also use the context to display a message.
 */

const AlertMessageServiceContainer = (
    props: React.PropsWithChildren<{ message?: Message | null; serverResponse?: api.ServerResponse | null }>
) => {
    const [msg, setMsg] = useState<Message | null>(null);
    const [msgService] = useState<AlertService>({
        setMessage: (message: Message) => {
            setMsg(message);
        },
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

    return (
        <AlertServiceContext.Provider value={msgService}>
            <Fragment>
                {props.children}
                {finalMessage && (
                    <Alert variant={finalMessage.variant || "danger"}>
                        <Alert.Heading>{finalMessage.caption}</Alert.Heading>
                        <p>{finalMessage.description}</p>
                    </Alert>
                )}
            </Fragment>
        </AlertServiceContext.Provider>
    );
};

/**
 * Higher order component which wraps the given component with AlertMessageServiceContainer.
 * Makes it easy to provide alert message per component.
 */
const withAlertMessageContainer = (WrappedComponent: React.ComponentType) => {
    let wrapped: FunctionComponent = (props) => (
        <AlertMessageServiceContainer>
            <WrappedComponent {...props} />
        </AlertMessageServiceContainer>
    );
    return wrapped;
};

/**
 * Hook for consuming AppErrorUI context. Enables child controls to display an error on the AppErrorUI component.
 */
const useAlertMessageService = () => useContext(AlertServiceContext);

export { AlertServiceContext, AlertMessageServiceContainer, useAlertMessageService, withAlertMessageContainer };

/**
 * Description of a service which can display toast messages to the user.
 */
export type ToastService = {
    showToast: (message: Message) => void;
};

/**
 * React context for the alert message service.
 */
const ToastServiceContext = React.createContext<ToastService>({
    showToast: () => {},
});

/**
 * Message service container which can display a message.
 * It also provides the message service context so that a nested child component can also use the context to display a message.
 */

const ToastMessageServiceContainer = (props: React.PropsWithChildren<any>) => {
    const [toasts, setToasts] = useState<Message[]>([]);
    const [toastService] = useState<ToastService>({
        showToast: (message: Message) => {
            setToasts((current) => {
                console.log(`toast: displaying toast: ${message.caption}`);
                let newToasts = [...current];
                newToasts.push(message);
                return newToasts;
            });
        },
    });

    const onToastClose = (toast: Message) => {
        let index = toasts.indexOf(toast);
        let newToasts = [...toasts];
        newToasts.splice(index, 1);
        setToasts(newToasts);
    };

    return (
        <ToastServiceContext.Provider value={toastService}>
            {props.children}
            {toasts.length > 0 && (
                <ToastContainer className="m-5" position="bottom-center">
                    {toasts.map((t) => (
                        <Toast
                            bg={t.variant || "light"}
                            className={
                                t.variant === "primary" ||
                                t.variant === "description" ||
                                t.variant === "success" ||
                                t.variant === "danger" ||
                                t.variant === "black"
                                    ? "text-white"
                                    : "text-dark"
                            }
                            key={`${t.caption}${t.createdAt.toISOString()}`}
                            onClose={() => onToastClose(t)}
                            autohide>
                            <Toast.Header>
                                <strong className="me-auto">{t.caption}</strong>
                            </Toast.Header>
                            <Toast.Body>{t.description}</Toast.Body>
                        </Toast>
                    ))}
                </ToastContainer>
            )}
        </ToastServiceContext.Provider>
    );
};

/**
 * Higher order component which wraps the given component with ToastMessageServiceContainer.
 * Makes it easy to provide alert message per component.
 */
const withToastMessageContainer = (WrappedComponent: React.ComponentType) => {
    let wrapped: FunctionComponent = (props) => (
        <ToastMessageServiceContainer>
            <WrappedComponent {...props} />
        </ToastMessageServiceContainer>
    );
    return wrapped;
};

/**
 * Hook for consuming AppErrorUI context. Enables child controls to display an error on the AppErrorUI component.
 */
const useToastMessageService = () => useContext(ToastServiceContext);

export { ToastServiceContext, ToastMessageServiceContainer, useToastMessageService, withToastMessageContainer };

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
const useAbortableEffect = (effect: (signal: AbortSignal) => void, deps: DependencyList) => {
    useEffect(() => {
        let controller = new AbortController();
        effect(controller.signal);
        return () => controller.abort();
    }, deps);
};

export { useAbortableEffect, useAbortable };

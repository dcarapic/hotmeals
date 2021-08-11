import React, { Component, ErrorInfo, Fragment, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { Alert, Toast, ToastContainer } from "react-bootstrap";
import { Variant } from "react-bootstrap/esm/types";
import { FunctionComponent } from "react-dom/node_modules/@types/react";
import { ServerResponse } from "../api";

export type ErrorDescription = {
    caption: string;
    description?: string;
    variant?: Variant;
    useToast?: boolean;
};

/**
 * Object used with React context to hold information about a non-fatal error.
 */
export type ApplicationError = {
    hasError: boolean;
    error: ErrorDescription | null;
    setCurrentError: (errDesc: ErrorDescription) => void;
    setCurrentErrorFromResponse: (response: ServerResponse, caption?: string) => void;
    clearCurrentError: () => void;
};

/**
 * Non-fatal error React context.
 */
const AppErrorUIContext = React.createContext<ApplicationError>({
    hasError: false,
    error: null,
    setCurrentError: () => {},
    setCurrentErrorFromResponse: () => {},
    clearCurrentError: () => {},
});

/**
 * Helper function which generates an error description from a server response object.
 * In case there is no error then null is returned.
 */
const generateErrorDescriptionFromResponse = (response: ServerResponse, caption?: string): ErrorDescription | null => {
    if (response.ok) return null;
    let errDesc: ErrorDescription;
    if (response.isBadRequest)
        errDesc = {
            caption: caption || "Operation failed",
            description: response.errorDetails || "An error occurred while processing your request",
            useToast: false,
            variant: "warning",
        };
    else if (response.isAborted) return null;
    else
        errDesc = {
            caption: caption || "Operation failed",
            description: "An error occurred while processing your request",
            useToast: false,
            variant: "danger",
        };
    return errDesc;
};

/**
 * Wrapper component which provides application error context.
 * Whenever a child component wants to indicate that an error occurred this component will display it at the bottom of the page as a Bootstrap alert card.
 * Should mostly be used with withAppErrorUI hoc.
 * @param props
 * @returns
 */
const AppErrorUI: FunctionComponent = (props) => {
    const setCurrentErrorCore = (errDesc: ErrorDescription) => {
        setAppError({
            error: errDesc,
            hasError: true,
            setCurrentError: setCurrentErrorCore,
            setCurrentErrorFromResponse: setCurrentErrorFromResponseCore,
            clearCurrentError: clearCurrentErrorCore,
        });
    };
    const setCurrentErrorFromResponseCore = (response: ServerResponse, caption?: string) => {
        let errDesc: ErrorDescription | null = generateErrorDescriptionFromResponse(response, caption);
        if (!errDesc) return;
        setAppError({
            error: errDesc,
            hasError: true,
            setCurrentError: setCurrentErrorCore,
            setCurrentErrorFromResponse: setCurrentErrorFromResponseCore,
            clearCurrentError: clearCurrentErrorCore,
        });
    };
    const clearCurrentErrorCore = () => {
        setAppError({
            error: null,
            hasError: false,
            setCurrentError: setCurrentErrorCore,
            setCurrentErrorFromResponse: setCurrentErrorFromResponseCore,
            clearCurrentError: clearCurrentErrorCore,
        });
    };
    let [appError, setAppError] = useState<ApplicationError>({
        hasError: false,
        error: null,
        setCurrentError: setCurrentErrorCore,
        setCurrentErrorFromResponse: setCurrentErrorFromResponseCore,
        clearCurrentError: clearCurrentErrorCore,
    });

    return (
        <AppErrorUIContext.Provider value={appError}>
            <AppErrorUIInner>{props.children}</AppErrorUIInner>
        </AppErrorUIContext.Provider>
    );
};

/**
 * Internal component of AppErrorUI
 * @param props
 * @returns
 */
const AppErrorUIInner: FunctionComponent = (props) => {
    const errUI = useAppErrorUI();
    const alertRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (errUI.hasError && errUI.error && !errUI.error.useToast) alertRef.current?.scrollIntoView();
    });

    return (
        <Fragment>
            {props.children}
            {errUI.hasError && errUI.error && !errUI.error.useToast && (
                <Alert variant={errUI.error.variant || "danger"} ref={alertRef}>
                    <Alert.Heading>{errUI.error.caption}</Alert.Heading>
                    <p>{errUI.error.description}</p>
                </Alert>
            )}
            {errUI.hasError && errUI.error && errUI.error.useToast && (
                <ToastContainer position="bottom-center">
                    <Toast bg={errUI.error.variant || "danger"} onClose={() => errUI.clearCurrentError()}>
                        <Toast.Header>
                            <strong className="me-auto">{errUI.error.caption}</strong>
                        </Toast.Header>
                        <Toast.Body>{errUI.error.description}</Toast.Body>
                    </Toast>
                </ToastContainer>
            )}
        </Fragment>
    );
};

const APIError = (props: { response?: ServerResponse | null; caption?: string }) => {
    if (!props.response) {
        return null;
    }
    let errDesc: ErrorDescription | null = generateErrorDescriptionFromResponse(props.response, props.caption);
    if (!errDesc) return null;
    return (
        <Alert variant={errDesc.variant || "danger"}>
            <Alert.Heading>{errDesc.caption}</Alert.Heading>
            <p>{errDesc.description}</p>
        </Alert>
    );
};

/**
 * Higher order component which wraps the given component with AppErrorUI.
 * Makes it easy to provide error display UI per component.
 * @param WrappedComponent
 * @returns
 */
const withAppErrorUI = (WrappedComponent: React.ComponentType) => {
    let wrapped: FunctionComponent = (props) => (
        <AppErrorUI>
            <WrappedComponent {...props} />
        </AppErrorUI>
    );
    return wrapped;
};

/**
 * Hook for consuming AppErrorUI context. Enables child controls to display an error on the AppErrorUI component.
 */
const useAppErrorUI = () => useContext(AppErrorUIContext);

export { AppErrorUIContext, AppErrorUI, useAppErrorUI, withAppErrorUI, APIError };

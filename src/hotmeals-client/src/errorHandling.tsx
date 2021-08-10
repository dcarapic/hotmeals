import React, { Component, ErrorInfo, Fragment, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { Alert, Toast, ToastContainer } from "react-bootstrap";
import { Variant } from "react-bootstrap/esm/types";
import { FunctionComponent } from "react-dom/node_modules/@types/react";

/**
 * Properties for the ErrorBoundary object.
 */
interface ErrorBoundaryProps {
    children: ReactNode;
}

/**
 * ErrorBoundary state. We are only interested if an error occurred or not.
 */
interface ErrorBoundaryState {
    fatalError: boolean;
}
/**
 * React error boundary component. When a React rendering error occurs this component will replace the children with
 * an bootstrap alert displaying generic message and instructing the user to refresh the browser.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        fatalError: false,
    };

    /**
     * Required by react error boundary (https://reactjs.org/docs/error-boundaries.html)
     */
    public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
        return { fatalError: true };
    }

    /**
     * Required by react error boundary (https://reactjs.org/docs/error-boundaries.html)
     */
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.fatalError) {
            return (
                <Alert variant="danger">
                    <Alert.Heading>An error occurred!</Alert.Heading>
                    <p>It seems that an error occurred in the application. Please refresh your browser!</p>
                </Alert>
            );
        }
        return this.props.children;
    }
}

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
    clearCurrentError: () => void;
};

/**
 * Non-fatal error React context.
 */
const AppErrorUIContext = React.createContext<ApplicationError>({
    hasError: false,
    error: null,
    setCurrentError: () => {},
    clearCurrentError: () => {},
});

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
            clearCurrentError: clearCurrentErrorCore,
        });
    };
    const clearCurrentErrorCore = () => {
        setAppError({
            error: null,
            hasError: false,
            setCurrentError: setCurrentErrorCore,
            clearCurrentError: clearCurrentErrorCore,
        });
    };
    let [appError, setAppError] = useState<ApplicationError>({
        hasError: false,
        error: null,
        setCurrentError: setCurrentErrorCore,
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
    const toastRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (errUI.hasError && errUI.error && !errUI.error.useToast) alertRef.current?.scrollIntoView();
        if (errUI.hasError && errUI.error && errUI.error.useToast) toastRef.current?.scrollIntoView();
    });

    return (
        <Fragment>
            {props.children}
            {errUI.hasError && errUI.error && !errUI.error.useToast && (
                <Alert variant={errUI.error.variant || 'danger'} ref={alertRef}>
                    <Alert.Heading>{errUI.error.caption}</Alert.Heading>
                    <p>{errUI.error.description}</p>
                </Alert>
            )}
            {errUI.hasError && errUI.error && errUI.error.useToast && (
                <ToastContainer ref={toastRef} position='bottom-center'>
                    <Toast bg={errUI.error.variant || 'danger'} onClose={()=>errUI.clearCurrentError()}>
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

export { AppErrorUIContext, AppErrorUI, useAppErrorUI, withAppErrorUI, ErrorBoundary };

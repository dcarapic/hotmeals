import React, { Component, ErrorInfo, Fragment, ReactNode, useContext, useState } from "react";
import { Alert } from "react-bootstrap";
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

/**
 * Object used with React context to hold information about a non-fatal error.
 */
export type ApplicationError = {
    hasError: boolean;
    caption: string | null;
    description: string | null;
    setCurrentError: (caption?: string, description?: string) => void;
    clearCurrentError: () => void;
};

/**
 * Non-fatal error React context.
 */
const AppErrorUIContext = React.createContext<ApplicationError>({
    hasError: false,
    caption: null,
    description: null,
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
    const setCurrentErrorCore = (caption?: string, description?: string) => {
        setAppError({
            caption: caption || "An error occurred!",
            description: description || "An error occurred during processing.",
            hasError: true,
            setCurrentError: setCurrentErrorCore,
            clearCurrentError: clearCurrentErrorCore,
        });
    };
    const clearCurrentErrorCore = () => {
        setAppError({
            caption: null,
            description: null,
            hasError: false,
            setCurrentError: setCurrentErrorCore,
            clearCurrentError: clearCurrentErrorCore,
        });
    };
    let [appError, setAppError] = useState<ApplicationError>({
        hasError: false,
        caption: null,
        description: null,
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
    let errUI = useAppErrorUI();
    return (
        <Fragment>
            {props.children}
            {errUI.hasError && (
                <Alert variant="danger">
                    <Alert.Heading>{errUI.caption || "An error occurred!"}</Alert.Heading>
                    <p>{errUI.description || "An error occurred in the application"}</p>
                </Alert>
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

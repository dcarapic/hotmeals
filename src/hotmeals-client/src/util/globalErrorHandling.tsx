import React, { Component, ErrorInfo, Fragment, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { Alert, Toast, ToastContainer } from "react-bootstrap";
import { Variant } from "react-bootstrap/esm/types";
import { FunctionComponent } from "react-dom/node_modules/@types/react";
import { ServerResponse } from "../api";

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
export default class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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



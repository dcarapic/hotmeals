import React, { Fragment } from "react";
import { Button, ButtonProps } from "react-bootstrap";
import { Color } from "react-bootstrap/esm/types";
import Loading from "./Loading";

const LoadingButton = (props: ButtonProps & { loading: boolean }) => {
    // Replace button children with custom loading
    let { children, loading, ...otherProps } = props;
    let loadingVariant : Color = "light";
    switch(props.variant) {
        case 'primary':
            loadingVariant = "light";
            break;
        default:
            loadingVariant = "primary";
    }

    const c = loading ? (
                <Fragment>
                    <Loading variant={loadingVariant} style={{ width: "1.2rem" }} />
                    Please wait
                </Fragment>
            ) : props.children

    return (
        <Button {...otherProps} disabled={loading}>
            {c}
        </Button>
    );
};

export { LoadingButton };

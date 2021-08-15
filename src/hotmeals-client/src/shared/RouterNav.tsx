import React from "react";
import { Link, LinkProps } from "react-router-dom";

/** Router navigation link with bootstrap styling. */
const RouterNavLink = (props: LinkProps) => {
    // Merge 'className' into className and remove it from other props so that we do not override the default class name.
    var cn = `nav-link ${props.className}`
    let {className, ...cleanProps} = props;
    return (
        <Link className={cn} {...cleanProps}>
            {props.children}
        </Link>
    );
};

/** Router navigation button with bootstrap styling. */
const RouterNavButton = (props: LinkProps) => {
    // Merge 'className' into className and remove it from other props so that we do not override the default class name.
    var cn = `btn btn-primary ${props.className}`
    let {className, ...cleanProps} = props;
    return (
        <Link className={cn} {...cleanProps}>
            {props.children}
        </Link>
    );
};

export { RouterNavLink, RouterNavButton};

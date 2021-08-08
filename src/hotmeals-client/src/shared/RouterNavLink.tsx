import React from "react";
import { Link, LinkProps } from "react-router-dom";

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

export default RouterNavLink;

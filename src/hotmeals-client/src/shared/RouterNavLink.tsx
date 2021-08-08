import React from "react";
import { Link, LinkProps } from "react-router-dom";

const RouterNavLink = (props: LinkProps) => {
    var cn = `nav-link ${props.className}`
    let {className, ...cleanProps} = props;
    return (
        <Link className={cn} {...cleanProps}>
            {props.children}
        </Link>
    );
};

export default RouterNavLink;

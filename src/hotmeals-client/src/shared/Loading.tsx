import React from "react";
import { Color } from "react-bootstrap/esm/types";
import styles from "./Loading.module.css";

/** Loading animation. */
const Loading = (
    props: React.HTMLAttributes<HTMLDivElement> & {
        /** If true then a label is displayed */
        showLabel?: boolean;
        /** Bootstrap variant */
        variant?: Color;
        /** Specific label to display */
        label?: string;
    }
) => {
    // Merge 'className' into className and remove it from other props so that we do not override the default class name.
    var cn = `${styles.container} ${props.className}`;
    let { className, showLabel, ...cleanProps } = props;
    let color = props.variant || "primary";
    let colorClass = `bg-${color}`;

    return (
        <div className={cn} {...cleanProps}>
            <div className={styles.grid}>
                <div className={`${styles.skcube} ${styles.skcube1} ${colorClass}`}></div>
                <div className={`${styles.skcube} ${styles.skcube2} ${colorClass}`}></div>
                <div className={`${styles.skcube} ${styles.skcube3} ${colorClass}`}></div>
                <div className={`${styles.skcube} ${styles.skcube4} ${colorClass}`}></div>
                <div className={`${styles.skcube} ${styles.skcube5} ${colorClass}`}></div>
                <div className={`${styles.skcube} ${styles.skcube6} ${colorClass}`}></div>
                <div className={`${styles.skcube} ${styles.skcube7} ${colorClass}`}></div>
                <div className={`${styles.skcube} ${styles.skcube8} ${colorClass}`}></div>
                <div className={`${styles.skcube} ${styles.skcube9} ${colorClass}`}></div>
            </div>
            {showLabel && <div>{props.label || "Please wait ...."}</div>}
        </div>
    );
};

export default Loading;

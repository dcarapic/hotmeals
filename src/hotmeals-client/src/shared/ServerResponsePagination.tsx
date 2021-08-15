import React from "react";
import { Pagination } from "react-bootstrap";
import { PagingInformation } from "../util/api";

/** Component which displays pagination control based on the server response which is paginated. */
export const ServerResponsePagination = (props: {
    /** Server paging information */
    pageInfo: PagingInformation;
    /** Maximum number of displayed pages (default is 7) */
    maxDisplayedPages?: number;
    /** Handler when user navigates to specific page */
    onPageChanged: (page: number) => void;
    /** Disables pagination */
    disabled?: boolean;
}) => {
    // We need to calculate the actual range of page numbers to display
    const maxDisplayedPages = props.maxDisplayedPages || 7;
    let displayStart = props.pageInfo.page - Math.floor(maxDisplayedPages / 2);
    if (displayStart < 1) displayStart = 1;
    let displayEnd = displayStart + maxDisplayedPages;
    if (displayEnd > props.pageInfo.totalPages) displayEnd = props.pageInfo.totalPages;
    var pages = [];
    // Build up the page number items
    for (let i = displayStart; i <= displayEnd; i++) {
        pages.push(
            <Pagination.Item
                key={i}
                active={i === props.pageInfo.page}
                disabled={props.disabled}
                onClick={() => props.onPageChanged(i)}>
                {i}
            </Pagination.Item>
        );
    }
    return (
        <Pagination>
            <Pagination.First
                disabled={props.disabled || props.pageInfo.page === 1}
                onClick={() => props.onPageChanged(1)}
            />
            <Pagination.Prev
                disabled={props.disabled || props.pageInfo.page === 1}
                onClick={() => props.onPageChanged(props.pageInfo.page - 1)}
            />
            {/* If the range does not start at 1 then show ellipsis in front */}
            {displayStart !== 1 && <Pagination.Ellipsis disabled={true} />}
            {pages}
            {/* If the range does not end on the last page then show ellipsis on the back */}
            {displayEnd !== props.pageInfo.totalPages && <Pagination.Ellipsis disabled={true} />}
            <Pagination.Next
                disabled={props.disabled || props.pageInfo.page === props.pageInfo.totalPages}
                onClick={() => props.onPageChanged(props.pageInfo.page + 1)}
            />
            <Pagination.Last
                disabled={props.disabled || props.pageInfo.page === props.pageInfo.totalPages}
                onClick={() => props.onPageChanged(props.pageInfo.totalPages)}
            />
        </Pagination>
    );
};

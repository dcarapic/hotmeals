import React from "react";
import { Pagination } from "react-bootstrap";
import { PagingInformation } from "../util/api";

export const ServerResponsePagination = (props: {
    pageInfo: PagingInformation;
    maxDisplayedPages?: number;
    onPageChanged: (page: number) => void;
    disabled?: boolean;
}) => {
    const maxDisplayedPages = props.maxDisplayedPages || 7;
    let displayStart = props.pageInfo.page - Math.floor(maxDisplayedPages / 2);
    if (displayStart < 1) displayStart = 1;
    let displayEnd = displayStart + maxDisplayedPages;
    if (displayEnd > props.pageInfo.totalPages) displayEnd = props.pageInfo.totalPages;
    var pages = [];
    for (let i = displayStart; i <= displayEnd; i++) {
        pages.push(
            <Pagination.Item
                key={i}
                active={i == props.pageInfo.page}
                disabled={props.disabled}
                onClick={() => props.onPageChanged(i)}>
                {i}
            </Pagination.Item>
        );
    }
    return (
        <Pagination>
            <Pagination.First
                disabled={props.disabled || props.pageInfo.page == 1}
                onClick={() => props.onPageChanged(1)}
            />
            <Pagination.Prev
                disabled={props.disabled || props.pageInfo.page == 1}
                onClick={() => props.onPageChanged(props.pageInfo.page - 1)}
            />
            {displayStart != 1 && <Pagination.Ellipsis disabled={true} />}
            {pages}
            {displayEnd != props.pageInfo.totalPages && <Pagination.Ellipsis disabled={true} />}
            <Pagination.Next
                disabled={props.disabled || props.pageInfo.page == props.pageInfo.totalPages}
                onClick={() => props.onPageChanged(props.pageInfo.page + 1)}
            />
            <Pagination.Last
                disabled={props.disabled || props.pageInfo.page == props.pageInfo.totalPages}
                onClick={() => props.onPageChanged(props.pageInfo.totalPages)}
            />
        </Pagination>
    );
};
